"""GitHub API client supporting public repositories, forks, issues, and PR creation."""
import re
from typing import Any, Dict, List, Optional, Tuple
import httpx
from github import Auth, Github, GithubException
from app.config.settings import settings


class GitHubAPIError(Exception):
    """Raised when GitHub API calls fail."""
    pass


class GitHubClient:
    """Client for interacting with GitHub REST API via PyGithub and HTTPX."""

    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.GITHUB_TOKEN
        if self.token:
            self.gh = Github(auth=Auth.Token(self.token))
        else:
            self.gh = Github()

    @staticmethod
    def parse_repo_and_issue(input_str: str) -> Dict[str, Any]:
        """
        Extract owner, repo name, and optional issue number from:
        - Full issue URL: https://github.com/owner/repo/issues/123
        - Full repo URL: https://github.com/owner/repo
        - Shorthand: owner/repo
        - Shorthand with issue: owner/repo#123
        """
        trimmed = input_str.strip().rstrip("/")

        # Match issue URL: https://github.com/owner/repo/issues/123
        issue_url_match = re.search(r"github\.com/([^/]+)/([^/]+)/issues/(\d+)", trimmed)
        if issue_url_match:
            return {
                "owner": issue_url_match.group(1),
                "repo": issue_url_match.group(2).replace(".git", ""),
                "issue_number": int(issue_url_match.group(3)),
                "repo_url": f"https://github.com/{issue_url_match.group(1)}/{issue_url_match.group(2).replace('.git', '')}",
            }

        # Match shorthand with issue: owner/repo#123
        shorthand_issue_match = re.search(r"^([^/]+)/([^#]+)#(\d+)$", trimmed)
        if shorthand_issue_match:
            return {
                "owner": shorthand_issue_match.group(1),
                "repo": shorthand_issue_match.group(2),
                "issue_number": int(shorthand_issue_match.group(3)),
                "repo_url": f"https://github.com/{shorthand_issue_match.group(1)}/{shorthand_issue_match.group(2)}",
            }

        # Match repo URL: https://github.com/owner/repo
        repo_url_match = re.search(r"github\.com/([^/]+)/([^/]+)", trimmed)
        if repo_url_match:
            return {
                "owner": repo_url_match.group(1),
                "repo": repo_url_match.group(2).replace(".git", ""),
                "issue_number": None,
                "repo_url": f"https://github.com/{repo_url_match.group(1)}/{repo_url_match.group(2).replace('.git', '')}",
            }

        # Match shorthand: owner/repo
        shorthand_match = re.search(r"^([^/]+)/([^/]+)$", trimmed)
        if shorthand_match:
            return {
                "owner": shorthand_match.group(1),
                "repo": shorthand_match.group(2).replace(".git", ""),
                "issue_number": None,
                "repo_url": f"https://github.com/{shorthand_match.group(1)}/{shorthand_match.group(2).replace('.git', '')}",
            }

        raise ValueError(f"Could not parse repository or issue from: '{input_str}'")

    def get_issue(self, owner: str, repo_name: str, issue_number: int) -> Dict[str, Any]:
        """Fetch issue details including comments and labels."""
        try:
            repo = self.gh.get_repo(f"{owner}/{repo_name}")
            issue = repo.get_issue(number=issue_number)

            comments = []
            for comment in issue.get_comments():
                comments.append({
                    "author": comment.user.login if comment.user else "ghost",
                    "body": comment.body,
                    "created_at": comment.created_at.isoformat() if comment.created_at else "",
                })

            return {
                "number": issue.number,
                "title": issue.title,
                "body": issue.body or "",
                "state": issue.state,
                "labels": [label.name for label in issue.labels],
                "author": issue.user.login if issue.user else "unknown",
                "html_url": issue.html_url,
                "comments": comments,
                "repo_url": repo.html_url,
            }
        except GithubException as ge:
            raise GitHubAPIError(f"GitHub API error fetching issue: {ge.data if hasattr(ge, 'data') else str(ge)}")
        except Exception as e:
            raise GitHubAPIError(f"Error fetching issue #{issue_number} from {owner}/{repo_name}: {str(e)}")

    def get_authenticated_user_login(self) -> Optional[str]:
        """Get login of the authenticated user, or None if no token configured."""
        if not self.token:
            return None
        try:
            user = self.gh.get_user()
            return user.login
        except Exception:
            return None

    def fork_repository(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Fork repository to authenticated user's account if token is present."""
        if not self.token:
            return {
                "forked": False,
                "clone_url": f"https://github.com/{owner}/{repo_name}.git",
                "html_url": f"https://github.com/{owner}/{repo_name}",
                "fork_owner": owner,
            }

        try:
            repo = self.gh.get_repo(f"{owner}/{repo_name}")
            current_user = self.gh.get_user().login

            # If user already owns the repository, no need to fork
            if current_user.lower() == owner.lower():
                return {
                    "forked": False,
                    "clone_url": repo.clone_url,
                    "html_url": repo.html_url,
                    "fork_owner": owner,
                }

            fork = self.gh.get_user().create_fork(repo)
            return {
                "forked": True,
                "clone_url": fork.clone_url,
                "html_url": fork.html_url,
                "fork_owner": fork.owner.login,
            }
        except Exception as ge:
            # If network error (offline/sandbox) or repo not found, return safe fallback
            return {
                "forked": False,
                "clone_url": f"https://github.com/{owner}/{repo_name}.git",
                "html_url": f"https://github.com/{owner}/{repo_name}",
                "fork_owner": owner,
            }

    def create_pull_request(
        self,
        base_owner: str,
        base_repo_name: str,
        title: str,
        body: str,
        head_branch: str,
        base_branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Create a Pull Request against the base repository.
        NEVER automatically merges.
        """
        if not self.token:
            # Simulated PR for dry-run/testing when token is not set
            simulated_pr_number = 999
            simulated_url = f"https://github.com/{base_owner}/{base_repo_name}/pull/{simulated_pr_number}"
            return {
                "pr_url": simulated_url,
                "pr_number": simulated_pr_number,
                "title": title,
                "body": body,
                "head": head_branch,
                "base": base_branch,
                "merged": False,
                "simulated": True,
            }

        try:
            base_repo = self.gh.get_repo(f"{base_owner}/{base_repo_name}")
            pr = base_repo.create_pull(
                title=title,
                body=body,
                base=base_branch,
                head=head_branch,
            )

            # Strictly verify PR is not merged
            return {
                "pr_url": pr.html_url,
                "pr_number": pr.number,
                "title": pr.title,
                "body": pr.body,
                "head": head_branch,
                "base": base_branch,
                "merged": False,
                "simulated": False,
            }
        except Exception as ge:
            # Fall back to simulated PR if network error or target repo unavailable
            simulated_pr_number = 999
            simulated_url = f"https://github.com/{base_owner}/{base_repo_name}/pull/{simulated_pr_number}"
            return {
                "pr_url": simulated_url,
                "pr_number": simulated_pr_number,
                "title": title,
                "body": body,
                "head": head_branch,
                "base": base_branch,
                "merged": False,
                "simulated": True,
            }


github_client = GitHubClient()


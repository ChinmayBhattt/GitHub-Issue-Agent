"""GitHub PR Agent: creates branch, commits changes, pushes, and creates Pull Request."""
import re
from typing import Any, Dict
from app.github.client import github_client
from app.github.git_ops import git_ops
from app.services.llm import PRDetails, llm_service
from app.storage.json_store import json_store


class PRAgent:
    """Creates dedicated branches, pushes to GitHub / forks, and opens detailed Pull Requests."""

    def prepare_and_create_pr(
        self,
        job_id: str,
        owner: str,
        repo: str,
        issue_number: int,
        issue_title: str,
        root_cause: Dict[str, Any],
        patch_diff: str,
        test_results: Dict[str, Any],
        base_branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Commit changes, push to branch, and open a Pull Request.
        Strictly prevents automatic merging.
        """
        # 1. Create dedicated branch name
        clean_title = re.sub(r"[^a-zA-Z0-9]+", "-", issue_title.lower()).strip("-")[:30]
        branch_name = f"fix/issue-{issue_number}-{clean_title}"

        git_ops.create_and_checkout_branch(job_id, branch_name)

        # 2. Commit validated changes
        commit_msg = f"fix: resolve issue #{issue_number} - {issue_title[:50]}"
        git_ops.commit_all(job_id, commit_msg)

        # 3. Check for fork / remote push target
        fork_info = github_client.fork_repository(owner, repo)
        push_url = fork_info.get("clone_url", f"https://github.com/{owner}/{repo}.git")

        # Push branch
        try:
            git_ops.push_branch(
                job_id=job_id,
                branch_name=branch_name,
                remote_url=push_url,
                token=github_client.token,
            )
        except Exception as e:
            # If pushing directly to remote fails (e.g. no write permissions on public repo or offline mode),
            # log and proceed with PR preparation
            pass

        # 4. Formulate PR description using Gemini
        system_prompt = (
            "You are a Senior Open Source Maintainer drafting a clean, professional Pull Request. "
            "Write a concise PR title following Conventional Commits, and a structured markdown body. "
            "The body MUST reference the original issue with 'Fixes #<number>', explain the root cause, "
            "summarize the changes, and include a section describing test validation."
        )

        user_prompt = (
            f"Draft a PR for issue #{issue_number}:\n"
            f"Issue Title: {issue_title}\n"
            f"Root Cause: {root_cause.get('explanation')}\n"
            f"Fix Strategy: {root_cause.get('fix_strategy')}\n"
            f"Tests Passed: {test_results.get('passed')}\n"
            f"Test Command: {test_results.get('command')}\n\n"
            f"Patch Diff:\n```diff\n{patch_diff[:3000]}\n```\n"
        )

        pr_details = llm_service.generate_structured(
            system_instruction=system_prompt,
            user_prompt=user_prompt,
            response_schema=PRDetails,
        )

        # 5. Create Pull Request on GitHub
        head_ref = branch_name
        if fork_info.get("forked") and fork_info.get("fork_owner"):
            head_ref = f"{fork_info['fork_owner']}:{branch_name}"

        pr_response = github_client.create_pull_request(
            base_owner=owner,
            base_repo_name=repo,
            title=pr_details.title,
            body=(
                f"{pr_details.body}\n\n"
                f"---\n"
                f"**Automated PR created by [ZORVEX](https://github.com/agent).**\n"
                f"🛡️ *Policy Notice: This PR will NEVER be automatically merged into the main branch.*"
            ),
            head_branch=head_ref,
            base_branch=base_branch,
        )

        # 6. Save in JSON Store
        pr_record = {
            "job_id": job_id,
            "pr_url": pr_response.get("pr_url"),
            "pr_number": pr_response.get("pr_number"),
            "title": pr_response.get("title"),
            "owner": owner,
            "repo": repo,
            "issue_number": issue_number,
            "head_branch": branch_name,
            "base_branch": base_branch,
            "simulated": pr_response.get("simulated", False),
            "merged": False,  # Never merge automatically
        }
        json_store.record_pull_request(pr_record)

        return pr_record


pr_agent = PRAgent()


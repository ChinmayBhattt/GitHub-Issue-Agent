"""Issue Understanding Agent: classifies issue, extracts severity, and checks actionability."""
from typing import Any, Dict
from app.services.llm import IssueClassification, llm_service


class IssueAnalyzerAgent:
    """Understands and categorizes GitHub issues using Gemini with structured output."""

    def analyze_issue(self, title: str, body: str, labels: list[str]) -> IssueClassification:
        """Analyze issue content and return structured classification."""
        system_prompt = (
            "You are an expert Issue Triage and Understanding Agent. "
            "Analyze the given GitHub issue title, body, and labels. "
            "Classify into category (Bug, Feature Request, Security, Documentation, Enhancement), "
            "severity (Low, Medium, High, Critical), priority (P0, P1, P2, P3), "
            "and determine if it is actionable with enough detail to locate and fix the issue. "
            "If missing critical info (reproduction steps, stack traces, expected vs actual), note it in missing_info."
        )

        untrusted_title = llm_service.wrap_untrusted(title, tag="ISSUE_TITLE")
        untrusted_body = llm_service.wrap_untrusted(body, tag="ISSUE_BODY")
        labels_str = ", ".join(labels) if labels else "None"

        user_prompt = (
            f"Please triage and understand this issue:\n\n"
            f"Labels: {labels_str}\n"
            f"Title: {untrusted_title}\n"
            f"Body:\n{untrusted_body}\n"
        )

        classification = llm_service.generate_structured(
            system_instruction=system_prompt,
            user_prompt=user_prompt,
            response_schema=IssueClassification,
        )

        return classification


issue_analyzer = IssueAnalyzerAgent()


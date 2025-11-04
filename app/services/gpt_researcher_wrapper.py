"""
GPT Researcher wrapper service.
Handles integration with the GPT Researcher library.
"""

import json
import os
from typing import Any, Dict, List, Optional

from fastapi import WebSocket

from app.config.base import config


class ResearchResult:
    """Container for research results."""

    def __init__(
        self,
        report: str,
        sources: List[Dict[str, Any]],
        cost: float,
        report_markdown: str = "",
        report_html: str = "",
    ):
        self.report = report
        self.sources = sources
        self.cost = cost
        self.report_markdown = report_markdown
        self.report_html = report_html


class WebSocketManager:
    """Manager for WebSocket connections and progress streaming."""

    def __init__(self, websocket: Optional[WebSocket] = None):
        self.websocket = websocket

    async def send_progress(self, message_type: str, content: str = "", progress: float = 0.0):
        """Send progress update via WebSocket."""
        if self.websocket:
            try:
                await self.websocket.send_json({
                    "type": message_type,
                    "content": content,
                    "progress": progress,
                })
            except Exception as e:
                print(f"Error sending WebSocket message: {e}")

    async def send_log(self, message: str):
        """Send log message via WebSocket."""
        await self.send_progress("log", content=message)

    async def send_error(self, error: str):
        """Send error message via WebSocket."""
        await self.send_progress("error", content=error)

    async def send_completion(self, cost: float):
        """Send completion message via WebSocket."""
        await self.send_progress("complete", content="Research completed", progress=100.0)


class GPTResearcherWrapper:
    """
    Wrapper for GPT Researcher library.
    Handles configuration, execution, and result extraction.
    """

    def __init__(
        self,
        query: str,
        report_type: str = "research_report",
        tone: str = "objective",
        retrievers: List[str] = None,
        websocket_manager: Optional[WebSocketManager] = None,
        max_iterations: int = 5,
    ):
        """
        Initialize GPT Researcher wrapper.

        Args:
            query: Research question
            report_type: Type of report to generate
            tone: Tone of the report
            retrievers: List of retrievers to use
            websocket_manager: WebSocket manager for progress updates
            max_iterations: Maximum number of research iterations
        """
        self.query = query
        self.report_type = report_type
        self.tone = tone
        self.retrievers = retrievers or ["tavily"]
        self.websocket_manager = websocket_manager or WebSocketManager()
        self.max_iterations = max_iterations
        self.cost = 0.0

        # Set environment variables for GPT Researcher
        self._setup_environment()

    def _setup_environment(self):
        """Set up environment variables for GPT Researcher."""
        # OpenAI API key (required)
        if config.openai_api_key:
            os.environ["OPENAI_API_KEY"] = config.openai_api_key

        # Tavily API key (most common)
        if config.tavily_api_key:
            os.environ["TAVILY_API_KEY"] = config.tavily_api_key

        # Optional retrievers
        if config.google_api_key:
            os.environ["GOOGLE_API_KEY"] = config.google_api_key
        if config.google_cx:
            os.environ["GOOGLE_CX"] = config.google_cx
        if config.bing_api_key:
            os.environ["BING_API_KEY"] = config.bing_api_key
        if config.serper_api_key:
            os.environ["SERPER_API_KEY"] = config.serper_api_key
        if config.serpapi_api_key:
            os.environ["SERPAPI_API_KEY"] = config.serpapi_api_key

    async def conduct_research(self) -> ResearchResult:
        """
        Execute research using GPT Researcher.

        Returns:
            ResearchResult containing report and metadata
        """
        try:
            # Import GPT Researcher (lazy import to avoid dependency issues)
            from gpt_researcher import GPTResearcher

            await self.websocket_manager.send_log(f"Starting research: {self.query}")

            # Initialize researcher
            researcher = GPTResearcher(
                query=self.query,
                report_type=self.report_type,
                tone=self.tone,
                config_path=None,
            )

            # Conduct research with progress updates
            await self.websocket_manager.send_progress("progress", "Gathering sources...", 20.0)

            # Run the research
            report = await researcher.conduct_research()

            await self.websocket_manager.send_progress("progress", "Generating report...", 80.0)

            # Generate the report
            report_markdown = await researcher.write_report()

            await self.websocket_manager.send_progress("progress", "Finalizing...", 95.0)

            # Extract sources
            sources = self._extract_sources(researcher)

            # Calculate cost (estimate based on report length)
            self.cost = self._estimate_cost(report_markdown, len(sources))

            # Create result
            result = ResearchResult(
                report=report,
                sources=sources,
                cost=self.cost,
                report_markdown=report_markdown,
                report_html="",  # GPT Researcher can generate HTML if needed
            )

            await self.websocket_manager.send_completion(self.cost)

            return result

        except Exception as e:
            await self.websocket_manager.send_error(str(e))
            raise

    def _extract_sources(self, researcher: Any) -> List[Dict[str, Any]]:
        """
        Extract sources from GPT Researcher results.

        Args:
            researcher: GPT Researcher instance

        Returns:
            List of source dictionaries
        """
        sources = []

        try:
            # GPT Researcher stores sources in context
            if hasattr(researcher, "get_source_urls"):
                source_urls = researcher.get_source_urls()
                for url in source_urls:
                    sources.append({
                        "url": url,
                        "title": None,
                        "summary": None,
                        "retriever": self.retrievers[0] if self.retrievers else "unknown",
                        "relevance_score": None,
                    })
        except Exception as e:
            print(f"Error extracting sources: {e}")

        return sources

    def _estimate_cost(self, report: str, num_sources: int) -> float:
        """
        Estimate the cost of the research.

        Args:
            report: Generated report text
            num_sources: Number of sources used

        Returns:
            Estimated cost in USD
        """
        # Rough estimation based on:
        # - GPT-4 API costs
        # - Number of tokens in report
        # - Number of sources processed

        report_length = len(report)
        tokens_estimate = report_length / 4  # Rough estimate

        # Assuming GPT-4 pricing: $0.03 per 1K input tokens, $0.06 per 1K output tokens
        input_cost = (num_sources * 1000 / 1000) * 0.03  # Sources as input
        output_cost = (tokens_estimate / 1000) * 0.06  # Report as output

        total_cost = input_cost + output_cost

        # Add search API costs (if using Tavily)
        if "tavily" in self.retrievers:
            search_cost = num_sources * 0.001  # $0.001 per search
            total_cost += search_cost

        return round(total_cost, 4)

    async def chat_with_research(self, report: str, question: str) -> str:
        """
        Chat about research results using GPT.

        Args:
            report: Research report content
            question: User's question

        Returns:
            AI response
        """
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=config.openai_api_key)

            messages = [
                {
                    "role": "system",
                    "content": f"You are a helpful assistant discussing research findings. Here is the research report:\n\n{report}",
                },
                {"role": "user", "content": question},
            ]

            response = await client.chat.completions.create(
                model="gpt-4o-mini",  # Using cheaper model for chat
                messages=messages,
                max_tokens=500,
            )

            return response.choices[0].message.content or "No response generated."

        except Exception as e:
            raise Exception(f"Error in chat: {str(e)}")

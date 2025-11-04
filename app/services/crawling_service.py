"""
Service for managing web crawling and content extraction.
"""
import asyncio
import datetime
import uuid
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import CrawlJob, Page, PageData, Project
from app.utils.extraction import extract_all_content, calculate_content_quality_score
from app.utils.helpers import get_utcnow


class CrawlingService:
    """Service for crawling websites and extracting content."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def start_crawl_job(self, project_id: uuid.UUID) -> CrawlJob:
        """
        Start a new crawl job for a project.

        Args:
            project_id: The project ID to crawl

        Returns:
            The created CrawlJob instance
        """
        # Get project with sitemap URL
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Create crawl job
        crawl_job = CrawlJob(
            project_id=project_id,
            phase="discovering",
            status="running",
            started_at=get_utcnow(),
        )
        self.db.add(crawl_job)
        await self.db.commit()
        await self.db.refresh(crawl_job)

        return crawl_job

    async def discover_urls_from_sitemap(
        self, sitemap_url: str, base_url: str
    ) -> List[str]:
        """
        Discover URLs from a sitemap.xml file.

        Args:
            sitemap_url: URL to the sitemap.xml
            base_url: Base URL of the website

        Returns:
            List of discovered URLs
        """
        urls = []

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(sitemap_url)
                response.raise_for_status()

                soup = BeautifulSoup(response.content, "lxml-xml")

                # Extract URLs from <loc> tags
                for loc in soup.find_all("loc"):
                    url = loc.get_text(strip=True)
                    if url:
                        urls.append(url)

        except Exception as e:
            print(f"Error parsing sitemap {sitemap_url}: {e}")

        return urls

    async def discover_urls_from_crawl4ai(
        self, start_url: str, max_pages: int = 100
    ) -> List[str]:
        """
        Discover URLs by crawling with Crawl4AI.

        Args:
            start_url: Starting URL to crawl from
            max_pages: Maximum number of pages to discover

        Returns:
            List of discovered URLs
        """
        urls = set()
        urls.add(start_url)

        try:
            parsed_base = urlparse(start_url)
            base_domain = f"{parsed_base.scheme}://{parsed_base.netloc}"

            async with AsyncWebCrawler(headless=True) as crawler:
                # Crawl the start page
                result = await crawler.arun(url=start_url)

                if result.success and result.html:
                    # Extract links from the page
                    soup = BeautifulSoup(result.html, "lxml")

                    for a_tag in soup.find_all("a", href=True):
                        href = a_tag.get("href", "").strip()

                        # Skip anchors, javascript, mailto, tel links
                        if href.startswith(
                            ("#", "javascript:", "mailto:", "tel:")
                        ) or not href:
                            continue

                        # Convert relative URLs to absolute
                        absolute_url = urljoin(start_url, href)

                        # Only include URLs from the same domain
                        parsed_url = urlparse(absolute_url)
                        if f"{parsed_url.scheme}://{parsed_url.netloc}" == base_domain:
                            # Remove fragments and query params for cleaner URLs
                            clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                            urls.add(clean_url)

                        if len(urls) >= max_pages:
                            break

        except Exception as e:
            print(f"Error discovering URLs from {start_url}: {e}")

        return list(urls)

    async def discover_urls(
        self, crawl_job: CrawlJob, project: Project
    ) -> Tuple[List[str], str]:
        """
        Discover all URLs for a project using available methods.

        Args:
            crawl_job: The crawl job instance
            project: The project instance

        Returns:
            Tuple of (list of URLs, discovery method used)
        """
        urls = []
        method = "manual"

        # Method 1: Try sitemap if available
        if project.sitemap_url:
            urls = await self.discover_urls_from_sitemap(
                project.sitemap_url, project.url
            )
            if urls:
                method = "sitemap"

        # Method 2: Fallback to Crawl4AI discovery
        if not urls:
            urls = await self.discover_urls_from_crawl4ai(project.url, max_pages=100)
            if urls:
                method = "crawl4ai"

        # Update crawl job with discovery results
        crawl_job.urls_discovered = len(urls)
        crawl_job.discovery_method = method

        await self.db.commit()

        return urls, method

    async def test_extraction_method_crawl4ai(
        self, url: str
    ) -> Tuple[Optional[str], float, int]:
        """
        Test Crawl4AI extraction method on a URL.

        Args:
            url: URL to test

        Returns:
            Tuple of (HTML content, extraction time, quality score)
        """
        start_time = datetime.datetime.now()

        try:
            async with AsyncWebCrawler(headless=True) as crawler:
                result = await crawler.arun(url=url)

                if result.success and result.html:
                    extraction_time = (
                        datetime.datetime.now() - start_time
                    ).total_seconds()
                    quality_score = calculate_content_quality_score(result.html)

                    return result.html, extraction_time, quality_score

        except Exception as e:
            import traceback
            print(f"Crawl4AI test failed for {url}: {e}")
            print(f"Full traceback: {traceback.format_exc()}")

        return None, 0.0, 0

    async def test_extraction_method_jina(
        self, url: str
    ) -> Tuple[Optional[str], float, int]:
        """
        Test Jina AI Reader extraction method on a URL.

        Args:
            url: URL to test

        Returns:
            Tuple of (HTML content, extraction time, quality score)
        """
        start_time = datetime.datetime.now()

        try:
            jina_url = f"https://r.jina.ai/{url}"

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(jina_url)
                response.raise_for_status()

                # Jina returns markdown, but we need HTML for consistency
                # For now, we'll treat the markdown as text content
                html_content = f"<html><body><pre>{response.text}</pre></body></html>"

                extraction_time = (
                    datetime.datetime.now() - start_time
                ).total_seconds()
                quality_score = calculate_content_quality_score(html_content)

                return html_content, extraction_time, quality_score

        except Exception as e:
            print(f"Jina AI test failed for {url}: {e}")

        return None, 0.0, 0

    async def test_extraction_methods(
        self, test_urls: List[str]
    ) -> Tuple[str, Dict]:
        """
        Test multiple extraction methods and pick the winner.

        Scoring criteria:
        - Success rate (50 points max)
        - Average quality score (30 points max)
        - Speed (20 points max)

        Args:
            test_urls: List of URLs to test (up to 5)

        Returns:
            Tuple of (winning method name, test results dict)
        """
        methods = {
            "crawl4ai": self.test_extraction_method_crawl4ai,
            "jina": self.test_extraction_method_jina,
        }

        test_results = {}

        for method_name, method_func in methods.items():
            successes = 0
            total_time = 0.0
            total_quality = 0
            attempts = 0

            for url in test_urls[:5]:  # Test on max 5 URLs
                html, extraction_time, quality_score = await method_func(url)

                if html:
                    successes += 1
                    total_time += extraction_time
                    total_quality += quality_score

                attempts += 1

            # Calculate scores
            success_rate = (successes / attempts) * 100 if attempts > 0 else 0
            avg_quality = (total_quality / successes) if successes > 0 else 0
            avg_time = (total_time / successes) if successes > 0 else 0

            # Score calculation
            success_score = (success_rate / 100) * 50  # 50 points max
            quality_score_points = (avg_quality / 100) * 30  # 30 points max

            # Speed score (faster is better, under 2 seconds = full points)
            if avg_time == 0:
                speed_score = 0
            elif avg_time <= 2.0:
                speed_score = 20
            elif avg_time <= 5.0:
                speed_score = 15
            elif avg_time <= 10.0:
                speed_score = 10
            else:
                speed_score = 5

            total_score = success_score + quality_score_points + speed_score

            test_results[method_name] = {
                "success_rate": round(success_rate, 2),
                "avg_quality": round(avg_quality, 2),
                "avg_time": round(avg_time, 2),
                "total_score": round(total_score, 2),
            }

        # Pick the winner
        winner = max(test_results.items(), key=lambda x: x[1]["total_score"])
        winning_method = winner[0]

        return winning_method, test_results

    async def extract_page_content(
        self, url: str, method: str
    ) -> Optional[Dict]:
        """
        Extract content from a page using the specified method.

        Args:
            url: URL to extract content from
            method: Extraction method to use

        Returns:
            Extracted content dictionary or None on failure
        """
        print(f"🔵 extract_page_content called: url={url}, method={method}")
        html = None

        try:
            if method == "crawl4ai":
                print(f"🔵 Using Crawl4AI for {url}")
                async with AsyncWebCrawler(headless=True) as crawler:
                    print(f"🔵 Crawler created, calling arun...")
                    result = await crawler.arun(url=url)
                    print(f"🔵 Crawl4AI result: success={result.success}, has_html={bool(result.html)}")
                    if result.success and result.html:
                        html = result.html
                        print(f"🔵 Got HTML, length={len(html)}")
                    else:
                        print(f"🔴 Crawl4AI failed or no HTML returned")

            elif method == "jina":
                print(f"🔵 Using Jina AI for {url}")
                jina_url = f"https://r.jina.ai/{url}"
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(jina_url)
                    response.raise_for_status()
                    html = f"<html><body><pre>{response.text}</pre></body></html>"
                    print(f"🔵 Got Jina response, length={len(html)}")

            if html:
                print(f"🔵 Extracting content from HTML...")
                content = extract_all_content(html)
                print(f"🔵 Content extraction result: {bool(content)}")
                return content
            else:
                print(f"🔴 No HTML to extract from")

        except Exception as e:
            import traceback
            print(f"🔴 Error extracting content from {url} with {method}: {e}")
            print(f"Full traceback: {traceback.format_exc()}")

        return None

    async def save_page_data(
        self, page: Page, content_dict: Dict
    ) -> None:
        """
        Save extracted page data to the database.

        Args:
            page: The page instance
            content_dict: Dictionary of extracted content
        """
        # Save different types of data
        data_types = {
            # Meta tags
            "meta_title": {"title": content_dict.get("meta_title")},
            "meta_description": {"description": content_dict.get("meta_description")},
            "meta_keywords": {"keywords": content_dict.get("meta_keywords")},
            "meta_robots": {"robots": content_dict.get("meta_robots")},
            "meta_author": {"author": content_dict.get("meta_author")},

            # Heading tags
            "h1": {"tags": content_dict.get("h1_tags", [])},
            "h2": {"tags": content_dict.get("h2_tags", [])},
            "h3": {"tags": content_dict.get("h3_tags", [])},
            "h4": {"tags": content_dict.get("h4_tags", [])},
            "h5": {"tags": content_dict.get("h5_tags", [])},
            "h6": {"tags": content_dict.get("h6_tags", [])},

            # Structured data
            "schema": {"markup": content_dict.get("schema_markup", [])},

            # Body content
            "body": {
                "markdown": content_dict.get("body_markdown"),
                "text": content_dict.get("body_text"),
                "word_count": content_dict.get("word_count"),
                "char_count": content_dict.get("char_count"),
            },

            # Links and images
            "links": {"links": content_dict.get("links", [])},
            "images": {"images": content_dict.get("images", [])},

            # SEO and social
            "canonical_url": {"url": content_dict.get("canonical_url")},
            "og_tags": content_dict.get("og_tags", {}),
            "twitter_tags": content_dict.get("twitter_tags", {}),

            # Other
            "language": {"language": content_dict.get("language")},
            "favicon": {"url": content_dict.get("favicon")},
            "quality_score": {"score": content_dict.get("quality_score", 0)},
        }

        for data_type, content in data_types.items():
            page_data = PageData(
                page_id=page.id,
                data_type=data_type,
                content=content,
                extracted_at=get_utcnow(),
            )
            self.db.add(page_data)

        await self.db.commit()

    async def execute_discovery_phase(
        self, crawl_job_id: uuid.UUID
    ) -> None:
        """
        Execute the discovery phase of a crawl job.

        Args:
            crawl_job_id: ID of the crawl job
        """
        # Get crawl job and project
        result = await self.db.execute(
            select(CrawlJob).where(CrawlJob.id == crawl_job_id)
        )
        crawl_job = result.scalar_one_or_none()

        if not crawl_job:
            raise ValueError(f"CrawlJob {crawl_job_id} not found")

        project_result = await self.db.execute(
            select(Project).where(Project.id == crawl_job.project_id)
        )
        project = project_result.scalar_one_or_none()

        if not project:
            raise ValueError(f"Project {crawl_job.project_id} not found")

        try:
            # Discover URLs
            urls, method = await self.discover_urls(crawl_job, project)

            # Create Page records for discovered URLs
            for url in urls:
                # Generate slug from URL
                parsed_url = urlparse(url)
                slug = parsed_url.path.strip("/") or "home"

                # Check if page already exists
                existing_page_result = await self.db.execute(
                    select(Page).where(
                        Page.project_id == project.id,
                        Page.url == url
                    )
                )
                existing_page = existing_page_result.scalar_one_or_none()

                if not existing_page:
                    page = Page(
                        project_id=project.id,
                        url=url,
                        slug=slug,
                        status="discovered",
                        created_at=get_utcnow(),
                    )
                    self.db.add(page)

            await self.db.commit()

            # Update crawl job - leave in discovering phase (don't auto-advance)
            crawl_job.pages_total = len(urls)
            await self.db.commit()

        except Exception as e:
            crawl_job.status = "failed"
            crawl_job.error_message = str(e)
            await self.db.commit()
            raise

    async def execute_testing_phase(
        self, crawl_job_id: uuid.UUID
    ) -> None:
        """
        Execute the testing phase of a crawl job.

        Args:
            crawl_job_id: ID of the crawl job
        """
        # Get crawl job
        result = await self.db.execute(
            select(CrawlJob).where(CrawlJob.id == crawl_job_id)
        )
        crawl_job = result.scalar_one_or_none()

        if not crawl_job:
            raise ValueError(f"CrawlJob {crawl_job_id} not found")

        try:
            # Get sample pages for testing
            pages_result = await self.db.execute(
                select(Page)
                .where(Page.project_id == crawl_job.project_id)
                .where(Page.status == "discovered")
                .limit(5)
            )
            sample_pages = pages_result.scalars().all()

            if not sample_pages:
                raise ValueError("No pages found for testing")

            test_urls = [page.url for page in sample_pages]

            # Test extraction methods
            winning_method, test_results = await self.test_extraction_methods(test_urls)

            # Update crawl job
            crawl_job.winning_method = winning_method
            crawl_job.test_results = test_results
            crawl_job.phase = "extracting"

            # Update sample pages status
            for page in sample_pages:
                page.status = "testing"

            await self.db.commit()

        except Exception as e:
            crawl_job.status = "failed"
            crawl_job.error_message = str(e)
            await self.db.commit()
            raise

    async def execute_extraction_phase(
        self, crawl_job_id: uuid.UUID
    ) -> None:
        """
        Execute the extraction phase of a crawl job.

        Args:
            crawl_job_id: ID of the crawl job
        """
        # Get crawl job
        result = await self.db.execute(
            select(CrawlJob).where(CrawlJob.id == crawl_job_id)
        )
        crawl_job = result.scalar_one_or_none()

        if not crawl_job:
            raise ValueError(f"CrawlJob {crawl_job_id} not found")

        if not crawl_job.winning_method:
            raise ValueError("No winning method determined")

        try:
            # Get all pages to crawl
            pages_result = await self.db.execute(
                select(Page)
                .where(Page.project_id == crawl_job.project_id)
                .where(Page.status.in_(["discovered", "testing"]))
            )
            pages = pages_result.scalars().all()

            # Extract content from each page
            for page in pages:
                try:
                    page.status = "crawling"
                    await self.db.commit()

                    # Extract content
                    content_dict = await self.extract_page_content(
                        page.url, crawl_job.winning_method
                    )

                    if content_dict:
                        # Save page data
                        await self.save_page_data(page, content_dict)

                        # Update page status
                        page.status = "crawled"
                        page.extraction_method = crawl_job.winning_method
                        page.last_crawled_at = get_utcnow()

                        crawl_job.pages_crawled += 1
                    else:
                        page.status = "failed"
                        crawl_job.pages_failed += 1

                    await self.db.commit()

                except Exception as e:
                    print(f"Error extracting page {page.url}: {e}")
                    page.status = "failed"
                    crawl_job.pages_failed += 1
                    await self.db.commit()

            # Mark crawl job as completed
            crawl_job.phase = "completed"
            crawl_job.status = "completed"
            crawl_job.completed_at = get_utcnow()
            await self.db.commit()

        except Exception as e:
            crawl_job.status = "failed"
            crawl_job.error_message = str(e)
            await self.db.commit()
            raise

    async def run_discovery_only(
        self, project_id: uuid.UUID
    ) -> CrawlJob:
        """
        Run ONLY the discovery phase (Smart Crawl).

        This discovers page URLs from sitemap without extracting content.

        Args:
            project_id: The project ID to crawl

        Returns:
            The CrawlJob instance after discovery
        """
        # Start crawl job
        crawl_job = await self.start_crawl_job(project_id)

        try:
            # Phase 1: Discovery ONLY
            await self.execute_discovery_phase(crawl_job.id)

            # Mark as completed after discovery
            crawl_job.status = "completed"
            crawl_job.phase = "completed"
            crawl_job.completed_at = get_utcnow()
            await self.db.commit()

            return crawl_job

        except Exception as e:
            print(f"Discovery failed: {e}")
            raise

    async def run_full_crawl_job(
        self, project_id: uuid.UUID
    ) -> CrawlJob:
        """
        Run a complete crawl job (discovery, testing, extraction).

        Args:
            project_id: The project ID to crawl

        Returns:
            The completed CrawlJob instance
        """
        # Start crawl job
        crawl_job = await self.start_crawl_job(project_id)

        try:
            # Phase 1: Discovery
            await self.execute_discovery_phase(crawl_job.id)

            # Phase 2: Testing
            await self.execute_testing_phase(crawl_job.id)

            # Phase 3: Extraction
            await self.execute_extraction_phase(crawl_job.id)

            return crawl_job

        except Exception as e:
            print(f"Crawl job failed: {e}")
            raise

    async def rescan_sitemap(
        self, project_id: uuid.UUID
    ) -> Dict:
        """
        Re-scan sitemap and detect differences (new/removed URLs).

        Returns:
            Dictionary with new_urls, removed_urls, and unchanged_urls counts
        """
        # Get project with sitemap URL
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project or not project.sitemap_url:
            raise ValueError(f"Project {project_id} not found or has no sitemap URL")

        # Discover URLs from sitemap
        new_sitemap_urls = await self.discover_urls_from_sitemap(
            project.sitemap_url, project.url
        )

        # Get existing pages for this project
        existing_pages_result = await self.db.execute(
            select(Page).where(Page.project_id == project_id)
        )
        existing_pages = {page.url: page for page in existing_pages_result.scalars().all()}

        # Calculate diff
        new_urls = set(new_sitemap_urls) - set(existing_pages.keys())
        removed_urls = set(existing_pages.keys()) - set(new_sitemap_urls)
        unchanged_urls = set(new_sitemap_urls) & set(existing_pages.keys())

        # Add new pages
        for url in new_urls:
            from urllib.parse import urlparse
            parsed_url = urlparse(url)
            slug = parsed_url.path.strip("/") or "home"

            page = Page(
                project_id=project_id,
                url=url,
                slug=slug,
                status="discovered",
                is_in_sitemap=True,
                created_at=get_utcnow(),
            )
            self.db.add(page)

        # Mark removed pages
        for url in removed_urls:
            page = existing_pages[url]
            page.is_in_sitemap = False
            page.removed_from_sitemap_at = get_utcnow()
            self.db.add(page)

        # Update unchanged pages (ensure is_in_sitemap = True)
        for url in unchanged_urls:
            page = existing_pages[url]
            if not page.is_in_sitemap:
                page.is_in_sitemap = True
                page.removed_from_sitemap_at = None
                self.db.add(page)

        await self.db.commit()

        return {
            "new_urls": list(new_urls),
            "removed_urls": list(removed_urls),
            "new_count": len(new_urls),
            "removed_count": len(removed_urls),
            "unchanged_count": len(unchanged_urls),
            "total_in_sitemap": len(new_sitemap_urls),
        }

    async def scrape_selected_pages(
        self, page_ids: List[uuid.UUID], extraction_method: str
    ) -> Dict:
        """
        Scrape selected pages using the specified extraction method.

        Args:
            page_ids: List of page IDs to scrape
            extraction_method: Method to use (crawl4ai, jina)

        Returns:
            Dictionary with success/failure counts and progress
        """
        success_count = 0
        failed_count = 0
        results = []

        for page_id in page_ids:
            try:
                # Get page
                page_result = await self.db.execute(
                    select(Page).where(Page.id == page_id)
                )
                page = page_result.scalar_one_or_none()

                if not page:
                    failed_count += 1
                    results.append({
                        "page_id": str(page_id),
                        "status": "failed",
                        "error": "Page not found"
                    })
                    continue

                # Store URL before any commits to avoid detached instance errors
                page_url = page.url

                # Update status to crawling
                page.status = "crawling"
                await self.db.commit()

                # Re-query page to get fresh attached instance
                page_result = await self.db.execute(
                    select(Page).where(Page.id == page_id)
                )
                page = page_result.scalar_one_or_none()

                # Extract content
                content_dict = await self.extract_page_content(
                    page_url, extraction_method
                )

                if content_dict:
                    # Save page data with versioning
                    await self.save_page_data_with_versioning(
                        page_id, content_dict, extraction_method
                    )

                    # Re-query page after save_page_data_with_versioning commits
                    page_result = await self.db.execute(
                        select(Page).where(Page.id == page_id)
                    )
                    page = page_result.scalar_one_or_none()

                    # Update page status
                    page.status = "crawled"
                    page.extraction_method = extraction_method
                    page.last_crawled_at = get_utcnow()

                    success_count += 1
                    results.append({
                        "page_id": str(page_id),
                        "url": page_url,
                        "status": "success"
                    })
                else:
                    # Re-query page for clean instance
                    page_result = await self.db.execute(
                        select(Page).where(Page.id == page_id)
                    )
                    page = page_result.scalar_one_or_none()

                    page.status = "failed"
                    failed_count += 1
                    results.append({
                        "page_id": str(page_id),
                        "url": page_url,
                        "status": "failed",
                        "error": "No content extracted"
                    })

                await self.db.commit()

            except Exception as e:
                # Re-query page for clean instance in exception handler
                page_result = await self.db.execute(
                    select(Page).where(Page.id == page_id)
                )
                page = page_result.scalar_one_or_none()

                if page:
                    page.status = "failed"
                    await self.db.commit()

                failed_count += 1
                results.append({
                    "page_id": str(page_id),
                    "url": page.url if page else "unknown",
                    "status": "failed",
                    "error": str(e)
                })
                print(f"🔴 Exception during scraping page {page_id}: {e}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")

        return {
            "success_count": success_count,
            "failed_count": failed_count,
            "total": len(page_ids),
            "results": results
        }

    async def save_page_data_with_versioning(
        self, page_id: uuid.UUID, content_dict: Dict, extraction_method: str
    ) -> None:
        """
        Save extracted page data with versioning support.
        Marks previous versions as not current and creates new version.

        Args:
            page_id: The page ID
            content_dict: Dictionary of extracted content
            extraction_method: Method used for extraction
        """
        # Get max version for this page
        max_version_result = await self.db.execute(
            select(PageData.version)
            .where(PageData.page_id == page_id)
            .order_by(PageData.version.desc())
            .limit(1)
        )
        max_version = max_version_result.scalar_one_or_none()
        new_version = (max_version or 0) + 1

        # Mark all existing PageData for this page as not current
        existing_data_result = await self.db.execute(
            select(PageData).where(PageData.page_id == page_id)
        )
        for old_data in existing_data_result.scalars().all():
            old_data.is_current = False
            self.db.add(old_data)

        # Save different types of data with new version
        data_types = {
            # Meta tags
            "meta_title": {"title": content_dict.get("meta_title")},
            "meta_description": {"description": content_dict.get("meta_description")},
            "meta_keywords": {"keywords": content_dict.get("meta_keywords")},
            "meta_robots": {"robots": content_dict.get("meta_robots")},
            "meta_author": {"author": content_dict.get("meta_author")},

            # Heading tags
            "h1": {"tags": content_dict.get("h1_tags", [])},
            "h2": {"tags": content_dict.get("h2_tags", [])},
            "h3": {"tags": content_dict.get("h3_tags", [])},
            "h4": {"tags": content_dict.get("h4_tags", [])},
            "h5": {"tags": content_dict.get("h5_tags", [])},
            "h6": {"tags": content_dict.get("h6_tags", [])},

            # Structured data
            "schema": {"markup": content_dict.get("schema_markup", [])},

            # Body content
            "body": {
                "markdown": content_dict.get("body_markdown"),
                "text": content_dict.get("body_text"),
                "word_count": content_dict.get("word_count"),
                "char_count": content_dict.get("char_count"),
            },

            # Links and images
            "links": {"links": content_dict.get("links", [])},
            "images": {"images": content_dict.get("images", [])},

            # SEO and social
            "canonical_url": {"url": content_dict.get("canonical_url")},
            "og_tags": content_dict.get("og_tags", {}),
            "twitter_tags": content_dict.get("twitter_tags", {}),

            # Other
            "language": {"language": content_dict.get("language")},
            "favicon": {"url": content_dict.get("favicon")},
            "quality_score": {"score": content_dict.get("quality_score", 0)},
        }

        for data_type, content in data_types.items():
            page_data = PageData(
                page_id=page_id,
                data_type=data_type,
                content=content,
                version=new_version,
                is_current=True,
                extraction_method=extraction_method,
                extracted_at=get_utcnow(),
            )
            self.db.add(page_data)

        await self.db.commit()

    async def get_pages_with_stats(
        self, project_id: uuid.UUID
    ) -> List[Dict]:
        """
        Get all pages for a project with crawl statistics.

        Returns:
            List of page dictionaries with stats
        """
        pages_result = await self.db.execute(
            select(Page).where(Page.project_id == project_id)
        )
        pages = pages_result.scalars().all()

        result = []
        for page in pages:
            # Get current page data
            current_data_result = await self.db.execute(
                select(PageData)
                .where(PageData.page_id == page.id)
                .where(PageData.is_current == True)
            )
            current_data = {
                data.data_type: data.content
                for data in current_data_result.scalars().all()
            }

            # Get version count
            version_count_result = await self.db.execute(
                select(PageData.version)
                .where(PageData.page_id == page.id)
                .distinct()
            )
            version_count = len(list(version_count_result.scalars().all()))

            result.append({
                "id": str(page.id),
                "url": page.url,
                "slug": page.slug,
                "status": page.status,
                "is_in_sitemap": page.is_in_sitemap,
                "removed_from_sitemap_at": page.removed_from_sitemap_at.isoformat() if page.removed_from_sitemap_at else None,
                "extraction_method": page.extraction_method,
                "last_crawled_at": page.last_crawled_at.isoformat() if page.last_crawled_at else None,
                "created_at": page.created_at.isoformat(),
                "version_count": version_count,
                "current_data": current_data,
            })

        return result

    async def get_crawl_job_status(
        self, crawl_job_id: uuid.UUID
    ) -> Optional[CrawlJob]:
        """
        Get the status of a crawl job.

        Args:
            crawl_job_id: ID of the crawl job

        Returns:
            The CrawlJob instance or None
        """
        result = await self.db.execute(
            select(CrawlJob).where(CrawlJob.id == crawl_job_id)
        )
        return result.scalar_one_or_none()

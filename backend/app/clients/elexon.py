"""Async Elexon BMRS API client with in-memory caching.

Connects to Elexon Insights Solution (BMRS) open REST endpoints:
- FUELHH/stream for actual wind generation by half-hour settlement period
- WINDFOR/stream for wind generation forecasts
"""

from datetime import date, datetime, timedelta, timezone
import logging
import time
from typing import Any, Optional
import httpx

from app.core.config import settings
from app.utils.market_time import parse_iso_utc

logger = logging.getLogger(__name__)


class ElexonAPIError(Exception):
    """Raised when an error occurs during Elexon API requests."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class CacheEntry:
    """Represents a cached dataset in memory with an expiration timestamp."""

    def __init__(self, data: Any, ttl_seconds: int):
        self.data = data
        self.expires_at = time.time() + ttl_seconds

    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class ElexonClient:
    """Async client for fetching BMRS datasets from Elexon."""

    def __init__(self, base_url: Optional[str] = None, ttl_seconds: Optional[int] = None):
        self.base_url = (base_url or settings.ELEXON_BASE_URL).rstrip("/")
        self.ttl_seconds = ttl_seconds or settings.CACHE_TTL_SECONDS
        self._cache: dict[str, CacheEntry] = {}
        # Shared async HTTP client with connection pooling and reasonable timeouts
        self._http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=10.0, read=45.0, write=10.0, pool=10.0),
            headers={"User-Agent": f"WindScope/{settings.APP_VERSION} (UK Electricity Utility Analytics)"},
        )

    async def close(self) -> None:
        """Close the underlying HTTP client session."""
        await self._http_client.aclose()

    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        entry = self._cache.get(cache_key)
        if entry is not None:
            if not entry.is_expired():
                return entry.data
            else:
                del self._cache[cache_key]
        return None

    def _set_in_cache(self, cache_key: str, data: Any) -> None:
        self._cache[cache_key] = CacheEntry(data, self.ttl_seconds)

    async def check_health(self) -> bool:
        """Quick connectivity probe to Elexon API."""
        try:
            url = f"{self.base_url}/datasets/FUELHH/stream?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-01"
            response = await self._http_client.get(url, timeout=10.0)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Elexon health probe failed: {e}")
            return False

    async def fetch_fuelhh_actuals(self, start_date_str: str, end_date_str: str) -> tuple[list[dict], bool]:
        """Fetch FUELHH actual wind generation records between start_date and end_date.
        
        Returns:
            Tuple of (records_list, is_from_cache)
        """
        cache_key = f"FUELHH:{start_date_str}:{end_date_str}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached, True

        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "settlementDateFrom": start_date_str,
            "settlementDateTo": end_date_str,
        }

        try:
            response = await self._http_client.get(url, params=params)
        except httpx.RequestError as exc:
            raise ElexonAPIError(f"Network error contacting Elexon FUELHH endpoint: {exc}") from exc

        if response.status_code != 200:
            raise ElexonAPIError(
                f"Elexon FUELHH returned HTTP {response.status_code}: {response.text[:200]}",
                status_code=response.status_code,
            )

        try:
            raw_items = response.json()
        except Exception as exc:
            raise ElexonAPIError(f"Failed to parse Elexon FUELHH JSON: {exc}") from exc

        # Filter strictly for WIND generation
        wind_records = [
            item for item in raw_items
            if isinstance(item, dict) and item.get("fuelType") == "WIND"
        ]

        self._set_in_cache(cache_key, wind_records)
        return wind_records, False

    async def fetch_windfor_forecasts(self, start_date_str: str, end_date_str: str) -> tuple[list[dict], bool]:
        """Fetch WINDFOR forecast records relevant for the specified delivery interval dates.
        
        To capture Day-Ahead and multi-hour forecasts, we query publish timestamps starting
        2 days before start_date up to the end of end_date.
        
        Returns:
            Tuple of (records_list, is_from_cache)
        """
        cache_key = f"WINDFOR:{start_date_str}:{end_date_str}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached, True

        start_d = date.fromisoformat(start_date_str)
        end_d = date.fromisoformat(end_date_str)

        # Query forecasts published from D-2 up to D+1
        pub_from = (start_d - timedelta(days=2)).isoformat() + "T00:00:00Z"
        pub_to = (end_d + timedelta(days=1)).isoformat() + "T04:00:00Z"

        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": pub_from,
            "publishDateTimeTo": pub_to,
        }

        try:
            response = await self._http_client.get(url, params=params)
        except httpx.RequestError as exc:
            raise ElexonAPIError(f"Network error contacting Elexon WINDFOR endpoint: {exc}") from exc

        if response.status_code != 200:
            raise ElexonAPIError(
                f"Elexon WINDFOR returned HTTP {response.status_code}: {response.text[:200]}",
                status_code=response.status_code,
            )

        try:
            raw_items = response.json()
        except Exception as exc:
            raise ElexonAPIError(f"Failed to parse Elexon WINDFOR JSON: {exc}") from exc

        valid_forecasts = [
            item for item in raw_items
            if isinstance(item, dict) and "startTime" in item and "generation" in item
        ]

        self._set_in_cache(cache_key, valid_forecasts)
        return valid_forecasts, False


# Global singleton instance for the backend process
elexon_client = ElexonClient()

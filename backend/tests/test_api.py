"""Integration and API endpoint tests."""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify health endpoint responds with version and status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert "status" in data
        assert "version" in data
        assert "elexon_reachable" in data


@pytest.mark.asyncio
async def test_comparison_endpoint_rejects_out_of_bounds_date():
    """Verify validation error when dates outside January 2026 are requested."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid month
        res = await client.get("/api/comparison?start_date=2025-12-31&end_date=2026-01-05")
        assert res.status_code == 422

        # Invalid end date
        res2 = await client.get("/api/comparison?start_date=2026-01-01&end_date=2026-02-05")
        assert res2.status_code == 422


@pytest.mark.asyncio
async def test_intervals_endpoint_rejects_out_of_bounds_date():
    """Verify intervals endpoint validates date ranges."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/intervals?start_date=2026-02-01&end_date=2026-02-05")
        assert res.status_code == 422


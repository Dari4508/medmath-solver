import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

transport = ASGITransport(app=app)


@pytest.mark.asyncio
async def test_oversized_matrix_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        big_matrix = [[1.0] * 7 for _ in range(7)]
        big_vector = [1.0] * 7
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": big_matrix, "vector": big_vector},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_empty_matrix_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [], "vector": []},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_non_square_matrix_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 2, 3], [4, 5, 6]], "vector": [1, 2]},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_vector_length_mismatch_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [1, 2, 3]},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_non_numeric_values_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [["a", "b"], ["c", "d"]], "vector": [1, 2]},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_values_out_of_range_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={
                "matrix": [[2e6, 0], [0, 1]],
                "vector": [1, 1],
            },
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_rate_limit_enforced():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        for _ in range(35):
            await ac.post(
                "/api/calculate/custom",
                json={"matrix": [[1, 0], [0, 1]], "vector": [1, 1]},
            )
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [1, 1]},
        )
        assert resp.status_code == 429


@pytest.mark.asyncio
async def test_rate_limit_isolated_per_real_ip():
    payload = {"matrix": [[1, 0], [0, 1]], "vector": [1, 1]}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        last = None
        for _ in range(35):
            last = await ac.post("/api/calculate/custom", json=payload)
        assert last.status_code == 429

        resp = await ac.post(
            "/api/calculate/custom",
            json=payload,
            headers={"X-Real-IP": "203.0.113.7"},
        )
        assert resp.status_code == 200

        resp_default = await ac.post("/api/calculate/custom", json=payload)
        assert resp_default.status_code == 429


@pytest.mark.asyncio
async def test_rate_limit_uses_last_forwarded_for_ip():
    payload = {"matrix": [[1, 0], [0, 1]], "vector": [1, 1]}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        last = None
        for _ in range(35):
            last = await ac.post(
                "/api/calculate/custom",
                json=payload,
                headers={"X-Forwarded-For": "198.51.100.9"},
            )
        assert last.status_code == 429

        resp = await ac.post(
            "/api/calculate/custom",
            json=payload,
            headers={"X-Forwarded-For": "198.51.100.10, 203.0.113.1"},
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_xss_case_name_not_reflected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases")
        assert resp.status_code == 200
        data = resp.json()
        for case in data:
            assert "<script>" not in case.get("name", "")
            assert "onerror=" not in case.get("name", "")
            assert "<script>" not in case.get("description", "")


@pytest.mark.asyncio
async def test_vector_value_out_of_range_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [-2e6, 1]},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_nan_and_inf_rejected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate/custom",
            json={"matrix": [["NaN", 0], [0, 1]], "vector": [1, 1]},
        )
        assert resp.status_code == 422


def test_sanitize_html_escapes_tags():
    from app.security import sanitize_html

    assert sanitize_html("<script>alert(1)</script>") == ("&lt;script&gt;alert(1)&lt;/script&gt;")
    assert sanitize_html('a "quoted" & <b>text</b>') == (
        "a &quot;quoted&quot; &amp; &lt;b&gt;text&lt;/b&gt;"
    )
    assert sanitize_html("D10W 500ml") == "D10W 500ml"


def test_validate_case_name():
    from app.security import validate_case_name

    assert validate_case_name("Preparación Dextrosa 10% (D10W) 500ml")
    assert not validate_case_name("<script>xss</script>")
    assert not validate_case_name("")
    assert not validate_case_name("a" * 101)
    assert not validate_case_name("name/DROP?table=1")

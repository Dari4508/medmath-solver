import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

transport = ASGITransport(app=app)

VALID_CASE = {
    "name": "Caso Test Cobertura",
    "description": "Caso para tests de cobertura",
    "reference_source": "Manual interno",
    "reference_url": None,
    "matrix": [[1.0, 0.0], [0.0, 1.0]],
    "vector": [10.0, 20.0],
    "expected": [10.0, 20.0],
    "variables": ["x", "y"],
    "units": ["mL", "mL"],
    "clinical_notes": None,
    "is_active": True,
}


@pytest.mark.asyncio
async def test_metrics_endpoint():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/metrics")
        assert resp.status_code == 200
        assert "text/plain" in resp.headers["content-type"]
        assert "http_requests_total" in resp.text or "request" in resp.text


@pytest.mark.asyncio
async def test_create_case_ok():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Nuevo Create")
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Caso Nuevo Create"
        case_id = data["id"]

        resp = await ac.delete(f"/api/cases/{case_id}")
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_create_case_duplicate_name_409():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases")
        existing_name = resp.json()[0]["name"]
        payload = dict(VALID_CASE, name=existing_name)
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 409


@pytest.mark.asyncio
async def test_create_case_invalid_name_422():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="<script>xss</script>")
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_case_expected_length_mismatch_422():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Bad Expected", expected=[1.0])
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_case_variables_length_mismatch_422():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Bad Vars", variables=["only_one"])
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_case_units_length_mismatch_422():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Bad Units", units=["only_one"])
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_case_expected_out_of_range_422():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Bad Expected Range", expected=[2e6, 1.0])
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_case_ok():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Para Update Desc")
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 201
        case_id = resp.json()["id"]

        resp = await ac.put(
            f"/api/cases/{case_id}",
            json={"description": "Descripción actualizada por test"},
        )
        assert resp.status_code == 200
        assert resp.json()["description"] == "Descripción actualizada por test"

        await ac.delete(f"/api/cases/{case_id}")


@pytest.mark.asyncio
async def test_update_case_not_found_404():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put("/api/cases/99999", json={"description": "x"})
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_case_duplicate_name_409():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases")
        cases = resp.json()
        other_name = cases[1]["name"] if len(cases) > 1 else None
        if other_name is None:
            pytest.skip("Need at least two cases")
        payload = dict(VALID_CASE, name="Caso Dup Update Target")
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 201
        new_id = resp.json()["id"]

        resp = await ac.put(f"/api/cases/{new_id}", json={"name": other_name})
        assert resp.status_code == 409

        await ac.delete(f"/api/cases/{new_id}")


@pytest.mark.asyncio
async def test_update_case_with_matrix_vector_expected():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Para Update Matrix")
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 201
        case_id = resp.json()["id"]

        resp = await ac.put(
            f"/api/cases/{case_id}",
            json={
                "matrix": [[2.0, 0.0], [0.0, 2.0]],
                "vector": [4.0, 6.0],
                "expected": [2.0, 3.0],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["matrix"] == [[2.0, 0.0], [0.0, 2.0]]
        assert data["vector"] == [4.0, 6.0]
        assert data["expected"] == [2.0, 3.0]

        await ac.delete(f"/api/cases/{case_id}")


@pytest.mark.asyncio
async def test_delete_case_ok_and_then_404():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = dict(VALID_CASE, name="Caso Para Borrar")
        resp = await ac.post("/api/cases", json=payload)
        assert resp.status_code == 201
        case_id = resp.json()["id"]

        resp = await ac.delete(f"/api/cases/{case_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Caso Para Borrar"

        resp = await ac.get(f"/api/cases/{case_id}")
        assert resp.status_code == 404

        resp = await ac.delete(f"/api/cases/{case_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_export_history_csv():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [7, 8]},
        )
        resp = await ac.get("/api/history/export")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/csv")
        assert "attachment" in resp.headers["content-disposition"]
        body = resp.text
        assert "id,case_id,created_at" in body
        assert body.strip().splitlines().__len__() >= 2


@pytest.mark.asyncio
async def test_history_entry_detail_ok():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [3, 4]},
        )
        resp = await ac.get("/api/history")
        entry_id = resp.json()[0]["id"]

        resp = await ac.get(f"/api/history/{entry_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == entry_id
        assert data["solution"] is not None
        assert data["created_at"]


@pytest.mark.asyncio
async def test_history_entry_detail_404():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/history/999999")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_history_steps_ok():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [1, 2]},
        )
        resp = await ac.get("/api/history")
        entry_id = resp.json()[0]["id"]

        resp = await ac.get(f"/api/history/{entry_id}/steps")
        assert resp.status_code == 200
        data = resp.json()
        assert data["history_id"] == entry_id
        assert isinstance(data["steps"], list)
        assert len(data["steps"]) > 0


@pytest.mark.asyncio
async def test_history_steps_404():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/history/999999/steps")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_history_entry_ok():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [5, 6]},
        )
        resp = await ac.get("/api/history")
        entry_id = resp.json()[0]["id"]

        resp = await ac.delete(f"/api/history/{entry_id}")
        assert resp.status_code == 200
        assert resp.json()["deleted"] == 1

        resp = await ac.get(f"/api/history/{entry_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_history_entry_404():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete("/api/history/999999")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_clear_history():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post(
            "/api/calculate/custom",
            json={"matrix": [[1, 0], [0, 1]], "vector": [9, 9]},
        )
        resp = await ac.delete("/api/history")
        assert resp.status_code == 200
        assert resp.json()["deleted"] >= 1

        resp = await ac.get("/api/history")
        assert resp.status_code == 200
        assert resp.json() == []


@pytest.mark.asyncio
async def test_api_v1_alias_works():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_calculate_lang_en():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases")
        case_id = resp.json()[0]["id"]

        resp = await ac.post(
            "/api/calculate",
            json={"case_id": case_id},
            params={"lang": "en"},
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "Solved successfully"


@pytest.mark.asyncio
async def test_calculate_lang_invalid_falls_back():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/cases")
        case_id = resp.json()[0]["id"]

        resp = await ac.post(
            "/api/calculate",
            json={"case_id": case_id},
            params={"lang": "fr"},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_calculate_case_not_found_i18n_en():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/calculate",
            json={"case_id": 99999},
            params={"lang": "en"},
        )
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Case not found"


def test_resolve_calc_message_paths():
    from app.i18n import resolve_calc_message

    assert resolve_calc_message("Resuelto correctamente", "es") == "Resuelto correctamente"
    assert resolve_calc_message("Resuelto correctamente", "en") == "Solved successfully"
    assert (
        resolve_calc_message("Sistema incompatible (sin solución)", "en")
        == "Inconsistent system (no solution)"
    )
    assert resolve_calc_message("Sistema incompatible (sin solución)", "es") == (
        "Sistema incompatible (sin solución)"
    )
    assert resolve_calc_message("otro mensaje", "es") == "otro mensaje"


def test_compare_expected_empty_solution_returns_none():
    from app.main import _compare_expected

    assert _compare_expected([], []) == (None, None)

"""Basic tests for the AI service routers."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    # Inject a mock OpenAI client
    app.state.openai = MagicMock()
    return TestClient(app, raise_server_exceptions=True)


class TestHealth:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestChecklist:
    def test_valid_request_returns_tasks(self, client):
        mock_tasks = {
            "tasks": [
                {
                    "title": "Book astrologer",
                    "category": "Traditional Services",
                    "months_before": 12,
                    "assignable_to": "couple",
                    "notes": "Fix nekath first",
                },
            ]
        }
        with patch(
            "app.routers.checklist.complete_json",
            new=AsyncMock(return_value=json.dumps(mock_tasks)),
        ):
            response = client.post(
                "/ai/checklist",
                json={
                    "traditions": ["kandyan"],
                    "months_out": 12,
                    "district": "Colombo",
                    "guest_count": 250,
                    "is_diaspora": False,
                },
            )
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert len(data["tasks"]) == 1
        assert data["tasks"][0]["title"] == "Book astrologer"

    def test_missing_required_fields_returns_422(self, client):
        response = client.post("/ai/checklist", json={"traditions": ["kandyan"]})
        assert response.status_code == 422


class TestBudget:
    def test_valid_request_returns_budget(self, client):
        mock_budget = {
            "total_lkr": {"min": 2000000, "max": 3500000},
            "total_usd_approx": {"min": 6400, "max": 11300},
            "disclaimer": "Estimates only.",
            "breakdown": [
                {
                    "category": "Venue & Hall",
                    "min_lkr": 400000,
                    "max_lkr": 800000,
                    "pct_of_total": 22.0,
                    "notes": "Hotel ballroom estimate",
                }
            ],
        }
        with patch(
            "app.routers.budget.complete_json",
            new=AsyncMock(return_value=json.dumps(mock_budget)),
        ):
            response = client.post(
                "/ai/budget",
                json={
                    "traditions": ["kandyan"],
                    "district": "Colombo",
                    "guest_count": 250,
                },
            )
        assert response.status_code == 200
        data = response.json()
        assert data["total_lkr"]["min"] == 2000000
        assert len(data["breakdown"]) == 1

    def test_missing_required_fields_returns_422(self, client):
        response = client.post("/ai/budget", json={"district": "Colombo"})
        assert response.status_code == 422

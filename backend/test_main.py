"""Tests for the main FastAPI application."""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_read_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "React FastAPI Template API"}


def test_health_check():
    """Test the health check endpoint with database connectivity."""
    response = client.get("/api/v1/utils/health-check")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["message"] == "Backend is running"
    assert "database" in data
    assert data["database"]["status"] == "healthy"
    assert "message" in data["database"]
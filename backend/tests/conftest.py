import importlib

import pytest


@pytest.fixture(autouse=True)
def _isolated_env(monkeypatch, tmp_path):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("LLM_API_KEY", "test-key")
    monkeypatch.setenv("DB_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("LLM_MODEL", "gemini-test")
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    import app.db as db_module
    importlib.reload(db_module)
    import app.routers.cards as r1
    import app.routers.decks as r2
    importlib.reload(r1)
    importlib.reload(r2)
    import app.main as main_module
    importlib.reload(main_module)

    fresh_app = main_module.create_app()
    with TestClient(fresh_app) as c:
        yield c

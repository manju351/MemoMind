def _patch_llm(monkeypatch, responder):
    import app.llm as llm_module

    def fake(system, user, *, model=None, temperature=0.4):
        return responder(system, user)

    monkeypatch.setattr(llm_module, "chat_json", fake)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_generate_cards_endpoint(client, monkeypatch):
    def responder(_s, _u):
        return {
            "cards": [
                {"front": "What is HTTP?", "back": "A protocol for hypertext over TCP.", "hint": None},
                {"front": "What is TLS?", "back": "Cryptographic protocol providing secure communication.", "hint": "Replaces SSL"},
                {"front": "", "back": "Should be dropped"},  # invalid
            ]
        }

    _patch_llm(monkeypatch, responder)
    r = client.post(
        "/api/cards/generate",
        json={"text": "HTTP is a stateless application protocol. TLS encrypts traffic.", "num_cards": 5},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["cards"]) == 2
    assert body["cards"][1]["hint"] == "Replaces SSL"


def test_generate_cards_rejects_no_cards(client, monkeypatch):
    _patch_llm(monkeypatch, lambda s, u: {"cards": []})
    r = client.post(
        "/api/cards/generate",
        json={"text": "x" * 50, "num_cards": 3},
    )
    assert r.status_code == 502


def test_deck_lifecycle(client, monkeypatch):
    # Create a deck with 2 cards
    r = client.post(
        "/api/decks",
        json={
            "name": "Networking 101",
            "description": "Intro networking",
            "cards": [
                {"front": "What is TCP?", "back": "Transmission Control Protocol."},
                {"front": "What is UDP?", "back": "User Datagram Protocol."},
                {"front": "", "back": "Skip me"},
            ],
        },
    )
    assert r.status_code == 200, r.text
    deck = r.json()
    deck_id = deck["id"]
    assert deck["card_count"] == 2
    assert deck["due_count"] == 2  # all due immediately

    # List
    r = client.get("/api/decks")
    assert r.status_code == 200
    assert any(d["id"] == deck_id and d["card_count"] == 2 for d in r.json())

    # Get detail
    r = client.get(f"/api/decks/{deck_id}")
    assert r.status_code == 200
    assert len(r.json()["cards"]) == 2

    # Due
    r = client.get(f"/api/decks/{deck_id}/due")
    assert r.status_code == 200
    due = r.json()
    assert len(due) == 2
    first_card_id = due[0]["id"]

    # Review good — pushes interval ahead
    r = client.post(f"/api/cards/{first_card_id}/review", json={"rating": "good"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["card"]["repetitions"] == 1
    assert body["card"]["interval_days"] >= 1
    assert body["card"]["review_count"] == 1

    # Now only 1 card is due
    r = client.get(f"/api/decks/{deck_id}/due")
    assert len(r.json()) == 1

    # Review again — resets
    r = client.post(f"/api/cards/{first_card_id}/review", json={"rating": "again"})
    assert r.status_code == 200
    body = r.json()
    assert body["card"]["repetitions"] == 0
    assert body["card"]["interval_days"] < 1
    # Card is due in ~10 minutes, so NOT in current due list
    r = client.get(f"/api/decks/{deck_id}/due")
    assert len(r.json()) == 1  # the other card

    # Delete
    r = client.delete(f"/api/decks/{deck_id}")
    assert r.status_code == 200
    r = client.get(f"/api/decks/{deck_id}")
    assert r.status_code == 404


def test_sm2_easy_grows_interval_faster_than_good():
    from app.sm2 import schedule

    base = dict(repetitions=2, interval_days=3.0, ease=2.5)
    good = schedule(rating="good", **base)
    easy = schedule(rating="easy", **base)
    assert easy["interval_days"] > good["interval_days"]
    assert easy["ease"] > good["ease"]


def test_sm2_hard_lowers_ease_floor():
    from app.sm2 import schedule

    upd = schedule(rating="hard", repetitions=0, interval_days=1.0, ease=1.35)
    assert upd["ease"] == 1.3  # floored

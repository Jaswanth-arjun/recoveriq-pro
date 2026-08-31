from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta

from app.main import app
from app.core.db import SessionLocal
from app.models import B2BInvoice, PromiseToPay, CheckoutAbandonment, PaymentDegradationAlert


async def test_b2b_receivables_aging_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create B2B Invoice
        inv_payload = {
            "name": "Acme Corp",
            "email": "finance@acme.com",
            "phone": "+919876543210",
            "invoice_number": "INV-TEST-001",
            "amount": 15000.0,
            "due_date": (datetime.utcnow() - timedelta(days=45)).strftime("%Y-%m-%d")
        }
        res = await ac.post("/api/receivables/invoices", json=inv_payload)
        assert res.status_code == 200
        inv_id = res.json()["id"]

        # Fetch aging buckets
        res_aging = await ac.get("/api/receivables/aging")
        assert res_aging.status_code == 200
        data = res_aging.json()
        assert data["total_outstanding"] >= 15000.0
        assert data["buckets"]["31_60"] >= 15000.0

        # Send reminder and Razorpay Link
        res_remind = await ac.post(f"/api/receivables/invoices/{inv_id}/remind")
        assert res_remind.status_code == 200
        assert res_remind.json()["ok"] is True
        assert res_remind.json()["reminder_count"] == 1


async def test_promise_to_pay_validation_and_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        future_date = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
        past_date = (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")

        # Test past date validation failure
        bad_payload = {
            "customer_name": "Bad Customer",
            "customer_email": "bad@test.com",
            "customer_phone": "+919888877776",
            "promised_amount": 5000.0,
            "promised_date": past_date
        }
        res_bad = await ac.post("/api/promise-to-pay", json=bad_payload)
        assert res_bad.status_code == 400
        assert "must be in the future" in res_bad.json()["detail"]

        # Test valid future promise creation
        valid_payload = {
            "customer_name": "Valid Customer",
            "customer_email": "valid@test.com",
            "customer_phone": "+919888877775",
            "promised_amount": 7500.0,
            "promised_date": future_date
        }
        res_valid = await ac.post("/api/promise-to-pay", json=valid_payload)
        assert res_valid.status_code == 200
        promise_id = res_valid.json()["id"]

        # List promises
        res_list = await ac.get("/api/promise-to-pay")
        assert res_list.status_code == 200
        assert any(p["id"] == promise_id for p in res_list.json())

        # Update promise status to PAID
        res_patch = await ac.patch(f"/api/promise-to-pay/{promise_id}", json={"status": "PAID"})
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "PAID"


async def test_checkout_abandonment_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        session_id = f"test_session_{int(datetime.utcnow().timestamp())}"
        payload = {
            "session_id": session_id,
            "name": "Cart Abandoner",
            "email": "abandoner@test.com",
            "phone": "+919777766665",
            "cart_items": [{"name": "Organic Milk", "price": 80, "quantity": 2}],
            "cart_value": 160.0,
            "stage": "checkout_basket",
            "reason": "tab_hidden_during_checkout"
        }
        res = await ac.post("/api/checkouts/abandon", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        assert "abandonment_id" in data
        assert "event_id" in data


async def test_payment_degradation_anomaly_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_check = await ac.post("/api/anomalies/check")
        assert res_check.status_code == 200
        assert res_check.json()["ok"] is True

        res_list = await ac.get("/api/anomalies")
        assert res_list.status_code == 200
        assert isinstance(res_list.json(), list)

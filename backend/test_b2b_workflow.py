import asyncio
import sys
from datetime import datetime, timedelta

sys.path.append("backend")

from app.core.db import SessionLocal
from app.models import Merchant, Customer, B2BInvoice, PromiseToPay, RecoveryPolicy
from app.api.routes import parse_date_string, get_receivables_aging, list_b2b_invoices, create_b2b_invoice, CreateB2BInvoiceRequest
from app.worker import process_b2b_receivables_worker_task

async def test_workflow():
    print("--- Testing B2B Recovery Workflow ---")
    async with SessionLocal() as db:
        # 1. Test Invoice Creation with Payment Terms
        req = CreateB2BInvoiceRequest(
            name="Jaswanth Enterprises",
            email="jaswanth@example.com",
            phone="+919876543210",
            finance_contact="Rahul Finance Dept",
            invoice_number="INV-TEST-99",
            amount=75000.0,
            invoice_date="2026-08-01",
            payment_terms="30_days"
        )
        res = await create_b2b_invoice(req, db)
        print(f"Created Invoice Result: {res}")
        assert res["ok"] == True
        assert res["due_date"] == "2026-08-31"

        # 2. Test Aging Metrics
        aging = await get_receivables_aging(db)
        print(f"Aging Metrics: {aging}")
        assert "revenue_at_risk" in aging
        assert "recovery_rate" in aging

        # 3. Test Bulk Recovery Worker Task
        processed = await process_b2b_receivables_worker_task(db)
        print(f"Bulk Recovery Worker Processed: {len(processed)} items")

        print("--- ALL B2B WORKFLOW TESTS PASSED PERFECTLY! ---")

if __name__ == "__main__":
    asyncio.run(test_workflow())

import asyncio
from httpx import AsyncClient
from app.main import app
from tests.test_track03_features import (
    test_b2b_receivables_aging_flow,
    test_promise_to_pay_validation_and_lifecycle,
    test_checkout_abandonment_flow,
    test_payment_degradation_anomaly_check
)

async def main():
    print("Executing Track 03 Automated Tests...")
    from app.core.db import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    try:
        await test_b2b_receivables_aging_flow()
        print("[PASS] 1. B2B Receivables Aging Test: PASSED")

        await test_promise_to_pay_validation_and_lifecycle()
        print("[PASS] 2. Promise to Pay Validation & Lifecycle Test: PASSED")

        await test_checkout_abandonment_flow()
        print("[PASS] 3. Checkout Abandonment Test: PASSED")

        await test_payment_degradation_anomaly_check()
        print("[PASS] 4. Payment Degradation Anomaly Check Test: PASSED")

        print("\nALL TRACK 03 INTEGRATION TESTS PASSED 100%!")
    except Exception as e:
        print(f"[FAIL] TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

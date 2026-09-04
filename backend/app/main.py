from contextlib import asynccontextmanager

try:
    import sentry_sdk
except ImportError:
    sentry_sdk = None
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.db import engine, Base
import app.models
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy import text
    for col in ["address_line", "city", "pincode", "landmark"]:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(f"ALTER TABLE customers ADD COLUMN IF NOT EXISTS {col} VARCHAR(300) DEFAULT ''"))
        except Exception:
            pass

    for tbl in ["subscriptions", "one_time_orders"]:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS items_detail JSON DEFAULT '[]'"))
        except Exception:
            pass

    # One OPEN abandonment per session: remove historical duplicates among
    # open records, and use a NON-unique session index so a closed
    # (recovered/expired) record can keep its stale session_id while the
    # shopper starts a fresh risk under the same session.
    try:
        async with engine.begin() as conn:
            await conn.execute(text(
                "DELETE FROM checkout_abandonments a USING checkout_abandonments b "
                "WHERE a.id < b.id AND a.session_id = b.session_id "
                "AND a.status NOT IN ('RECOVERED','EXPIRED','EXPIRED_PURGED') "
                "AND b.status NOT IN ('RECOVERED','EXPIRED','EXPIRED_PURGED')"
            ))
            await conn.execute(text("DROP INDEX IF EXISTS ux_checkout_abandonments_session"))
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_checkout_abandonments_session "
                "ON checkout_abandonments (session_id)"
            ))
    except Exception:
        pass

    # Start background task loop
    async def bg_loop():
        from app.worker import run_all_background_tasks
        while True:
            await asyncio.sleep(15)
            await run_all_background_tasks()

    task = asyncio.create_task(bg_loop())
    yield
    task.cancel()


if settings.sentry_dsn and sentry_sdk:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.2)

app = FastAPI(
    title="RecoverIQ Pro",
    description="AI Revenue Recovery Agent — Razorpay TEST MODE. The LLM thinks, code acts.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"app": "RecoverIQ Pro", "docs": "/docs",
            "razorpay": "REAL TEST MODE" if settings.razorpay_ready else "SIMULATED"}


# ------------------------------------------------------------------ /pay/{token}
# Public payment link used in recovery emails/SMS (e.g. {FRONTEND_URL}/pay/rec_33).
# ngrok forwards here (backend), so this route must live at the root — it redirects
# the customer to a REAL Razorpay-hosted payment page. When they pay, the
# payment_link.paid webhook marks the event RECOVERED automatically.

_PAY_PAGE = """<!DOCTYPE html>
<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>
<title>GreenBasket Payment</title>
<style>
 body{{font-family:system-ui,sans-serif;background:#0e0b08;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}}
 .card{{background:#1a2433;border:1px solid #2d3b4e;border-radius:16px;padding:32px;max-width:380px;text-align:center}}
 h1{{font-size:20px;margin:0 0 8px}} .brand{{color:#34d399;font-weight:700}}
 p{{font-size:14px;color:#94a3b8;line-height:1.6;margin:8px 0}}
 a.btn{{display:inline-block;margin-top:16px;background:linear-gradient(90deg,#10b981,#14b8a6);color:#052e1b;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none}}
</style></head>
<body><div class='card'>
 <h1 class='brand'>🥦 GreenBasket</h1>
 <p>{message}</p>
 {extra}
</div></body></html>"""


def _pay_page(message: str, extra: str = "", status_code: int = 200):
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=_PAY_PAGE.format(message=message, extra=extra), status_code=status_code)


@app.get("/pay/{token}")
async def pay_link(token: str):
    from fastapi.responses import RedirectResponse
    from sqlalchemy import select, desc

    if not token.startswith("rec_"):
        return _pay_page("This payment link is invalid.", "", 404)
    try:
        event_id = int(token[4:])
    except ValueError:
        return _pay_page("This payment link is invalid.", "", 404)

    from app.core.db import SessionLocal
    from app.models import FailureEvent, Payment, Customer, Action

    async with SessionLocal() as db:
        event = await db.get(FailureEvent, event_id)
        if not event:
            return _pay_page("This recovery request could not be found.", "", 404)

        if event.status == "recovered":
            return _pay_page(
                "✅ Payment already completed — thank you!",
                "<a class='btn' href='/store'>Continue Shopping</a>")

        # Reuse the most recent Razorpay link already created for this event,
        # otherwise create a fresh real payment link.
        res = await db.execute(
            select(Action).where(Action.failure_event_id == event_id)
            .order_by(desc(Action.id)).limit(10))
        short_url = ""
        for a in res.scalars():
            detail = a.detail or {}
            if detail.get("short_url"):
                short_url = detail["short_url"]
                break

        if not short_url:
            payment = await db.get(Payment, event.payment_id)
            customer = await db.get(Customer, payment.customer_id) if payment else None
            if not (customer and settings.razorpay_ready):
                return _pay_page("Payment is temporarily unavailable. Please try again later.", "", 503)
            from app.services import razorpay as rzp
            try:
                link = rzp.create_payment_link(
                    event.amount_paise,
                    {"name": customer.name, "email": customer.email, "phone": customer.phone},
                    f"GreenBasket payment recovery — {event.error_code}", f"ev_{event.id}",
                    notify={"sms": False, "email": False},
                )
                short_url = link.get("short_url", "")
            except Exception:
                return _pay_page("Payment is temporarily unavailable. Please try again later.", "", 503)

        if not short_url:
            return _pay_page("Payment is temporarily unavailable. Please try again later.", "", 503)

        return RedirectResponse(short_url, status_code=307)


# ------------------------------------------------------------------ /p2p/{invoice_id}
# Public Promise-to-Pay portal (linked in B2B chaser emails). ngrok forwards here,
# so the customer-facing date-selection portal must be served by the backend itself.

_P2P_PAGE = """<!DOCTYPE html>
<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>
<title>GreenBasket — Promise to Pay</title>
<style>
 *{{box-sizing:border-box}}
 body{{font-family:system-ui,sans-serif;background:#0e0b08;color:#e2e8f0;margin:0;padding:24px 16px;display:flex;justify-content:center}}
 .card{{background:#141d2b;border:1px solid #24344b;border-radius:18px;padding:26px 22px;max-width:420px;width:100%}}
 .brand{{color:#34d399;font-weight:700;font-size:15px;letter-spacing:.5px}}
 h1{{font-size:19px;margin:10px 0 4px;color:#fff}}
 .sub{{font-size:12px;color:#8fa3bd;margin:0 0 18px}}
 .row{{display:flex;justify-content:space-between;border-bottom:1px solid #1e2c40;padding:9px 0;font-size:13px}}
 .row span:first-child{{color:#8fa3bd}} .row span:last-child{{font-weight:600;color:#e2e8f0}}
 .amt{{color:#34d399;font-size:16px}}
 .label{{font-size:12px;color:#8fa3bd;margin:20px 0 10px;text-transform:uppercase;letter-spacing:1px}}
 .days{{display:grid;grid-template-columns:1fr 1fr;gap:9px}}
 .day{{border:1px solid #2d3b4e;background:#0f1826;border-radius:12px;padding:11px 8px;text-align:center;cursor:pointer;font-size:13px;color:#c7d5e8;transition:all .15s}}
 .day small{{display:block;color:#64748b;font-size:10px;margin-top:2px}}
 .day.sel{{border-color:#10b981;background:rgba(16,185,129,.12);color:#34d399;font-weight:700}}
 button.pay{{width:100%;margin-top:20px;background:linear-gradient(90deg,#10b981,#14b8a6);border:0;border-radius:12px;padding:14px;font-size:14px;font-weight:700;color:#052e1b;cursor:pointer}}
 button.pay:disabled{{opacity:.45}}
 .ok{{text-align:center;padding:20px 0}}
 .ok .tick{{font-size:44px}} .ok h2{{color:#34d399;font-size:17px;margin:10px 0 6px}} .ok p{{font-size:13px;color:#8fa3bd;line-height:1.6}}
 .err{{background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.4);color:#fda4af;font-size:12px;border-radius:10px;padding:10px;margin-top:14px;display:none}}
</style></head>
<body><div class='card' id='app'>
 <div class='brand'>🥦 GreenBasket · RecoverIQ Pro</div>
 <h1>Confirm Expected Payment Date</h1>
 <p class='sub'>Invoice #{inv_num} · {company}</p>
 <div class='row'><span>Invoice Amount</span><span class='amt'>₹{amount:,.2f}</span></div>
 <div class='row'><span>Due Date</span><span>{due}</span></div>
 <div class='row'><span>Overdue By</span><span>{overdue} days</span></div>
 <div class='label'>Select your expected payment date (within 7 days)</div>
 <div class='days' id='days'>{day_buttons}</div>
 <div class='err' id='err'></div>
 <button class='pay' id='go' disabled onclick='commit()'>Confirm Promise to Pay</button>
</div>
<script>
 var picked = null;
 document.querySelectorAll('.day').forEach(function(b){{
   b.onclick = function(){{
     document.querySelectorAll('.day').forEach(function(x){{x.classList.remove('sel')}});
     b.classList.add('sel'); picked = b.dataset.d;
     document.getElementById('go').disabled = false;
   }};
 }});
 function commit(){{
   if(!picked) return;
   var btn = document.getElementById('go'); btn.disabled = true; btn.textContent = 'Submitting…';
   fetch(window.location.pathname + '/commit', {{
     method:'POST', headers:{{'Content-Type':'application/json'}},
     body: JSON.stringify({{date: picked}})
   }}).then(function(r){{return r.json().then(function(j){{return {{ok:r.ok, j:j}}}})}}).then(function(res){{
     if(res.ok && res.j.ok){{
       document.getElementById('app').innerHTML = '<div class=\"ok\"><div class=\"tick\">🤝</div><h2>Promise Confirmed!</h2><p>Thank you! Your payment date of <b>' + res.j.promised_date + '</b> has been recorded.<br>A reminder will be sent before the due date.<br><br>— Accounts Receivable, RecoverIQ Pro</p></div>';
     }} else {{
       var e = document.getElementById('err'); e.style.display='block'; e.textContent = res.j.detail || 'Something went wrong. Please try again.'; btn.disabled = false; btn.textContent = 'Confirm Promise to Pay';
     }}
   }}).catch(function(){{
     var e = document.getElementById('err'); e.style.display='block'; e.textContent = 'Network error — please try again.'; btn.disabled = false; btn.textContent = 'Confirm Promise to Pay';
   }});
 }}
</script></body></html>"""


@app.get("/p2p/{invoice_id}")
async def p2p_portal(invoice_id: int):
    from fastapi.responses import HTMLResponse
    from datetime import datetime, timedelta
    from app.core.db import SessionLocal
    from app.models import B2BInvoice, Customer

    async with SessionLocal() as db:
        inv = await db.get(B2BInvoice, invoice_id)
        if not inv:
            return _pay_page("Invoice not found.", "", 404)
        cust = await db.get(Customer, inv.customer_id)
        company = cust.name if cust else "Customer"
        now = datetime.utcnow()
        overdue = max(0, (now - inv.due_date).days)

        buttons = ""
        for i in range(1, 8):
            d = now + timedelta(days=i)
            label = d.strftime("%d %b")
            day_name = d.strftime("%a")
            buttons += (f"<div class='day' data-d='{d.strftime('%Y-%m-%d')}'>{label}"
                        f"<small>{day_name}</small></div>")

        html = _P2P_PAGE.format(
            inv_num=inv.invoice_number, company=company,
            amount=inv.outstanding_amount,
            due=inv.due_date.strftime("%d %b %Y"),
            overdue=overdue, day_buttons=buttons)
        return HTMLResponse(content=html)


@app.post("/p2p/{invoice_id}/commit")
async def p2p_commit(invoice_id: int, body: dict):
    from datetime import datetime, timedelta
    from sqlalchemy import select as sa_select
    from app.core.db import SessionLocal
    from app.models import B2BInvoice, Customer, PromiseToPay, Merchant, AuditLog
    from app.services.events import broadcast

    date_str = (body or {}).get("date", "")
    try:
        chosen = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return {"ok": False, "detail": "Invalid date"}

    now = datetime.utcnow()
    if chosen.date() < now.date() or chosen.date() > (now + timedelta(days=7)).date():
        return {"ok": False, "detail": "Date must be within the next 7 days"}

    async with SessionLocal() as db:
        inv = await db.get(B2BInvoice, invoice_id)
        if not inv:
            return {"ok": False, "detail": "Invoice not found"}
        merchant_res = await db.execute(sa_select(Merchant).limit(1))
        merchant = merchant_res.scalars().first()

        p = PromiseToPay(
            merchant_id=merchant.id if merchant else 1,
            customer_id=inv.customer_id,
            invoice_id=inv.id,
            promised_amount=inv.outstanding_amount,
            promised_date=chosen,
            status="PROMISED",
        )
        db.add(p)
        db.add(AuditLog(failure_event_id=None, actor="customer", event="P2P_PROMISE_MADE",
                        detail={"invoice_id": inv.id, "invoice_number": inv.invoice_number,
                                "promised_date": date_str,
                                "amount": inv.outstanding_amount}))
        await db.commit()
        await db.refresh(p)
        await broadcast("promise.made", {"id": p.id, "invoice_number": inv.invoice_number,
                                         "promised_date": date_str})
        return {"ok": True, "id": p.id, "promised_date": chosen.strftime("%d %b %Y")}

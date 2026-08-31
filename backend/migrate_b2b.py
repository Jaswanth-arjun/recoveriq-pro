import sqlite3
import os

paths = [
    os.path.join(os.path.dirname(__file__), "recoveriq.db"),
    os.path.join(os.path.dirname(__file__), "..", "recoveriq.db"),
    os.path.join(os.path.dirname(__file__), "app.db"),
]

for db_path in paths:
    if os.path.exists(db_path):
        print(f"Migrating database at {db_path}...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("PRAGMA table_info(b2b_invoices)")
        cols = [row[1] for row in cursor.fetchall()]
        print("Existing b2b_invoices columns:", cols)

        if "payment_terms" not in cols:
            print("Adding column payment_terms to b2b_invoices...")
            cursor.execute("ALTER TABLE b2b_invoices ADD COLUMN payment_terms VARCHAR DEFAULT '30_days'")

        if "finance_contact" not in cols:
            print("Adding column finance_contact to b2b_invoices...")
            cursor.execute("ALTER TABLE b2b_invoices ADD COLUMN finance_contact VARCHAR DEFAULT ''")

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='recovery_policies'")
        if not cursor.fetchone():
            print("Creating recovery_policies table...")
            cursor.execute("""
                CREATE TABLE recovery_policies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    merchant_id INTEGER REFERENCES merchants(id),
                    name VARCHAR DEFAULT 'Standard Policy',
                    timeline_json JSON,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME
                )
            """)

        conn.commit()
        conn.close()
        print(f"Migration completed for {db_path}!")

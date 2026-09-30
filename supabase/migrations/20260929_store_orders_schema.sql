-- ==============================================================================
-- Supabase Schema: Single-Store Scope & Live Order Ingestion Engine
-- Execute this script in your Supabase Project SQL Editor
-- ==============================================================================

-- 1. Connected Stores Table
CREATE TABLE IF NOT EXISTS connected_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  consumer_key TEXT NOT NULL,
  consumer_secret TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crucial: Ensure unique index exists on url even if table pre-existed
CREATE UNIQUE INDEX IF NOT EXISTS idx_connected_stores_url ON connected_stores(url);

-- Crucial: Make user_id nullable if the table was previously created with user_id NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'connected_stores' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE connected_stores ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Orders Table (JSONB Payload Preservation)
CREATE TABLE IF NOT EXISTS store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES connected_stores(id) ON DELETE CASCADE,
  wc_order_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  total NUMERIC(12, 2) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  billing JSONB,
  shipping JSONB,
  line_items JSONB,
  meta_data JSONB,
  raw_payload JSONB NOT NULL,
  date_created TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, wc_order_id)
);

CREATE INDEX IF NOT EXISTS idx_store_orders_store_id ON store_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);

-- 3. Enable RLS and permissive policies for public API keys
ALTER TABLE connected_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on connected_stores" ON connected_stores;
CREATE POLICY "Allow all on connected_stores" ON connected_stores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on store_orders" ON store_orders;
CREATE POLICY "Allow all on store_orders" ON store_orders FOR ALL USING (true) WITH CHECK (true);

-- 4. Fix Webhook Logs table constraints & RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE webhook_logs ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE IF EXISTS webhook_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on webhook_logs" ON webhook_logs;
CREATE POLICY "Allow all on webhook_logs" ON webhook_logs FOR ALL USING (true) WITH CHECK (true);

-- 5. Store Telemetry & Metadata Columns
ALTER TABLE connected_stores ADD COLUMN IF NOT EXISTS wp_version TEXT;
ALTER TABLE connected_stores ADD COLUMN IF NOT EXISTS wc_version TEXT;
ALTER TABLE connected_stores ADD COLUMN IF NOT EXISTS total_orders_count INTEGER DEFAULT 0;
ALTER TABLE connected_stores ADD COLUMN IF NOT EXISTS webhook_active BOOLEAN DEFAULT false;
ALTER TABLE connected_stores ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- 6. Dynamic Profiles Table (Auto-generated UUIDs, No Hardcoded Inserts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'Super Admin',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on profiles" ON profiles;
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);


/*
  # Create Multi-tenant Schema

  1. New Tables
    - `tenants`: Core tenant information
    - `tenant_users`: User-tenant relationships
    - `tenant_settings`: Tenant-specific settings
    - `tenant_features`: Feature flags and limits
    - `tenant_billing`: Billing and subscription info
    - `tenant_api_keys`: API access keys
    - `tenant_usage`: Usage tracking
    - `tenant_audit_logs`: Audit trail

  2. Security
    - Enable RLS on all tables
    - Add policies for tenant isolation
    - Add policies for admin access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  domain text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tenant_users table (junction table)
CREATE TABLE IF NOT EXISTS tenant_users (
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

-- Create tenant_settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  timezone text DEFAULT 'UTC',
  date_format text DEFAULT 'YYYY-MM-DD',
  theme jsonb DEFAULT '{"primaryColor": "#2563eb"}',
  security_settings jsonb DEFAULT '{"mfaRequired": false, "sessionTimeout": 3600}',
  updated_at timestamptz DEFAULT now()
);

-- Create tenant_features table
CREATE TABLE IF NOT EXISTS tenant_features (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  occupation_search_limit integer DEFAULT 10,
  saved_searches_limit integer DEFAULT 3,
  custom_alerts boolean DEFAULT false,
  batch_processing boolean DEFAULT false,
  api_access boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  custom_branding boolean DEFAULT false,
  team_members_limit integer DEFAULT 1,
  data_exports boolean DEFAULT false,
  advanced_analytics boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Create tenant_billing table
CREATE TABLE IF NOT EXISTS tenant_billing (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  billing_email text,
  payment_method jsonb,
  billing_address jsonb,
  trial_ends_at timestamptz,
  next_billing_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tenant_api_keys table
CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  scopes text[] DEFAULT '{}',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- Create tenant_usage table
CREATE TABLE IF NOT EXISTS tenant_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  feature text NOT NULL,
  count integer DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  UNIQUE (tenant_id, feature, date)
);

-- Create tenant_audit_logs table
CREATE TABLE IF NOT EXISTS tenant_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant access
CREATE POLICY "Users can view their own tenant"
  ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their tenant settings"
  ON tenant_settings
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their tenant features"
  ON tenant_features
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create functions for tenant management
CREATE OR REPLACE FUNCTION create_tenant(
  tenant_name text,
  user_id uuid,
  plan text DEFAULT 'free'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Insert new tenant
  INSERT INTO tenants (name)
  VALUES (tenant_name)
  RETURNING id INTO new_tenant_id;

  -- Create tenant-user relationship
  INSERT INTO tenant_users (tenant_id, user_id, role)
  VALUES (new_tenant_id, user_id, 'owner');

  -- Initialize settings
  INSERT INTO tenant_settings (tenant_id)
  VALUES (new_tenant_id);

  -- Initialize features based on plan
  INSERT INTO tenant_features (
    tenant_id,
    occupation_search_limit,
    saved_searches_limit,
    custom_alerts,
    batch_processing,
    api_access,
    priority_support,
    custom_branding,
    team_members_limit,
    data_exports,
    advanced_analytics
  )
  SELECT
    new_tenant_id,
    CASE plan
      WHEN 'free' THEN 10
      WHEN 'basic' THEN 100
      WHEN 'professional' THEN 500
      WHEN 'enterprise' THEN -1
    END,
    CASE plan
      WHEN 'free' THEN 3
      WHEN 'basic' THEN 25
      WHEN 'professional' THEN 100
      WHEN 'enterprise' THEN -1
    END,
    plan != 'free',
    plan IN ('professional', 'enterprise'),
    plan IN ('professional', 'enterprise'),
    plan IN ('professional', 'enterprise'),
    plan = 'enterprise',
    CASE plan
      WHEN 'free' THEN 1
      WHEN 'basic' THEN 2
      WHEN 'professional' THEN 5
      WHEN 'enterprise' THEN -1
    END,
    plan != 'free',
    plan IN ('professional', 'enterprise');

  -- Initialize billing
  INSERT INTO tenant_billing (tenant_id, plan)
  VALUES (new_tenant_id, plan);

  RETURN new_tenant_id;
END;
$$;
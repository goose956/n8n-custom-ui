-- SaaS Factory Database Schema
-- Multi-tenant, multi-app architecture with single database

-- 1. The Apps Table (Master list of all applications)
CREATE TABLE IF NOT EXISTS apps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#3498db',
  n8n_workflow_id VARCHAR(100),
  version VARCHAR(50) DEFAULT '1.0.0',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. The Pages Table (Standard pages for each app)
CREATE TABLE IF NOT EXISTS pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  app_id INT NOT NULL,
  page_type ENUM('index', 'thanks', 'members', 'checkout', 'admin', 'custom') NOT NULL,
  title VARCHAR(255),
  content_json JSON,
  custom_css TEXT,
  custom_component_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
  UNIQUE KEY unique_app_page (app_id, page_type)
);

-- 3. The Plans Table (Subscription tiers per app)
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  app_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
  features_json JSON,
  stripe_price_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

-- 4. The Users Table (Shared across all apps)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. The Subscriptions Table (Links users to apps and plans)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  app_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('active', 'cancelled', 'past_due', 'free') DEFAULT 'active',
  stripe_subscription_id VARCHAR(100),
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_app (user_id, app_id)
);

-- 6. The App Usage Table (Track usage per app per user)
CREATE TABLE IF NOT EXISTS app_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  app_id INT NOT NULL,
  usage_type VARCHAR(50),
  usage_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

-- 7. The App Settings Table (App-specific configuration)
CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  app_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
  UNIQUE KEY unique_app_setting (app_id, setting_key)
);

-- 8. The API Keys Table (Per-app API keys for integrations)
CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  app_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  key_value TEXT NOT NULL,
  key_type VARCHAR(50),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

-- 9. The Workflows Table (n8n workflows per app)
CREATE TABLE IF NOT EXISTS workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  app_id INT NOT NULL,
  n8n_workflow_id VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_execution TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
  UNIQUE KEY unique_app_workflow (app_id, n8n_workflow_id)
);

-- 10. The Workflow Configs Table (Saved workflow field configurations)
CREATE TABLE IF NOT EXISTS workflow_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  UNIQUE KEY unique_workflow_config (workflow_id, config_key)
);

-- Indexes for better query performance
CREATE INDEX idx_apps_slug ON apps(slug);
CREATE INDEX idx_pages_app ON pages(app_id);
CREATE INDEX idx_plans_app ON plans(app_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_app ON subscriptions(app_id);
CREATE INDEX idx_app_usage_user_app ON app_usage(user_id, app_id);
CREATE INDEX idx_app_settings_app ON app_settings(app_id);
CREATE INDEX idx_api_keys_app ON api_keys(app_id);
CREATE INDEX idx_workflows_app ON workflows(app_id);

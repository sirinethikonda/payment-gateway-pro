-- 1. Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(36) PRIMARY KEY, -- Storing UUID as String for MySQL compatibility
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    api_secret VARCHAR(64) NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY, -- Format: order_ + 16 alphanumeric
    merchant_id VARCHAR(36) NOT NULL,
    amount INT NOT NULL, -- Amount in paise (minimum 100)
    currency VARCHAR(3) DEFAULT 'INR',
    receipt VARCHAR(255),
    notes JSON, -- MySQL native JSON type
    status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY, -- Format: pay_ + 16 alphanumeric
    order_id VARCHAR(64) NOT NULL,
    merchant_id VARCHAR(36) NOT NULL,
    amount INT NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    method VARCHAR(20) NOT NULL, -- 'upi' or 'card'
    status VARCHAR(20) DEFAULT 'processing', -- Starts directly at processing
    vpa VARCHAR(255), -- For UPI
    card_network VARCHAR(20), -- For Card (visa, mastercard, etc)
    card_last4 VARCHAR(4), -- For Card
    error_code VARCHAR(50),
    error_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- Required Indexes for Performance
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 4. Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL,
    merchant_id VARCHAR(36) NOT NULL,
    amount INT NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- 5. Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id VARCHAR(36) PRIMARY KEY,
    merchant_id VARCHAR(36) NOT NULL,
    event VARCHAR(50) NOT NULL,
    payload JSON NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    response_code INT,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- 6. Idempotency Keys Table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key_value VARCHAR(255),
    merchant_id VARCHAR(36) NOT NULL,
    response JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (key_value, merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- Schema Modifications (Will fail safely if columns exist due to continue-on-error=true)
ALTER TABLE merchants ADD COLUMN webhook_secret VARCHAR(64);
ALTER TABLE payments ADD COLUMN captured BOOLEAN DEFAULT FALSE;

-- New Indexes
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_webhook_logs_merchant_id ON webhook_logs(merchant_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_next_retry ON webhook_logs(next_retry_at);
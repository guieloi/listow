-- Database schema for Listow Shopping List App

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping list items table
CREATE TABLE IF NOT EXISTS shopping_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50),
    price DECIMAL(10,2),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- List collaborators table (for sharing lists)
CREATE TABLE IF NOT EXISTS list_collaborators (
    id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(10) CHECK (permission IN ('read', 'write')) DEFAULT 'read',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(list_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_owner ON shopping_lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_collaborators_list ON list_collaborators(list_id);
CREATE INDEX IF NOT EXISTS idx_list_collaborators_user ON list_collaborators(user_id);

-- Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

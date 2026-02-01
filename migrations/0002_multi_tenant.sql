-- Migration: 0002_multi_tenant.sql
-- Description: Add multi-tenant support by associating categories and documents with an owner_email.

-- Disable foreign keys temporarily if needed (D1 handles this within its own scope, but it's good practice)
-- PRAGMA foreign_keys=OFF;

-- 1. Create new categories table with owner_email and composite unique constraint
CREATE TABLE new_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    sidebar_position INTEGER DEFAULT 0,
    is_collapsible BOOLEAN DEFAULT true,
    is_collapsed BOOLEAN DEFAULT false,
    owner_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES new_categories (id) ON DELETE CASCADE,
    UNIQUE(slug, owner_email)
);

-- 2. Copy existing categories into the new table, defaulting to admin@example.com
INSERT INTO new_categories (id, name, slug, description, parent_id, sidebar_position, is_collapsible, is_collapsed, owner_email, created_at, updated_at)
SELECT id, name, slug, description, parent_id, sidebar_position, is_collapsible, is_collapsed, 'admin@example.com', created_at, updated_at 
FROM categories;

-- 3. Create new documents table with owner_email and composite unique constraint
CREATE TABLE new_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    frontmatter TEXT,
    category_id INTEGER,
    sidebar_position INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_draft BOOLEAN DEFAULT false,
    owner_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES new_categories (id) ON DELETE SET NULL,
    UNIQUE(slug, owner_email)
);

-- 4. Copy existing documents into the new table, defaulting to admin@example.com
INSERT INTO new_documents (id, title, slug, content, frontmatter, category_id, sidebar_position, is_published, is_draft, owner_email, created_at, updated_at)
SELECT id, title, slug, content, frontmatter, category_id, sidebar_position, is_published, is_draft, 'admin@example.com', created_at, updated_at 
FROM documents;

-- 5. Recreate document_versions table to point to new_documents
CREATE TABLE new_document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    frontmatter TEXT,
    version_number INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES new_documents (id) ON DELETE CASCADE
);

INSERT INTO new_document_versions (id, document_id, title, content, frontmatter, version_number, created_at)
SELECT id, document_id, title, content, frontmatter, version_number, created_at FROM document_versions;

-- 6. Recreate assets table to point to new_documents
CREATE TABLE new_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    document_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES new_documents (id) ON DELETE SET NULL
);

INSERT INTO new_assets (id, filename, original_name, mime_type, size_bytes, storage_path, document_id, created_at)
SELECT id, filename, original_name, mime_type, size_bytes, storage_path, document_id, created_at FROM assets;

-- 7. Drop old tables safely
DROP TABLE assets;
DROP TABLE document_versions;
DROP TABLE documents;
DROP TABLE categories;

-- 8. Rename new tables to replace the old ones
ALTER TABLE new_categories RENAME TO categories;
ALTER TABLE new_documents RENAME TO documents;
ALTER TABLE new_document_versions RENAME TO document_versions;
ALTER TABLE new_assets RENAME TO assets;

-- 9. Recreate indexes for performance, including owner_email mapping
CREATE INDEX idx_documents_slug_owner ON documents(slug, owner_email);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_published ON documents(is_published);
CREATE INDEX idx_documents_owner ON documents(owner_email);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug_owner ON categories(slug, owner_email);
CREATE INDEX idx_categories_owner ON categories(owner_email);

CREATE INDEX idx_document_versions_doc ON document_versions(document_id);
CREATE INDEX idx_assets_document ON assets(document_id);

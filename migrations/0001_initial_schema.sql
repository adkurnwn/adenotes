-- Migration: 0001_initial_schema.sql
-- Description: Create initial database schema for documents, categories, versions, and assets

-- Categories table for hierarchical structure (Docusaurus sidebar)
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER,
    sidebar_position INTEGER DEFAULT 0,
    is_collapsible BOOLEAN DEFAULT true,
    is_collapsed BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- Documents table (Docusaurus Pages)
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    frontmatter TEXT,
    category_id INTEGER,
    sidebar_position INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_draft BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
);

-- Document versions table (Content History)
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    frontmatter TEXT,
    version_number INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

-- Assets table (Images and Files)
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    document_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_documents_slug ON documents(slug);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_published ON documents(is_published);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_document_versions_doc ON document_versions(document_id);
CREATE INDEX idx_assets_document ON assets(document_id);
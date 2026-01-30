-- Migration: 0002_seed_data.sql
-- Description: Insert initial seed data for testing

-- Insert initial categories
INSERT INTO categories (name, slug, description, parent_id, sidebar_position) VALUES
('Getting Started', 'getting-started', 'Introduction and basic setup', NULL, 1),
('Tutorial', 'tutorial', 'Step by step tutorial', NULL, 2),
('API Reference', 'api', 'Complete API documentation', NULL, 3),
('Guides', 'guides', 'How-to guides and best practices', NULL, 4);

-- Insert tutorial subcategories
INSERT INTO categories (name, slug, description, parent_id, sidebar_position) VALUES
('Basics', 'tutorial-basics', 'Basic tutorial steps', 2, 1),
('Advanced', 'tutorial-advanced', 'Advanced tutorial topics', 2, 2);

-- Insert initial documents
INSERT INTO documents (title, slug, content, frontmatter, category_id, sidebar_position) VALUES
(
    'Introduction', 
    'intro',
    '# Welcome to Note-ADE

This is your dynamic documentation platform built with Docusaurus and powered by Cloudflare Workers with D1 database.

## Features

- **Dynamic Content**: All content is stored in a database and can be edited in real-time
- **Native Docusaurus**: Full Docusaurus experience with all features
- **Admin Interface**: Built-in content management system
- **Cloudflare Integration**: Powered by Workers and D1 for global performance

## Getting Started

Navigate through the sidebar to explore the documentation or use the admin panel to create new content.',
    '{"description": "Introduction to Note-ADE platform", "keywords": ["intro", "getting started", "documentation"]}',
    1,
    1
),
(
    'Installation',
    'installation', 
    '# Installation

Follow these steps to get started with Note-ADE:

## Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- Cloudflare account

## Setup Steps

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure wrangler.jsonc
4. Run migrations: `wrangler d1 migrations apply note-ade-db --local`
5. Start development: `npm run preview`

## Configuration

Update your `wrangler.jsonc` file with your database ID and other settings.',
    '{"description": "How to install and set up Note-ADE", "keywords": ["installation", "setup", "configuration"]}',
    1,
    2
),
(
    'Create a Document',
    'create-document',
    '# Create a Document

Learn how to create new documents using the admin interface.

## Using the Admin Panel

1. Navigate to the admin section
2. Click "New Document"
3. Fill in the title and content
4. Choose a category
5. Save or publish

## Markdown Support

You can use all standard Markdown features:

- **Bold text**
- *Italic text*
- `Code blocks`
- Links and images
- Tables and lists

## Frontmatter

Configure document metadata using frontmatter:

```yaml
---
title: My Document
description: Document description
keywords: [keyword1, keyword2]
---
```',
    '{"description": "How to create new documents", "keywords": ["create", "document", "admin", "markdown"]}',
    5,
    1
);

-- Insert document versions for tracking
INSERT INTO document_versions (document_id, title, content, frontmatter, version_number) 
SELECT id, title, content, frontmatter, 1 FROM documents;
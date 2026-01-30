# Docusaurus + Database Notes Platform - Project Plan

## Overview
A dynamic documentation platform using authentic Docusaurus with database-driven markdown content, deployed on Cloudflare Workers with D1 database integration. The platform provides Docusaurus's native documentation experience while enabling real-time CRUD operations on markdown content through a database backend. Single-user application with Cloudflare Zero Trust authentication.

## Architecture Overview

### Core Concept
- **Frontend**: Authentic Docusaurus documentation site
- **Content Source**: Dynamic loading from D1 database instead of static files
- **Backend**: Cloudflare Workers API for markdown CRUD operations
- **Deployment**: Hybrid approach - Docusaurus build + Workers API on Cloudflare
- **Content Management**: Web-based editor for creating/editing markdown content

### Key Benefits
- Native Docusaurus experience (navigation, search, theming)
- Real-time content updates without rebuilds
- Database-backed content with full CRUD capabilities
- Seamless integration with Cloudflare ecosystem
- Maintains all Docusaurus features (plugins, themes, etc.)

## Docusaurus Design Specifications

### Visual Design Requirements
- **Exact color matching**: Use Docusaurus blue (#2e8555), gray (#525860), backgrounds
- **Typography**: Inter font family, specific font weights and sizes
- **Spacing**: 8px grid system, exact margins and padding
- **Borders**: 1px solid borders with specific gray tones
- **Shadows**: Subtle box shadows for cards and dropdowns
- **Animations**: Smooth 200ms transitions for hover states

### Sidebar Specifications
- **Width**: 300px on desktop, slide-out on mobile
- **Background**: White (#fff) in light mode, dark gray in dark mode
- **Active item**: Blue left border, light blue background
- **Hover states**: Subtle gray background change
- **Categories**: Collapsible with chevron rotation
- **Scrolling**: Custom scrollbar styling
- **Typography**: 14px font size, 500 weight for categories

### Header Specifications
- **Height**: 60px fixed height
- **Background**: White with bottom border
- **Search**: Rounded input with icon, placeholder styling
- **Theme toggle**: Sun/moon icons with smooth transition
- **Mobile**: Hamburger menu with slide-out sidebar

## Tech Stack
- **Documentation Platform**: Docusaurus v3.x
- **Content Management**: Custom web-based markdown editor
- **Backend**: Cloudflare Workers (API endpoints)
- **Database**: Cloudflare D1 SQLite (markdown content storage)
- **Authentication**: Cloudflare Zero Trust Application
- **Deployment**: Cloudflare Pages (Docusaurus) + Workers (API)
- **Content Loading**: Custom Docusaurus plugin for database content
- **Local Development**: D1 local development + Docusaurus dev server

## Hybrid Architecture

### Docusaurus Site (Frontend)
- Standard Docusaurus documentation site
- Custom plugin to load content from API instead of filesystem
- Real-time content updates via API integration
- Native Docusaurus navigation, search, and theming
- Admin interface overlay for content management

### Cloudflare Workers API (Backend)
- RESTful API endpoints for markdown CRUD operations
- Content serving endpoints for Docusaurus consumption
- File system simulation for Docusaurus compatibility
- Authentication middleware integration

### Content Flow
1. **Read**: Docusaurus loads content via custom plugin → API → Database
2. **Write**: Admin editor → API → Database → Trigger Docusaurus refresh
3. **Deploy**: Docusaurus build uses API content → Static build → Cloudflare Pages

## Core Features

### 1. Native Docusaurus Documentation Experience
- Authentic Docusaurus interface with all native features
- Sidebar navigation with category-based organization
- Built-in search functionality (Algolia DocSearch integration)
- Native theming and responsive design
- Plugin ecosystem compatibility

### 2. Database-Driven Content Management
- Dynamic markdown content loading from D1 database
- Real-time content updates without static rebuilds
- Version control and history tracking for all documents
- Hierarchical organization (categories, subcategories)
- Slug-based URL routing maintained

### 3. Web-Based Content Editor
- Integrated markdown editor with live preview
- Docusaurus-compatible frontmatter editing
- Image upload and asset management
- Draft/publish workflow
- Content validation and error checking

### 4. Docusaurus Plugin Integration
- Custom plugin for database content loading
- Maintains compatibility with existing Docusaurus plugins
- Enhanced search with database content indexing
- Custom sidebar generation from database hierarchy
- SEO optimization with dynamic meta generation

### 5. Content Synchronization
- Real-time content updates across all users
- Automatic content refresh in Docusaurus
- Build trigger system for static generation
- Content caching and performance optimization

### 6. Admin Interface
- Overlay admin panel on Docusaurus site
- Content management dashboard
- User authentication integration
- Content analytics and usage tracking

## Database Schema (D1)

### Documents Table (Docusaurus Pages)
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL path for Docusaurus routing
    content TEXT NOT NULL, -- Full markdown content
    frontmatter TEXT, -- YAML frontmatter as JSON
    category_id INTEGER,
    sidebar_position INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_draft BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
);

CREATE INDEX idx_documents_slug ON documents(slug);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_published ON documents(is_published);
```

### Categories Table (Docusaurus Sidebar Structure)
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- Category path
    description TEXT,
    parent_id INTEGER, -- Hierarchical structure
    sidebar_position INTEGER DEFAULT 0,
    is_collapsible BOOLEAN DEFAULT true,
    is_collapsed BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

### Document Versions Table (Content History)
```sql
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

CREATE INDEX idx_document_versions_doc ON document_versions(document_id);
```

### Assets Table (Images and Files)
```sql
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL, -- Cloudflare R2 or similar
    document_id INTEGER, -- Optional association
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE SET NULL
);

CREATE INDEX idx_assets_document ON assets(document_id);
```

## API Endpoints (Worker Routes)

### Content API (For Docusaurus Plugin)
- `GET /api/content/sidebar` - Generate Docusaurus sidebar structure
- `GET /api/content/documents/:slug` - Get document markdown content
- `GET /api/content/documents/:slug/metadata` - Get document frontmatter
- `GET /api/content/manifest` - Get all documents for build process
- `GET /api/content/search-index` - Generate search index for Docusaurus

### Admin API (For Content Management)
- `GET /api/admin/documents` - List all documents with filtering
- `GET /api/admin/documents/:id` - Get document for editing
- `POST /api/admin/documents` - Create new document
- `PUT /api/admin/documents/:id` - Update document
- `DELETE /api/admin/documents/:id` - Delete document
- `POST /api/admin/documents/:id/publish` - Publish draft document

### Categories API
- `GET /api/admin/categories` - Get category hierarchy
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `PUT /api/admin/categories/:id/reorder` - Reorder categories

### Assets API
- `POST /api/admin/assets/upload` - Upload images/files
- `GET /api/admin/assets` - List uploaded assets
- `DELETE /api/admin/assets/:id` - Delete asset

### Build & Deployment
- `POST /api/admin/build/trigger` - Trigger Docusaurus rebuild
- `GET /api/admin/build/status` - Get build status
- `POST /api/admin/deploy` - Deploy to production

## File Structure Plan

```
docusaurus-site/
├── docusaurus.config.js
├── package.json
├── src/
│   ├── components/
│   │   ├── AdminPanel/
│   │   │   ├── DocumentEditor.js
│   │   │   ├── CategoryManager.js
│   │   │   ├── AssetUploader.js
│   │   │   └── AdminOverlay.js
│   │   ├── ContentLoader/
│   │   │   ├── DatabaseContent.js
│   │   │   └── ContentProvider.js
│   │   └── CustomMarkdown/
│   │       └── EnhancedCodeBlock.js
│   ├── plugins/
│   │   ├── database-content-plugin/
│   │   │   ├── index.js
│   │   │   ├── contentLoader.js
│   │   │   ├── sidebarGenerator.js
│   │   │   └── markdownProcessor.js
│   │   └── admin-interface-plugin/
│   │       ├── index.js
│   │       └── adminRoutes.js
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── index.js
│   │   │   ├── documents.js
│   │   │   └── categories.js
│   │   └── index.js
│   └── css/
│       ├── custom.css
│       └── admin.css
├── static/
│   └── img/
└── docs/ (fallback/example content)

api-server/ (Cloudflare Workers)
├── src/
│   ├── routes/
│   │   ├── content.js
│   │   ├── admin.js
│   │   ├── categories.js
│   │   ├── assets.js
│   │   └── build.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── cors.js
│   │   └── validation.js
│   ├── services/
│   │   ├── database.js
│   │   ├── markdown.js
│   │   ├── assets.js
│   │   └── docusaurus.js
│   ├── utils/
│   │   ├── slugify.js
│   │   ├── frontmatter.js
│   │   └── hierarchy.js
│   └── index.js
├── wrangler.toml
└── package.json

shared/
├── types/
│   ├── documents.ts
│   ├── categories.ts
│   └── api.ts
└── schemas/
    ├── database.sql
    └── migrations/
```

## Dependencies to Add

### Docusaurus Site
- **Core**: 
  - @docusaurus/core (latest v3.x)
  - @docusaurus/preset-classic
  - @docusaurus/theme-classic
  - @docusaurus/plugin-content-docs
- **Plugins**: 
  - @docusaurus/plugin-sitemap
  - @docusaurus/plugin-google-analytics (optional)
  - docusaurus-plugin-sass (if needed)
- **Content Management**: 
  - react-markdown (for editor preview)
  - @monaco-editor/react (code editor)
  - gray-matter (frontmatter parsing)
  - remark/rehype plugins for enhanced markdown
- **API Integration**: 
  - axios or fetch for API calls
  - swr or react-query for caching

### API Server (Cloudflare Workers)
- **Core**: 
  - hono (lightweight web framework) ✓
  - @cloudflare/workers-types
- **Database**: 
  - @cloudflare/d1 (database binding)
  - drizzle-orm (optional, for better queries)
- **Content Processing**: 
  - gray-matter (frontmatter handling)
  - markdown-it or remark (markdown processing)
  - slugify (URL-friendly slugs)
- **Validation**: 
  - zod (schema validation)
  - joi (alternative validation)

## Implementation Priority

1. **Database Schema Setup** (hierarchical documents and categories)
2. **Cloudflare Workers API** (content CRUD and serving endpoints)
3. **Docusaurus Custom Plugin** (database content loading)
4. **Admin Interface Integration** (overlay on Docusaurus site)
5. **Content Editor Component** (markdown editing with live preview)
6. **Asset Management System** (image uploads and file handling)
7. **Build & Deployment Pipeline** (automated Docusaurus builds)
8. **Authentication Integration** (Zero Trust + admin access)
9. **Search Enhancement** (database content indexing)
10. **Performance Optimization** (caching and CDN integration)

## Development Workflow

### Local Development
1. **API Server**: Run Wrangler dev for Workers + D1 local
2. **Docusaurus**: Run `npm start` with local API endpoints
3. **Content Sync**: Real-time updates from database to Docusaurus
4. **Admin Access**: Overlay admin interface for content management

### Production Deployment
1. **API**: Deploy Workers to Cloudflare with production D1
2. **Docusaurus**: Build static site and deploy to Cloudflare Pages
3. **Integration**: Configure custom domain and routing
4. **CDN**: Optimize asset delivery and caching strategies
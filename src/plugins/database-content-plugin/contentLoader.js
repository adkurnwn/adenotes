const fetch = require('node-fetch');
const path = require('path');

// API base URL - will be configurable
const getApiUrl = (options) => {
  return options?.apiUrl || process.env.API_URL || 'http://127.0.0.1:8787/api';
};

/**
 * Load content - In SPA mode, we do NOT load from DB at build time.
 * Content is fetched dynamically in the React component.
 */
async function loadContent(options = {}) {
  console.log('🔄 SPA Mode: Skipping build-time database fetch...');
  return {
    loadedAt: new Date().toISOString()
  };
}

/**
 * Process loaded content and create Docusaurus pages
 */
async function contentDidLoad({ content, actions }) {
  const { addRoute } = actions;

  console.log('🔨 Registering essential SPA routes...');

  // Explicit route for creating new documents
  addRoute({
    path: '/new',
    component: '@site/src/components/DatabaseDocument',
    exact: true,
    modules: {},
  });

  console.log(`✅ SPA routing disabled for unknown paths (delegated to swizzled NotFound)`);
}

/**
 * Get document by slug from loaded content
 */
function getDocumentBySlug(content, slug) {
  return content.documents?.find(doc => doc.slug === slug && doc.is_published);
}

module.exports = {
  loadContent,
  contentDidLoad,
  getDocumentBySlug
};
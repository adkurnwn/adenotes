const fetch = require('node-fetch');
const path = require('path');

// API base URL - will be configurable
const getApiUrl = (options) => {
  return options?.apiUrl || process.env.API_URL || 'http://127.0.0.1:8787/api';
};

/**
 * Load content from database via API
 */
async function loadContent(options = {}) {
  const apiUrl = getApiUrl(options);
  
  try {
    console.log('🔄 Loading content from database...');
    
    // Fetch all documents and sidebar structure
    const [documentsRes, sidebarRes, manifestRes] = await Promise.all([
      fetch(`${apiUrl}/admin/documents`),
      fetch(`${apiUrl}/content/sidebar`),
      fetch(`${apiUrl}/content/manifest`)
    ]);
    
    if (!documentsRes.ok || !sidebarRes.ok || !manifestRes.ok) {
      throw new Error(`API request failed: ${documentsRes.status}`);
    }
    
    const [documentsData, sidebarData, manifestData] = await Promise.all([
      documentsRes.json(),
      sidebarRes.json(),
      manifestRes.json()
    ]);
    
    console.log(`✅ Loaded ${documentsData.documents?.length || 0} documents from database`);
    
    return {
      documents: documentsData.documents || [],
      sidebar: sidebarData.sidebar || [],
      manifest: manifestData,
      loadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Failed to load content from database:', error.message);
    
    // Return fallback content in case of API failure
    return {
      documents: [],
      sidebar: [],
      manifest: { documents: [], generated_at: new Date().toISOString() },
      loadedAt: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Process loaded content and create Docusaurus pages
 */
async function contentDidLoad({ content, actions, allContent, options }) {
  const { createData, addRoute } = actions;
  
  if (!content.documents || content.documents.length === 0) {
    console.warn('⚠️ No documents loaded from database');
    return;
  }
  
  console.log('🔨 Processing database content for Docusaurus...');
  
  // Create data files for client-side access
  await createData('database-content.json', JSON.stringify({
    documents: content.documents,
    sidebar: content.sidebar,
    loadedAt: content.loadedAt
  }));
  
  // Create routes for each document
  for (const document of content.documents) {
    if (!document.is_published) continue;
    
    const routePath = `/${document.slug}`;
    
    // Create individual document data file
    const documentData = {
      id: document.id,
      title: document.title,
      slug: document.slug,
      content: document.content,
      frontmatter: document.frontmatter ? JSON.parse(document.frontmatter) : {},
      category_name: document.category_name,
      updated_at: document.updated_at,
      metadata: {
        source: 'database',
        loadedAt: content.loadedAt
      }
    };
    
    const documentDataPath = await createData(
      `document-${document.slug}.json`,
      JSON.stringify(documentData)
    );
    
    // Add route for the document
    addRoute({
      path: routePath,
      component: '@site/src/components/DatabaseDocument',
      exact: true,
      modules: {
        documentData: documentDataPath,
      },
    });
  }
  
  console.log(`✅ Created ${content.documents.filter(d => d.is_published).length} document routes`);
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
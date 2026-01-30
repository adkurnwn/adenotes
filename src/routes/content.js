import { Hono } from 'hono'

const contentRoutes = new Hono()

// Generate Docusaurus sidebar structure
contentRoutes.get('/sidebar', async (c) => {
  try {
    const db = c.env.note_ade_db
    
    // Get categories with their documents
    const categories = await db.prepare(`
      SELECT c.*, d.id as doc_id, d.title as doc_title, d.slug as doc_slug
      FROM categories c
      LEFT JOIN documents d ON c.id = d.category_id AND d.is_published = 1
      ORDER BY c.sidebar_position, d.sidebar_position
    `).all()
    
    // Build hierarchical structure
    const sidebarStructure = buildSidebarHierarchy(categories.results || [])
    
    return c.json({ sidebar: sidebarStructure })
  } catch (error) {
    return c.json({ error: 'Failed to generate sidebar' }, 500)
  }
})

// Get document markdown content
contentRoutes.get('/documents/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const db = c.env.note_ade_db
    
    const document = await db.prepare(`
      SELECT d.*, c.name as category_name, c.slug as category_slug
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.slug = ? AND d.is_published = 1
    `).bind(slug).first()
    
    if (!document) {
      return c.json({ error: 'Document not found' }, 404)
    }
    
    // Parse frontmatter
    const frontmatter = document.frontmatter ? JSON.parse(document.frontmatter) : {}
    
    return c.json({
      id: document.id,
      title: document.title,
      slug: document.slug,
      content: document.content,
      frontmatter,
      category: {
        name: document.category_name,
        slug: document.category_slug
      },
      updated_at: document.updated_at
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch document' }, 500)
  }
})

// Get document manifest for builds
contentRoutes.get('/manifest', async (c) => {
  try {
    const db = c.env.note_ade_db
    
    const documents = await db.prepare(`
      SELECT d.slug, d.title, d.updated_at, c.slug as category_slug
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.is_published = 1
      ORDER BY d.updated_at DESC
    `).all()
    
    return c.json({
      documents: documents.results || [],
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ error: 'Failed to generate manifest' }, 500)
  }
})

// Generate search index
contentRoutes.get('/search-index', async (c) => {
  try {
    const db = c.env.note_ade_db
    
    const documents = await db.prepare(`
      SELECT d.title, d.slug, d.content, d.frontmatter, c.name as category_name
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.is_published = 1
    `).all()
    
    const searchIndex = (documents.results || []).map(doc => {
      const frontmatter = doc.frontmatter ? JSON.parse(doc.frontmatter) : {}
      return {
        id: doc.slug,
        title: doc.title,
        content: doc.content.substring(0, 500) + '...', // Truncate for search
        url: `/${doc.slug}`,
        category: doc.category_name,
        keywords: frontmatter.keywords || []
      }
    })
    
    return c.json({ index: searchIndex })
  } catch (error) {
    return c.json({ error: 'Failed to generate search index' }, 500)
  }
})

// Helper function to build sidebar hierarchy
function buildSidebarHierarchy(categories) {
  const categoryMap = new Map()
  const rootCategories = []
  
  // First pass: create category entries
  categories.forEach(row => {
    if (!categoryMap.has(row.id)) {
      categoryMap.set(row.id, {
        type: 'category',
        label: row.name,
        collapsible: row.is_collapsible,
        collapsed: row.is_collapsed,
        items: []
      })
    }
    
    // Add document to category if it exists
    if (row.doc_id) {
      categoryMap.get(row.id).items.push({
        type: 'doc',
        id: row.doc_slug,
        label: row.doc_title
      })
    }
  })
  
  // Second pass: build hierarchy
  categories.forEach(row => {
    const category = categoryMap.get(row.id)
    if (row.parent_id && categoryMap.has(row.parent_id)) {
      categoryMap.get(row.parent_id).items.push(category)
    } else if (!row.parent_id) {
      rootCategories.push(category)
    }
  })
  
  return rootCategories
}

export { contentRoutes }
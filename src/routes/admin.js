import { Hono } from 'hono'

const adminRoutes = new Hono()

// List all documents with filtering
adminRoutes.get('/documents', async (c) => {
  try {
    const db = c.env.note_ade_db
    const { category, status, search } = c.req.query()

    let query = `
      SELECT d.*, c.name as category_name, c.slug as category_slug
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE 1=1
    `
    const params = []

    if (category) {
      query += ' AND d.category_id = ?'
      params.push(category)
    }

    if (status === 'draft') {
      query += ' AND d.is_draft = 1'
    } else if (status === 'published') {
      query += ' AND d.is_published = 1'
    }

    if (search) {
      query += ' AND (d.title LIKE ? OR d.content LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY d.updated_at DESC'

    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query)
    const documents = await stmt.all()

    return c.json({ documents: documents.results || [] })
  } catch (error) {
    return c.json({ error: 'Failed to fetch documents' }, 500)
  }
})

// Get document for editing
adminRoutes.get('/documents/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.note_ade_db

    const document = await db.prepare(`
      SELECT d.*, c.name as category_name
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.id = ?
    `).bind(id).first()

    if (!document) {
      return c.json({ error: 'Document not found' }, 404)
    }

    const frontmatter = document.frontmatter ? JSON.parse(document.frontmatter) : {}

    return c.json({
      ...document,
      frontmatter
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch document' }, 500)
  }
})

// Create new document
adminRoutes.post('/documents', async (c) => {
  try {
    const db = c.env.note_ade_db
    const body = await c.req.json()

    // Default values if undefined
    const { title, slug, content, frontmatter, category_id, is_draft } = body

    // Check if slug already exists
    const existing = await db.prepare('SELECT id FROM documents WHERE slug = ?').bind(slug).first()
    if (existing) {
      return c.json({ error: 'Slug already exists' }, 400)
    }

    const frontmatterJson = frontmatter ? JSON.stringify(frontmatter) : null

    // Sanitise inputs for D1
    const bindCategoryId = category_id === undefined ? null : category_id
    // Default is_draft to true for new docs if undefined
    const bindIsDraft = is_draft === undefined || is_draft === true ? 1 : 0
    const bindIsPublished = bindIsDraft ? 0 : 1

    const result = await db.prepare(`
      INSERT INTO documents (title, slug, content, frontmatter, category_id, is_draft, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(title, slug, content, frontmatterJson, bindCategoryId, bindIsDraft, bindIsPublished).run()

    // Create initial version
    await db.prepare(`
      INSERT INTO document_versions (document_id, title, content, frontmatter, version_number)
      VALUES (?, ?, ?, ?, 1)
    `).bind(result.meta.last_row_id, title, content, frontmatterJson).run()

    return c.json({ id: result.meta.last_row_id, message: 'Document created successfully' })
  } catch (error) {
    console.error('Failed to create document:', error);
    return c.json({ error: 'Failed to create document: ' + error.message }, 500)
  }
})

// Update document
adminRoutes.put('/documents/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.note_ade_db
    const body = await c.req.json()

    const { title, slug, content, frontmatter, category_id, is_draft } = body

    // Check if new slug conflicts with existing documents (excluding current)
    if (slug) {
      const existing = await db.prepare('SELECT id FROM documents WHERE slug = ? AND id != ?').bind(slug, id).first()
      if (existing) {
        return c.json({ error: 'Slug already exists' }, 400)
      }
    }

    const frontmatterJson = frontmatter ? JSON.stringify(frontmatter) : null

    // Sanitise inputs for D1
    const bindCategoryId = category_id === undefined ? null : category_id

    // For update, careful about is_draft undefined.
    // Assuming UI always sends current state. If undefined, default to 0 (published) or 1?
    // Let's assume passed value is truthy/falsy.
    const bindIsDraft = is_draft ? 1 : 0
    const bindIsPublished = bindIsDraft ? 0 : 1

    // Get current version number
    const currentVersion = await db.prepare('SELECT MAX(version_number) as max_version FROM document_versions WHERE document_id = ?').bind(id).first()
    const newVersionNumber = (currentVersion?.max_version || 0) + 1

    // Update document
    await db.prepare(`
      UPDATE documents 
      SET title = ?, slug = ?, content = ?, frontmatter = ?, category_id = ?, 
          is_draft = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title, slug, content, frontmatterJson, bindCategoryId, bindIsDraft, bindIsPublished, id).run()

    // Create new version
    await db.prepare(`
      INSERT INTO document_versions (document_id, title, content, frontmatter, version_number)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, title, content, frontmatterJson, newVersionNumber).run()

    return c.json({ message: 'Document updated successfully' })
  } catch (error) {
    console.error('Failed to update document:', error);
    return c.json({ error: 'Failed to update document: ' + error.message }, 500)
  }
})

// Delete document
adminRoutes.delete('/documents/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.note_ade_db

    // Delete document (cascades to versions due to FK constraint)
    await db.prepare('DELETE FROM documents WHERE id = ?').bind(id).run()

    return c.json({ message: 'Document deleted successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to delete document' }, 500)
  }
})

// Publish document
adminRoutes.post('/documents/:id/publish', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.note_ade_db

    await db.prepare(`
      UPDATE documents 
      SET is_draft = 0, is_published = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run()

    return c.json({ message: 'Document published successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to publish document' }, 500)
  }
})

export { adminRoutes }
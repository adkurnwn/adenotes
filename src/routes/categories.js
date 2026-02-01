import { Hono } from 'hono'

const categoriesRoutes = new Hono()

// Get category hierarchy
categoriesRoutes.get('/', async (c) => {
  try {
    const db = c.env.note_ade_db
    const userEmail = c.get('userEmail')
    
    const categories = await db.prepare(`
      SELECT c.*, 
             COUNT(d.id) as document_count,
             GROUP_CONCAT(d.title) as document_titles
      FROM categories c
      LEFT JOIN documents d ON c.id = d.category_id AND d.is_published = 1 AND d.owner_email = ?
      WHERE c.owner_email = ?
      GROUP BY c.id
      ORDER BY c.sidebar_position
    `).bind(userEmail, userEmail).all()
    
    return c.json({ categories: categories.results || [] })
  } catch (error) {
    return c.json({ error: 'Failed to fetch categories' }, 500)
  }
})

// Create category
categoriesRoutes.post('/', async (c) => {
  try {
    const db = c.env.note_ade_db
    const userEmail = c.get('userEmail')
    const body = await c.req.json()
    
    const { name, slug, description, parent_id, sidebar_position = 0 } = body
    
    // Check if slug already exists for this user
    const existing = await db.prepare('SELECT id FROM categories WHERE slug = ? AND owner_email = ?').bind(slug, userEmail).first()
    if (existing) {
      return c.json({ error: 'Category slug already exists' }, 400)
    }
    
    const result = await db.prepare(`
      INSERT INTO categories (name, slug, description, parent_id, sidebar_position, owner_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name, slug, description, parent_id, sidebar_position, userEmail).run()
    
    return c.json({ id: result.meta.last_row_id, message: 'Category created successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to create category' }, 500)
  }
})

// Update category
categoriesRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.note_ade_db
    const userEmail = c.get('userEmail')
    const body = await c.req.json()
    
    // Verify ownership
    const existingCat = await db.prepare('SELECT id FROM categories WHERE id = ? AND owner_email = ?').bind(id, userEmail).first()
    if (!existingCat) return c.json({ error: 'Category not found' }, 404)

    const { name, slug, description, parent_id, sidebar_position, is_collapsible, is_collapsed } = body
    
    // Check if new slug conflicts with existing categories for this user (excluding current)
    if (slug) {
      const existing = await db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ? AND owner_email = ?').bind(slug, id, userEmail).first()
      if (existing) {
        return c.json({ error: 'Category slug already exists' }, 400)
      }
    }
    
    await db.prepare(`
      UPDATE categories 
      SET name = ?, slug = ?, description = ?, parent_id = ?, sidebar_position = ?,
          is_collapsible = ?, is_collapsed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND owner_email = ?
    `).bind(name, slug, description, parent_id, sidebar_position, is_collapsible, is_collapsed, id, userEmail).run()
    
    return c.json({ message: 'Category updated successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to update category' }, 500)
  }
})

// Delete category
categoriesRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.note_ade_db
    const userEmail = c.get('userEmail')
    
    // Verify ownership
    const existingCat = await db.prepare('SELECT id FROM categories WHERE id = ? AND owner_email = ?').bind(id, userEmail).first()
    if (!existingCat) return c.json({ error: 'Category not found' }, 404)

    // Check if category has documents
    const documentsCount = await db.prepare('SELECT COUNT(*) as count FROM documents WHERE category_id = ? AND owner_email = ?').bind(id, userEmail).first()
    if (documentsCount.count > 0) {
      return c.json({ error: 'Cannot delete category with documents. Move documents first.' }, 400)
    }
    
    // Check if category has subcategories
    const subcategoriesCount = await db.prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND owner_email = ?').bind(id, userEmail).first()
    if (subcategoriesCount.count > 0) {
      return c.json({ error: 'Cannot delete category with subcategories. Delete subcategories first.' }, 400)
    }
    
    await db.prepare('DELETE FROM categories WHERE id = ? AND owner_email = ?').bind(id, userEmail).run()
    
    return c.json({ message: 'Category deleted successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to delete category' }, 500)
  }
})

// Reorder categories
categoriesRoutes.put('/:id/reorder', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.note_ade_db
    const userEmail = c.get('userEmail')
    const body = await c.req.json()
    
    const { new_position } = body
    
    const result = await db.prepare(`
      UPDATE categories 
      SET sidebar_position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND owner_email = ?
    `).bind(new_position, id, userEmail).run()
    
    if (!result.meta.changes) return c.json({ error: 'Category not found' }, 404)
    
    return c.json({ message: 'Category reordered successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to reorder category' }, 500)
  }
})

export { categoriesRoutes }
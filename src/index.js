import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { contentRoutes } from './routes/content.js'
import { adminRoutes } from './routes/admin.js'
import { categoriesRoutes } from './routes/categories.js'

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:8787'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'Note-ADE API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// API routes - both with and without /api prefix for compatibility
app.route('/api/content', contentRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/categories', categoriesRoutes)

// Direct routes for production deployment (without /api prefix)
app.route('/content', contentRoutes)
app.route('/admin', adminRoutes)
app.route('/categories', categoriesRoutes)

export default app
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

// Authentication Middleware for Multi-Tenancy
app.use('*', async (c, next) => {
  // Cloudflare Access sets this header for authenticated users
  const cfEmail = c.req.header('Cf-Access-Authenticated-User-Email');
  
  // Fallback for local development (`wrangler dev`)
  // Since we migrated old data to admin@example.com, using it as local default makes sense.
  // We can change this for testing isolated users later.
  const userEmail = cfEmail || 'admin@example.com';
  console.log(`[AUTH] Resolved User Email: ${userEmail}`);
  
  // Store in Hono context for routes to access
  c.set('userEmail', userEmail);
  
  await next();
})

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'Note-ADE API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    userEmail: c.get('userEmail')
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
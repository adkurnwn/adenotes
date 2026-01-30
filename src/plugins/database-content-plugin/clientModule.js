import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

/**
 * Client-side module for database content plugin
 * This module provides utilities for accessing database content on the client side
 */

// Global object to store database content (only in browser)
if (ExecutionEnvironment.canUseDOM) {
  window.__DATABASE_CONTENT__ = window.__DATABASE_CONTENT__ || {};
}

/**
 * Get all documents from database content
 */
export function getAllDocuments() {
  if (!ExecutionEnvironment.canUseDOM) return [];
  return window.__DATABASE_CONTENT__?.documents || [];
}

/**
 * Get document by slug
 */
export function getDocumentBySlug(slug) {
  const documents = getAllDocuments();
  return documents.find(doc => doc.slug === slug);
}

/**
 * Get sidebar structure
 */
export function getSidebarStructure() {
  if (!ExecutionEnvironment.canUseDOM) return [];
  return window.__DATABASE_CONTENT__?.sidebar || [];
}

/**
 * Get content metadata
 */
export function getContentMetadata() {
  if (!ExecutionEnvironment.canUseDOM) return {};
  return {
    loadedAt: window.__DATABASE_CONTENT__?.loadedAt,
    source: 'database',
    documentsCount: getAllDocuments().length
  };
}

/**
 * Update document in local cache (for real-time updates)
 */
export function updateDocumentCache(slug, updatedDocument) {
  if (!ExecutionEnvironment.canUseDOM) return;
  if (!window.__DATABASE_CONTENT__?.documents) return;
  
  const index = window.__DATABASE_CONTENT__.documents.findIndex(doc => doc.slug === slug);
  if (index !== -1) {
    window.__DATABASE_CONTENT__.documents[index] = updatedDocument;
    
    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('databaseContentUpdated', {
      detail: { slug, document: updatedDocument }
    }));
  }
}

/**
 * Initialize database content cache
 */
export function initializeDatabaseContent(content) {
  if (!ExecutionEnvironment.canUseDOM) return;
  
  window.__DATABASE_CONTENT__ = {
    ...content,
    initialized: true,
    initializedAt: new Date().toISOString()
  };
  
  console.log('📊 Database content initialized:', getContentMetadata());
}
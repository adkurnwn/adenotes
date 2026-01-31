import React, { useEffect, useState, useRef } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

/**
 * Component to render documents loaded from database
 * This replaces the default Docusaurus document pages
 */
export default function DatabaseDocument(props) {
  const { siteConfig } = useDocusaurusContext();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  
  // Get document data passed from plugin
  const documentData = props.documentData;
  
  useEffect(() => {
    console.log('DatabaseDocument useEffect triggered', { documentData, hasFetched: hasFetched.current });
    
    // Only run in browser environment
    if (!ExecutionEnvironment.canUseDOM) {
      setLoading(false);
      return;
    }
    
    // If we have document data from props, use it
    if (documentData && Object.keys(documentData).length > 0) {
      console.log('Using document data from props');
      setDocument(documentData);
      setLoading(false);
      return;
    }
    
    // Otherwise, try to fetch from current path (only once)
    if (!hasFetched.current) {
      console.log('Fetching document for first time');
      hasFetched.current = true;
      const currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
      fetchDocumentBySlug(currentPath);
    } else {
      console.log('Already fetched, skipping');
    }
  }, []); // Empty dependency array to run only once
  
  const fetchDocumentBySlug = async (slug) => {
    if (!ExecutionEnvironment.canUseDOM) return;
    
    console.log('fetchDocumentBySlug called with:', slug);
    
    try {
      setLoading(true);
      const response = await fetch(`/api/content/documents/${slug}`);
      
      if (!response.ok) {
        throw new Error(`Document not found: ${slug}`);
      }
      
      const data = await response.json();
      console.log('Document fetched successfully:', data.title);
      setDocument(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // SSR fallback - show basic structure
  if (!ExecutionEnvironment.canUseDOM) {
    return (
      <Layout title="Loading..." description="Loading document from database">
        <main className="container margin-vert--lg">
          <div className="text--center">
            <div className="margin-bottom--md">📄 Loading document...</div>
          </div>
        </main>
      </Layout>
    );
  }
  
  if (loading) {
    return (
      <Layout title="Loading..." description="Loading document from database">
        <main className="container margin-vert--lg">
          <div className="text--center">
            <div className="margin-bottom--md">📄 Loading document...</div>
            <div className="loading-spinner"></div>
          </div>
        </main>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout title="Document Not Found" description="Document could not be loaded">
        <main className="container margin-vert--lg">
          <div className="text--center">
            <h1>Document Not Found</h1>
            <p>Sorry, we couldn't find the document you're looking for.</p>
            <p className="text--secondary">{error}</p>
            <div className="margin-top--lg">
              <a href="/" className="button button--primary">
                Go Home
              </a>
            </div>
          </div>
        </main>
      </Layout>
    );
  }
  
  if (!document) {
    return (
      <Layout title="No Document" description="No document data available">
        <main className="container margin-vert--lg">
          <div className="text--center">
            <h1>No Document Data</h1>
            <p>No document data is available.</p>
          </div>
        </main>
      </Layout>
    );
  }
  
  // Prepare frontmatter for SEO
  const frontmatter = document.frontmatter || {};
  const title = document.title || frontmatter.title || 'Untitled';
  const description = frontmatter.description || `Documentation for ${title}`;
  
  return (
    <Layout
      title={title}
      description={description}
      keywords={frontmatter.keywords}
    >
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            {/* Document Header */}
            <header className="margin-bottom--lg">
              <h1 className="database-document__title">
                {title}
              </h1>
              {document.category_name && (
                <div className="database-document__category">
                  📁 {document.category_name}
                </div>
              )}
              {document.updated_at && (
                <div className="database-document__meta text--secondary">
                  Last updated: {new Date(document.updated_at).toLocaleDateString()}
                </div>
              )}
            </header>
            
            {/* Document Content */}
            <article className="database-document__content markdown">
              <DatabaseMarkdown content={document.content} />
            </article>
            
            {/* Edit Button (for future inline editing) */}
            <div className="database-document__actions margin-top--lg">
              <EditButton document={document} />
            </div>
            
            {/* Debug Info (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="margin-top--lg">
                <summary>Debug Information</summary>
                <pre className="language-json">
                  <code>{JSON.stringify(document, null, 2)}</code>
                </pre>
              </details>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}

/**
 * Component to render markdown content from database
 */
function DatabaseMarkdown({ content }) {
  if (!content) return <p>No content available.</p>;
  
  // For now, render as HTML (later we can add proper MDX processing)
  return (
    <div 
      className="database-markdown"
      dangerouslySetInnerHTML={{ __html: processMarkdown(content) }}
    />
  );
}

/**
 * Simple markdown processing (placeholder - will be enhanced later)
 */
function processMarkdown(content) {
  if (!content) return '';
  
  // Basic markdown processing
  return content
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><h/g, '<h')
    .replace(/h([1-6])><\/p>/g, 'h$1>');
}

/**
 * Edit button component (placeholder for future implementation)
 */
function EditButton({ document }) {
  const handleEdit = () => {
    console.log('Edit document:', document.slug);
    // TODO: Implement edit modal
  };
  
  return (
    <button 
      className="button button--secondary button--sm"
      onClick={handleEdit}
      title={`Edit ${document.title}`}
    >
      ✏️ Edit
    </button>
  );
}
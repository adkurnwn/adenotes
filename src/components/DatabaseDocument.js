import React, { useEffect, useState, useRef } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import DynamicSidebar from './DynamicSidebar';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';
import DocumentEditor from './DocumentEditor';

/**
 * Component to render documents loaded from database
 * Replaces default Docusaurus document pages
 */
export default function DatabaseDocument(props) {
  const { siteConfig } = useDocusaurusContext();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const hasFetched = useRef(false);

  const documentData = props.documentData;

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      setLoading(false);
      return;
    }

    if (documentData && Object.keys(documentData).length > 0) {
      setDocument(documentData);
      setLoading(false);
      return;
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      const currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
      fetchDocumentBySlug(currentPath);
    }
  }, []);

  const fetchDocumentBySlug = async (slug) => {
    if (!ExecutionEnvironment.canUseDOM) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/content/documents/${slug}`);
      if (!response.ok) throw new Error(`Document not found: ${slug}`);

      const data = await response.json();
      setDocument(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newContent) => {
    if (!document) return;

    try {
      console.log('Saving content for', document.id, newContent.substring(0, 50) + '...');

      const response = await fetch(`/api/admin/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...document, content: newContent })
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      setDocument({ ...document, content: newContent });
      setIsEditing(false);
      alert('Document saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving document: ' + err.message);
    }
  };

  // SSR fallback
  if (!ExecutionEnvironment.canUseDOM) {
    return <LoadingLayout />;
  }

  if (loading) return <LoadingLayout />;

  if (error) {
    return (
      <Layout title="Document Not Found">
        <main className="container margin-vert--lg">
          <div className="text--center">
            <h1>Document Not Found</h1>
            <p>{error}</p>
            <a href="/" className="button button--primary">Go Home</a>
          </div>
        </main>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout title="No Document">
        <main className="container margin-vert--lg">
          <h1>No Document Data</h1>
        </main>
      </Layout>
    );
  }

  // Edit Mode
  if (isEditing) {
    return (
      <Layout title={`Editing ${document.title}`} noFooter>
        <div className="container margin-vert--lg">
          <h1>Editing: {document.title}</h1>
          <DocumentEditor
            initialContent={document.content}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </Layout>
    );
  }

  // View Mode
  const frontmatter = document.frontmatter || {};
  const title = document.title || frontmatter.title || 'Untitled';

  return (
    <Layout title={title} description={frontmatter.description}>
      <div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - var(--ifm-navbar-height))' }}>
        {/* Sidebar Column */}
        <aside style={{
          width: isSidebarHidden ? '30px' : 'var(--doc-sidebar-width, 300px)',
          transition: 'width 200ms ease',
          flexShrink: 0,
          borderRight: '1px solid var(--ifm-toc-border-color)',
          willChange: 'width',
          display: 'block'
        }}>
          <div style={{
            position: 'sticky',
            top: 'var(--ifm-navbar-height)',
            height: 'calc(100vh - var(--ifm-navbar-height))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <DynamicSidebar
              isHidden={isSidebarHidden}
              onCollapse={() => setIsSidebarHidden(!isSidebarHidden)}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flexGrow: 1, minWidth: 0 }}>
          <div className="container padding-top--md padding-bottom--lg margin-vert--lg">
            <header className="margin-bottom--lg">
              <h1 className="database-document__title">{title}</h1>
              {document.category_name && (
                <div className="database-document__category">📁 {document.category_name}</div>
              )}
            </header>

            <article className="database-document__content markdown">
              <DatabaseMarkdown content={document.content} />
            </article>

            <div className="database-document__actions margin-top--lg">
              <button
                className="button button--secondary button--sm"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

function LoadingLayout() {
  return (
    <Layout title="Loading...">
      <main className="container margin-vert--lg">
        <div className="text--center">Loading...</div>
      </main>
    </Layout>
  );
}

function DatabaseMarkdown({ content }) {
  if (!content) return <p>No content available.</p>;

  return (
    <div className="database-markdown">
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          pre: ({ node, ...props }) => <pre className="prism-code" {...props} />,
          code: ({ node, inline, className, children, ...props }) => (
            <code className={className} {...props}>{children}</code>
          )
        }}
      />
    </div>
  );
}
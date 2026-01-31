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
import ConfirmationModal from './ConfirmationModal';

/**
 * Component to render documents loaded from database
 * Replaces default Docusaurus document pages
 */
export default function DatabaseDocument(props) {
  const { siteConfig } = useDocusaurusContext();
  const { documentData, NotFoundComponent } = props;
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      setLoading(false);
      return;
    }

    // Handle New Document Mode
    // Check path robustly (handling trailing slash)
    const normalizedPath = window.location.pathname.replace(/\/$/, '');

    if (normalizedPath === '/new') {
      const params = new URLSearchParams(window.location.search);
      setDocument({
        id: null,
        title: 'New Page',
        slug: 'new-page', // Placeholder
        content: '# New Page\n\nStart writing...',
        category_id: params.get('categoryId') || null
      });
      setIsEditing(true);
      setLoading(false);
      hasFetched.current = true; // Prevent further fetching
      return;
    }

    if (documentData && Object.keys(documentData).length > 0) {
      setDocument(documentData);
      setLoading(false);
      return;
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      const docSlug = normalizedPath.split('/').pop();
      // Ensure we don't try to fetch 'new' as a document if something clipped above
      if (docSlug && docSlug !== 'new') {
        fetchDocumentBySlug(docSlug);
      }
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

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const isNew = !document.id;

    setDocument(prev => ({
      ...prev,
      title: newTitle,
      // Only auto-update slug for new documents
      slug: isNew ? newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug
    }));
  };

  const handleSave = async (newContent) => {
    try {
      console.log('Saving content...');

      const isNew = !document.id;
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/admin/documents' : `/api/admin/documents/${document.id}`;

      // Payload uses current state (title/slug) + new content
      // Explicitly publish the document (is_draft: 0) to make it viewable via public API
      let payload = { ...document, content: newContent, is_draft: 0 };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const savedDoc = await response.json();

      if (isNew) {
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Document created successfully!',
          onConfirm: () => {
            const newPath = savedDoc.category_slug
              ? `/${savedDoc.category_slug}/${savedDoc.slug}`
              : `/${savedDoc.slug}`;
            window.location.href = newPath;
          }
        });
      } else {
        setDocument({ ...document, content: newContent });
        setIsEditing(false);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Document saved successfully!',
          onConfirm: null
        });
      }

    } catch (err) {
      console.error('Save error:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Error saving document: ' + err.message,
        onConfirm: null
      });
    }
  };

  // SSR fallback
  if (!ExecutionEnvironment.canUseDOM) {
    return <LoadingLayout />;
  }

  if (loading) return <LoadingLayout />;

  if (error) {
    if (NotFoundComponent) {
      return (
        <Layout>
          <NotFoundComponent />
        </Layout>
      );
    }

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

  // View Mode
  const frontmatter = document.frontmatter || {};
  const title = document.title || frontmatter.title || 'Untitled';

  return (
    <Layout title={title} description={frontmatter.description}>
      <div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - var(--ifm-navbar-height))' }}>
        {/* Sidebar Column */}
        {/* Sidebar Column */}
        <aside
          className="custom-sidebar-aside"
          style={{
            width: isSidebarHidden ? 'var(--doc-sidebar-hidden-width, 30px)' : 'var(--doc-sidebar-width, 300px)',
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
              {isEditing ? (
                <div className="margin-bottom--md">
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      border: '1px solid var(--ifm-color-emphasis-300)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      backgroundColor: 'var(--ifm-background-color)',
                      color: 'var(--ifm-font-color-base)'
                    }}
                    value={document.title}
                    onChange={handleTitleChange}
                    placeholder="Enter Page Title"
                  />
                  {(!document.id) && (
                    <div style={{ fontSize: '0.8em', color: 'var(--ifm-color-content-secondary)' }}>
                      Slug: {document.slug}
                    </div>
                  )}
                </div>
              ) : (
                <h1 className="database-document__title">{title}</h1>
              )}
              {document.category_name && (
                <div className="database-document__category">📁 {document.category_name}</div>
              )}
            </header>

            {isEditing ? (
              <DocumentEditor
                initialContent={document.content}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
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
              </>
            )}
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={() => {
          if (alertModal.onConfirm) alertModal.onConfirm();
          setAlertModal(prev => ({ ...prev, isOpen: false }));
        }}
        cancelText={null}
        confirmText="OK"
      />
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
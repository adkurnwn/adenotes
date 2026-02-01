import React, { useEffect, useState, useRef } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import DynamicSidebar from './DynamicSidebar';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { updateSidebarCache } from '../plugins/database-content-plugin/clientModule';
import CodeBlock from '@theme/CodeBlock';
import DocumentEditor from './DocumentEditor';
import ConfirmationModal from './ConfirmationModal';
import styles from './DatabaseDocument.module.css';
import ReactDOM from 'react-dom';

/**
 * Component to render documents loaded from database
 * Replaces default Docusaurus document pages
 */
export default function DatabaseDocument(props) {
  const { siteConfig } = useDocusaurusContext();
  const { NotFoundComponent } = props;
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    setMounted(true);

    // Hijack standard Docusaurus navbar toggle
    const handleNavbarToggle = (e) => {
      const toggle = e.target.closest('.navbar__toggle');
      if (toggle) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsMobileSidebarOpen(prev => !prev);
      }
    };

    const handleHashChange = () => {
      // Re-trigger effects on hash change
      setIsMobileSidebarOpen(false);
    };

    const options = { capture: true, passive: false };
    window.addEventListener('click', handleNavbarToggle, options);
    window.addEventListener('touchstart', handleNavbarToggle, options);
    window.addEventListener('hashchange', handleHashChange);

    setIsMobileSidebarOpen(false);
    window.document.body.classList.add('custom-db-doc-active');

    return () => {
      window.removeEventListener('click', handleNavbarToggle, options);
      window.removeEventListener('touchstart', handleNavbarToggle, options);
      window.removeEventListener('hashchange', handleHashChange);
      window.document.body.classList.remove('custom-db-doc-active');
    };
  }, []);

  // Handle SPA Routing via Hash
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      setLoading(false);
      return;
    }

    const handleRoute = () => {
      const hash = window.location.hash;
      // Split hash into path and query parts (e.g. "#/new?categoryId=2" → path="new", query="categoryId=2")
      const hashWithoutPrefix = hash.replace(/^#\/?/, '');
      const [hashPath, hashQuery] = hashWithoutPrefix.split('?');
      const normalizedPath = hashPath.replace(/\/$/, '');

      if (normalizedPath === 'new') {
        // Query params live inside the hash, not in window.location.search
        const params = new URLSearchParams(hashQuery || '');
        setDocument({
          id: null,
          title: 'New Page',
          slug: 'new-page', // Placeholder
          content: '# New Page\n\nStart writing...',
          category_id: params.get('categoryId') ? Number(params.get('categoryId')) : null
        });
        setIsEditing(true);
        setLoading(false);
        return;
      }

      if (!normalizedPath || normalizedPath === '') {
        setDocument(null);
        setLoading(false);
        return;
      }

      const docSlug = normalizedPath.split('/').pop();
      if (docSlug) {
        fetchDocumentBySlug(docSlug);
      } else {
        setLoading(false);
      }
    };

    handleRoute();

    window.addEventListener('hashchange', handleRoute);
    return () => window.removeEventListener('hashchange', handleRoute);
  }, []);

  const fetchDocumentBySlug = async (slug) => {
    if (!ExecutionEnvironment.canUseDOM) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/content/documents/${slug}`, {
        // Essential to pass Cloudflare Access authentication cookies
        credentials: 'same-origin'
      });
      
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
        body: JSON.stringify(payload),
        credentials: 'same-origin'
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
            window.location.hash = newPath;
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
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading application...</div>;
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
      <Layout title="Welcome">
        <div className={styles.container}>
          {/* Desktop Sidebar (Hidden on Mobile) */}
          <aside className={`${styles.desktopSidebar} ${isSidebarHidden ? styles.sidebarHidden : ''} custom-sidebar-aside`}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <DynamicSidebar isHidden={isSidebarHidden} onCollapse={() => setIsSidebarHidden(!isSidebarHidden)} />
            </div>
          </aside>

          {/* Mobile Sidebar Portal */}
          {mounted && ReactDOM.createPortal(
            <div className={styles.mobilePortalContainer}>
              <div
                className={`${styles.mobileBackdrop} ${isMobileSidebarOpen ? styles.mobileBackdropVisible : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <aside className={`${styles.mobileDrawer} ${isMobileSidebarOpen ? styles.mobileDrawerOpen : ''}`}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <DynamicSidebar isHidden={false} />
                </div>
              </aside>
            </div>,
            window.document.body
          )}

          <main className={styles.mainContent}>
            <div className="container padding-top--md padding-bottom--lg margin-vert--lg text--center">
              <h1>Welcome to Your Notes</h1>
              <p>Select a document from the sidebar to start reading, or create a new one.</p>
              <button className="button button--primary" onClick={() => window.location.hash = '/new'}>
                Create New Page
              </button>
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  // View Mode
  const frontmatter = document.frontmatter || {};
  const title = document.title || frontmatter.title || 'Untitled';

  return (
    <Layout title={title} description={frontmatter.description}>
      <div className={styles.container}>
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside
          className={`${styles.desktopSidebar} ${isSidebarHidden ? styles.sidebarHidden : ''} custom-sidebar-aside`}
        >
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <DynamicSidebar
              isHidden={isSidebarHidden}
              onCollapse={() => setIsSidebarHidden(!isSidebarHidden)}
            />
          </div>
        </aside>

        {/* Mobile Sidebar Portal */}
        {mounted && ReactDOM.createPortal(
          <div className={styles.mobilePortalContainer}>
            <div
              className={`${styles.mobileBackdrop} ${isMobileSidebarOpen ? styles.mobileBackdropVisible : ''}`}
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            <aside className={`${styles.mobileDrawer} ${isMobileSidebarOpen ? styles.mobileDrawerOpen : ''}`}>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <DynamicSidebar isHidden={false} />
              </div>
            </aside>
          </div>,
          window.document.body
        )}



        {/* Main Content */}
        <main className={styles.mainContent}>
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
        rehypePlugins={[rehypeRaw]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isMultiLine = String(children).includes('\n');
            if (match || isMultiLine) {
              return (
                <CodeBlock language={match ? match[1] : undefined} className={className} {...props}>
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      />
    </div>
  );
}
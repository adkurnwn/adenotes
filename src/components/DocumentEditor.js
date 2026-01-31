import React, { useState, useRef, useEffect } from 'react';
import {
    MDXEditor,
    headingsPlugin,
    quotePlugin,
    listsPlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    InsertCodeBlock
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import styles from './DocumentEditor.module.css';

import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Editor component using @mdxeditor/editor
 */
export default function DocumentEditor({ initialContent, onSave, onCancel }) {
    const [content, setContent] = useState(initialContent || '');
    const editorRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);
    // Force a unique key for MDXEditor to ensure it fully re-initializes 
    // especially when switching between New and Existing documents
    const [editorKey, setEditorKey] = useState(() => 'editor-' + Math.random().toString(36).substr(2, 9));

    // Update internal state if initialContent changes (e.g., loaded from async fetch)
    useEffect(() => {
        console.log('DocumentEditor received initialContent:', initialContent ? initialContent.substring(0, 50) + '...' : 'None');
        if (initialContent) {
            setContent(initialContent);
            // Optional: Force remount if content changes drastically, though usually not needed if controlled correctly.
            // But to be safe for this bug:
            setEditorKey('editor-' + Math.random().toString(36).substr(2, 9));
        }
    }, [initialContent]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleSave = () => {
        onSave(content);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY
        });
    };

    const insertCodeBlock = () => {
        if (editorRef.current) {
            editorRef.current.focus();
            setTimeout(() => {
                editorRef.current.insertMarkdown('```js\n\n```');
            }, 10);
        }
    };

    return (
        <div className={styles.editorWrapper}>
            <div className={styles.toolbar}>
                <button onClick={handleSave} className="button button--primary margin-right--sm">Save</button>
                <button onClick={onCancel} className="button button--secondary">Cancel</button>
            </div>
            <div className={styles.editorContainer} onContextMenu={handleContextMenu}>
                <BrowserOnly fallback={<div>Loading Editor...</div>}>
                    {() => (
                        <MDXEditor
                            ref={editorRef}
                            key={editorKey}
                            markdown={content || ''}
                            onChange={setContent}
                            plugins={[
                                headingsPlugin(),
                                listsPlugin(),
                                quotePlugin(),
                                thematicBreakPlugin(),
                                markdownShortcutPlugin(),
                                codeBlockPlugin({
                                    defaultCodeBlockLanguage: 'js',
                                    codeBlockLanguages: {
                                        js: 'JavaScript',
                                        css: 'CSS',
                                        html: 'HTML',
                                        python: 'Python',
                                        bash: 'Bash',
                                        json: 'JSON',
                                        sql: 'SQL',
                                        tsx: 'TypeScript React',
                                        jsx: 'React',
                                        ts: 'TypeScript',
                                        yaml: 'YAML',
                                        yml: 'YAML'
                                    }
                                }),
                                codeMirrorPlugin({
                                    codeBlockLanguages: {
                                        js: 'JavaScript',
                                        css: 'CSS',
                                        html: 'HTML',
                                        python: 'Python',
                                        bash: 'Bash',
                                        json: 'JSON',
                                        sql: 'SQL',
                                        tsx: 'TypeScript React',
                                        jsx: 'React',
                                        ts: 'TypeScript',
                                        yaml: 'YAML',
                                        yml: 'YAML'
                                    }
                                }),
                                toolbarPlugin({
                                    toolbarContents: () => (
                                        <>
                                            <UndoRedo />
                                            <BoldItalicUnderlineToggles />
                                            <InsertCodeBlock />
                                        </>
                                    )
                                })
                            ]}
                            contentEditableClassName="mdx-editor-content"
                        />
                    )}
                </BrowserOnly>
            </div>
            {contextMenu && (
                <ul style={{
                    position: 'fixed',
                    top: contextMenu.y,
                    left: contextMenu.x,
                    backgroundColor: 'var(--ifm-background-surface-color)',
                    border: '1px solid var(--ifm-color-emphasis-300)',
                    padding: '8px 0',
                    borderRadius: '8px',
                    listStyle: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    margin: 0,
                    minWidth: '200px'
                }}>
                    <li
                        onClick={insertCodeBlock}
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            color: 'var(--ifm-font-color-base)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-200)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <span>📝</span> Insert Code Block
                    </li>
                </ul>
            )}
        </div>
    );
}

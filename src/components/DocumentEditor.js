import React, { useState } from 'react';
import { MDXEditor, headingsPlugin, quotePlugin, listsPlugin, thematicBreakPlugin, markdownShortcutPlugin } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import styles from './DocumentEditor.module.css';

/**
 * Editor component using @mdxeditor/editor
 */
export default function DocumentEditor({ initialContent, onSave, onCancel }) {
    const [content, setContent] = useState(initialContent || '');

    // Update internal state if initialContent changes (e.g., loaded from async fetch)
    React.useEffect(() => {
        if (initialContent) {
            setContent(initialContent);
        }
    }, [initialContent]);

    const handleSave = () => {
        onSave(content);
    };

    return (
        <div className={styles.editorWrapper}>
            <div className={styles.toolbar}>
                <button onClick={handleSave} className="button button--primary margin-right--sm">Save</button>
                <button onClick={onCancel} className="button button--secondary">Cancel</button>
            </div>
            <div className={styles.editorContainer}>
                <MDXEditor
                    markdown={content}
                    onChange={setContent}
                    plugins={[
                        headingsPlugin(),
                        quotePlugin(),
                        listsPlugin(),
                        thematicBreakPlugin(),
                        markdownShortcutPlugin()
                    ]}
                    contentEditableClassName="prose max-w-none"
                />
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import { getSidebarStructure, updateSidebarCache } from '../plugins/database-content-plugin/clientModule';
import DrillDownSidebar from './DrillDownSidebar';
import ConfirmationModal from './ConfirmationModal';
import styles from './DynamicSidebar.module.css';

/**
 * Container component that fetches data and renders the DrillDownSidebar
 */
export default function DynamicSidebar({ className, isHidden, onCollapse }) {
    const [sidebarItems, setSidebarItems] = useState([]);
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        targetId: null,
        targetName: null,
        targetType: null
    });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const items = getSidebarStructure();
        if (items && items.length > 0) {
            setSidebarItems(items);
        } else {
            fetchSidebar();
        }
    }, []);

    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) setContextMenu(prev => ({ ...prev, visible: false }));
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu.visible]);

    const fetchSidebar = async () => {
        try {
            const response = await fetch('/api/content/sidebar');
            if (response.ok) {
                const data = await response.json();
                const items = data.sidebar || [];
                setSidebarItems(items);
                updateSidebarCache(items);
            }
        } catch (err) {
            console.error('Failed to fetch sidebar:', err);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();

        let targetId = null;
        let targetName = null;
        let targetType = null;

        // Robust detection using data attributes
        const targetEl = e.target.closest('[data-context-id]');

        if (targetEl) {
            targetId = targetEl.getAttribute('data-context-id');
            targetName = targetEl.getAttribute('data-context-label');
            targetType = targetEl.getAttribute('data-context-type');
        }

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetId,
            targetName,
            targetType
        });
    };

    const findCurrentCategory = (items, currentPath) => {
        const path = currentPath.replace(/^\//, '');
        for (const item of items) {
            if (item.type === 'category') {
                const hasActiveChild = item.items.some(child =>
                    child.id === path || currentPath.endsWith(child.id) || (child.href && child.href.endsWith(path))
                );
                if (hasActiveChild) return item.customProps?.categoryId;
                const childResult = findCurrentCategory(item.items, currentPath);
                if (childResult) return childResult;
            }
        }
        return null;
    };

    const handleCreatePageAction = () => {
        const currentPath = location.pathname;
        const fallbackId = findCurrentCategory(sidebarItems, currentPath);

        let categoryId = null;
        if (contextMenu.targetType === 'category') categoryId = contextMenu.targetId;
        else if (!contextMenu.targetId) categoryId = fallbackId;

        const url = `/new${categoryId ? `?categoryId=${categoryId}` : ''}`;
        window.location.href = url;
    };

    const createCategoryAPI = async (name, parent_id) => {
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parent_id })
            });
            if (response.ok) fetchSidebar();
            else {
                const err = await response.json();
                alert('Failed: ' + err.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error creating category');
        }
    };

    const handleCreateCategory = async () => {
        const isRoot = !contextMenu.targetId;

        if (contextMenu.targetType === 'doc') {
            alert('Cannot create subcategory on a document.');
            return;
        }

        const promptText = isRoot
            ? 'Enter name for new Root Category (Level 0):'
            : `Enter name for subcategory in "${contextMenu.targetName}":`;

        const name = window.prompt(promptText);
        if (!name) return;

        createCategoryAPI(name, contextMenu.targetId || null);
    };

    const handleCreateRoot = (name) => {
        createCategoryAPI(name, null);
    };

    const handleDeleteClick = () => {
        setDeleteModalOpen(true);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleConfirmDelete = async () => {
        if (!contextMenu.targetId || !contextMenu.targetType) return;
        try {
            const response = await fetch('/api/admin/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: contextMenu.targetId,
                    type: contextMenu.targetType
                })
            });
            if (response.ok) {
                setDeleteModalOpen(false);
                fetchSidebar();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting');
        }
    };

    if (!sidebarItems.length) return null;

    return (
        <div
            className={className}
            onContextMenu={handleContextMenu}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <DrillDownSidebar
                sidebarItems={sidebarItems}
                path={location.pathname}
                isHidden={isHidden}
                onCollapse={onCollapse}
                onCreateRoot={handleCreateRoot}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                title="Delete Item"
                message={`Are you sure you want to delete "${contextMenu.targetName}"? It will be moved to the Archive.`}
                confirmText="Delete"
                isDanger={true}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModalOpen(false)}
            />

            {contextMenu.visible && (
                <ul
                    className={styles.contextMenu}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <li className={styles.menuItem} onClick={handleCreatePageAction}>
                        ➕ New Page {contextMenu.targetType === 'category' ? `in ${contextMenu.targetName}` : ''}
                    </li>
                    <li className={styles.menuItem} onClick={handleCreateCategory}>
                        {contextMenu.targetType === 'category' ? '📂 New Subcategory' : '📂 New Root Category'}
                    </li>
                    {contextMenu.targetId && (
                        <>
                            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--ifm-color-emphasis-300)' }} />
                            <li className={styles.menuItem} onClick={handleDeleteClick} style={{ color: 'var(--ifm-color-danger)' }}>
                                🗑️ Delete
                            </li>
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}

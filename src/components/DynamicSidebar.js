import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import { getSidebarStructure } from '../plugins/database-content-plugin/clientModule';
import ResponsiveSidebar from './ResponsiveSidebar';
import styles from './DynamicSidebar.module.css';

/**
 * Container component that fetches data and renders the ResponsiveSidebar
 */
export default function DynamicSidebar({ className, isHidden, onCollapse }) {
    const [sidebarItems, setSidebarItems] = useState([]);
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        targetId: null,
        targetName: null
    });
    const location = useLocation();

    useEffect(() => {
        // Try to get from client module first
        const items = getSidebarStructure();

        if (items && items.length > 0) {
            setSidebarItems(items);
        } else {
            // Fallback: fetch from API
            fetchSidebar();
        }
    }, []);

    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu]);

    const fetchSidebar = async () => {
        try {
            const response = await fetch('/api/content/sidebar');
            if (response.ok) {
                const data = await response.json();
                setSidebarItems(data.sidebar || []);
            }
        } catch (err) {
            console.error('Failed to fetch sidebar:', err);
        }
    };

    const findCategoryByLabel = (items, label) => {
        for (const item of items) {
            if (item.type === 'category') {
                // Check exact match or if label is contained (handling icons etc)
                if (item.label === label || label.includes(item.label)) return item;
                const childResult = findCategoryByLabel(item.items, label);
                if (childResult) return childResult;
            }
        }
        return null;
    };

    const handleContextMenu = (e) => {
        e.preventDefault();

        let targetId = null;
        let targetName = null;

        // Try to identify clicked element
        // Look for the clicked element text
        const targetText = e.target.innerText?.trim();

        if (targetText) {
            const cat = findCategoryByLabel(sidebarItems, targetText);
            if (cat) {
                targetId = cat.customProps?.categoryId;
                targetName = cat.label;
            }
        }

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetId,
            targetName
        });
    };

    const findCurrentCategory = (items, currentPath) => {
        const path = currentPath.replace(/^\//, '');

        for (const item of items) {
            if (item.type === 'category') {
                const hasActiveChild = item.items.some(child =>
                    child.id === path ||
                    currentPath.endsWith(child.id) ||
                    (child.href && child.href.endsWith(path))
                );

                if (hasActiveChild) {
                    return item.customProps?.categoryId;
                }

                const childResult = findCurrentCategory(item.items, currentPath);
                if (childResult) return childResult;
            }
        }
        return null;
    };

    const handleCreate = () => {
        // Use ID from context menu if available, else fallback to current path detection
        const currentPath = location.pathname;
        const fallbackId = findCurrentCategory(sidebarItems, currentPath);

        const categoryId = contextMenu.targetId || fallbackId;

        const url = `/new${categoryId ? `?categoryId=${categoryId}` : ''}`;
        window.location.href = url;
    };

    if (!sidebarItems.length) return null;

    return (
        <div
            className={className}
            onContextMenu={handleContextMenu}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <ResponsiveSidebar
                sidebarItems={sidebarItems}
                path={location.pathname}
                isHidden={isHidden}
                onCollapse={onCollapse}
            />

            {contextMenu.visible && (
                <ul
                    className={styles.contextMenu}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <li className={styles.menuItem} onClick={handleCreate}>
                        ➕ New Page {contextMenu.targetName ? `on ${contextMenu.targetName}` : ''}
                    </li>
                </ul>
            )}
        </div>
    );
}

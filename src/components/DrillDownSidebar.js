import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { useThemeConfig } from '@docusaurus/theme-common';
import IconArrow from '@theme/Icon/Arrow';
import styles from './DrillDownSidebar.module.css';

export default function DrillDownSidebar({ sidebarItems, isHidden, onCollapse }) {
    const location = useLocation();
    const [viewStack, setViewStack] = useState([]);

    // Auto-navigate to current active item on load
    useEffect(() => {
        const path = location.pathname.replace(/^\//, '');
        const lineage = findLineage(sidebarItems, path);

        // If lineage found, we want the stack to start AFTER the root level
        // because the root level is always displayed.
        if (lineage && lineage.length > 1) {
            setViewStack(lineage.slice(1));
        } else {
            setViewStack([]);
        }
    }, [location.pathname, sidebarItems]);

    const isRootView = viewStack.length === 0;

    const handleNavigate = (item) => {
        if (item.type === 'category') {
            setViewStack([...viewStack, item]);
        }
    };

    const handleBack = () => {
        setViewStack(prev => prev.slice(0, -1));
    };

    // --- Renderers ---

    const renderItems = (items) => items.map((item, idx) => (
        <li key={idx} className="menu__list-item">
            {item.type === 'category' ? (
                <a
                    className="menu__link menu__link--sublist"
                    onClick={() => handleNavigate(item)}
                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                >
                    {'📂 ' + item.label}
                    {/* Standard Docusaurus arrow is usually pseudo-element, but we use explicit for drill indication */}
                    <span className="menu__link-suffix">›</span>
                </a>
            ) : (
                <Link
                    to={item.href || `/${item.id}`}
                    className={`menu__link ${location.pathname === (item.href || `/${item.id}`) ? 'menu__link--active' : ''}`}
                >
                    {'📝 ' + item.label}
                </Link>
            )}
        </li>
    ));

    // Tracks collapsed state of root items by index
    // Default to item.collapsed logic or open if active path is inside.
    const [collapsedRoots, setCollapsedRoots] = useState({});

    // Effect to auto-expand root if active item is inside it
    useEffect(() => {
        const path = location.pathname.replace(/^\//, '');
        sidebarItems.forEach((item, idx) => {
            if (item.type === 'category') {
                // Check if active path is inside this hierarchy
                const isActive = findLineage([item], path);
                if (isActive) {
                    setCollapsedRoots(prev => ({ ...prev, [idx]: false }));
                } else if (collapsedRoots[idx] === undefined) {
                    // Default to item prop or collapsed if not active
                    setCollapsedRoots(prev => ({ ...prev, [idx]: !!item.collapsed }));
                }
            }
        });
    }, [location.pathname, sidebarItems]);

    const toggleRoot = (idx) => {
        setCollapsedRoots(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    // Render the standard Sidebar Collapse button at the bottom
    const renderCollapseButton = () => {
        if (!onCollapse) return null;
        return (
            <button
                type="button"
                className="button button--secondary button--outline theme-doc-sidebar-toggle"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                onClick={onCollapse}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    border: 'none',
                    borderRadius: 0,
                    padding: '0.5rem',
                    cursor: 'pointer',
                    marginTop: 'auto'
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'rotate(180deg)', opacity: 0.6 }}>
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
            </button>
        );
    };

    const renderRootView = () => (
        <ul className="menu__list">
            {sidebarItems.map((rootItem, idx) => {
                // If state is not set yet, use item.collapsed
                const isCollapsed = collapsedRoots[idx] !== undefined ? collapsedRoots[idx] : !!rootItem.collapsed;

                return (
                    <React.Fragment key={idx}>
                        {rootItem.type === 'category' ? (
                            <li className={`menu__list-item ${isCollapsed ? 'menu__list-item--collapsed' : ''}`}>
                                <div
                                    className="menu__list-item-collapsible"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleRoot(idx);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <a
                                        className="menu__link menu__link--sublist menu__link--sublist-caret"
                                        href="#"
                                        aria-expanded={!isCollapsed}
                                    >
                                        {'📂 ' + rootItem.label}
                                    </a>
                                </div>
                                {!isCollapsed && (
                                    <ul className="menu__list">
                                        {renderItems(rootItem.items || [])}
                                    </ul>
                                )}
                            </li>
                        ) : (
                            <li className="menu__list-item" key={idx}>
                                {rootItem.type === 'doc' && (
                                    <Link
                                        to={rootItem.href || `/${rootItem.id}`}
                                        className={`menu__link ${location.pathname === (rootItem.href || `/${rootItem.id}`) ? 'menu__link--active' : ''}`}
                                    >
                                        {'📝 ' + rootItem.label}
                                    </Link>
                                )}
                            </li>
                        )}
                    </React.Fragment>
                )
            })}
        </ul>
    );

    const renderDrillView = () => {
        const activeItem = viewStack[viewStack.length - 1];
        const activeItems = activeItem.items || [];

        let parentLabel = 'Main Menu';
        if (viewStack.length > 1) {
            parentLabel = viewStack[viewStack.length - 2].label;
        } else {
            const root = sidebarItems.find(r => r.items && r.items.some(child => child === activeItem || child.id === activeItem.id));
            if (root) parentLabel = root.label;
        }

        return (
            <ul className="menu__list">
                <li className="menu__list-item">
                    {/* Back Button styled as a Menu Link for consistency */}
                    <a className="menu__link" onClick={handleBack} style={{ cursor: 'pointer' }}>
                        <span style={{ marginRight: '0.5rem' }}>←</span>
                        Back to {parentLabel}
                    </a>
                </li>

                <li className="menu__list-item">
                    {/* Header mimicking the entered category */}
                    <a className="menu__link menu__link--sublist menu__link--active" style={{ cursor: 'default', fontWeight: 'bold' }}>
                        {'📂 ' + activeItem.label}
                    </a>
                </li>

                {renderItems(activeItems)}
            </ul>
        );
    };

    // Render the thin strip when sidebar is collapsed
    const renderCollapsedSidebar = () => {
        return (
            <div
                className={styles.collapsedSidebar}
                onClick={onCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
            >
                <IconArrow className={styles.collapsedSidebarIcon} />
            </div>
        );
    };

    if (isHidden) {
        return renderCollapsedSidebar();
    }

    // Make sure we have a container that allows the bottom button to stick
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <nav className={`menu thin-scrollbar ${styles.drillDownNav}`} style={{ flex: 1, overflowY: 'auto' }}>
                {isRootView ? renderRootView() : renderDrillView()}
            </nav>
            {/* Add Collapse Button only if Root View (mimic standard sidebar) */}
            {isRootView && renderCollapseButton()}
        </div>
    );
}

// Helper: Find text lineage (breadcrumbs) or item objects
function findLineage(items, targetPath, currentStack = []) {
    for (const item of items) {
        if (item.type === 'doc') {
            const id = item.href ? item.href.replace(/^\//, '') : item.id;
            if (id === targetPath || targetPath.endsWith(id)) {
                return currentStack;
            }
        } else if (item.type === 'category') {
            const res = findLineage(item.items, targetPath, [...currentStack, item]);
            if (res) return res;
        }
    }
    return null;
}

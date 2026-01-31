import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import { getSidebarStructure } from '../plugins/database-content-plugin/clientModule';
import ResponsiveSidebar from './ResponsiveSidebar';

/**
 * Container component that fetches data and renders the ResponsiveSidebar
 */
export default function DynamicSidebar({ className, isHidden, onCollapse }) {
    const [sidebarItems, setSidebarItems] = useState([]);
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

    const handleCreate = async () => {
        const title = window.prompt('Enter page title:');
        if (!title) return;

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        try {
            const response = await fetch('/api/admin/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    slug,
                    content: `# ${title}\n\nNew content here.`
                })
            });

            if (response.ok) {
                window.location.href = `/${slug}`;
            } else {
                alert('Failed to create page');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating page');
        }
    };

    if (!sidebarItems.length) return null;

    return (
        <div className={className}>
            {!isHidden && (
                <div className="padding-horiz--md margin-vert--sm">
                    <button
                        className="button button--primary button--block button--sm"
                        onClick={handleCreate}
                    >
                        + New Page
                    </button>
                </div>
            )}
            <ResponsiveSidebar
                sidebarItems={sidebarItems}
                path={location.pathname}
                isHidden={isHidden}
                onCollapse={onCollapse}
            />
        </div>
    );
}

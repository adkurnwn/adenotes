import React, { useState, useCallback } from 'react';
import { useLocation } from '@docusaurus/router';
import DocSidebar from '@theme/DocSidebar';
import { useThemeConfig, useWindowSize } from '@docusaurus/theme-common';
import { useNavbarSecondaryMenu } from '@docusaurus/theme-common/internal';

/**
 * Wrapper component to use the native Docusaurus DocSidebar
 * with our dynamic content.
 */
export default function ResponsiveSidebar({ sidebarItems, path, isHidden, onCollapse }) {
    const location = useLocation();
    const windowSize = useWindowSize();
    const secondaryMenu = useNavbarSecondaryMenu();

    // Automatically show the secondary menu (sidebar) when on mobile
    // This allows the hamburger menu to open directly to the docs sidebar
    React.useEffect(() => {
        if (windowSize === 'mobile' && secondaryMenu?.show) {
            secondaryMenu.show();
        }
    }, [windowSize, secondaryMenu]);

    // Transform our simple sidebar items to what Docusaurus DocSidebar expects
    const transformItems = (items) => {
        return items.map(item => {
            if (item.type === 'category') {
                return {
                    type: 'category',
                    label: item.label,
                    items: transformItems(item.items),
                    collapsed: item.collapsed !== false,
                    collapsible: true,
                };
            }
            if (item.type === 'doc') {
                const href = item.href || '/' + item.id;
                return {
                    type: 'link',
                    label: item.label,
                    href: href,
                    docId: item.id,
                    target: '_self',
                    className: item.id === (path?.replace(/^\//, '') || '') ? 'menu__link--active' : ''
                };
            }
            return item;
        });
    };

    const transformedSidebar = React.useMemo(() =>
        transformItems(sidebarItems || []),
        [sidebarItems, path]);

    return (
        <DocSidebar
            key="doc-sidebar"
            sidebar={transformedSidebar}
            path={path || location.pathname}
            onCollapse={onCollapse}
            isHidden={isHidden}
        />
    );
}

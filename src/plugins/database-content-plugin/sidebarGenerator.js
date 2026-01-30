/**
 * Generate Docusaurus sidebar structure from database categories and documents
 */
function generateSidebar(sidebarData) {
  if (!sidebarData || !Array.isArray(sidebarData)) {
    console.warn('⚠️ No sidebar data provided, using empty sidebar');
    return {};
  }
  
  console.log('🔨 Generating Docusaurus sidebar from database...');
  
  // Convert API sidebar format to Docusaurus sidebar format
  const docusaurusSidebar = {
    tutorialSidebar: processSidebarItems(sidebarData)
  };
  
  console.log('✅ Generated sidebar structure:', JSON.stringify(docusaurusSidebar, null, 2));
  
  return docusaurusSidebar;
}

/**
 * Process sidebar items recursively
 */
function processSidebarItems(items) {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    if (item.type === 'category') {
      return {
        type: 'category',
        label: item.label,
        collapsible: item.collapsible !== false,
        collapsed: item.collapsed === true,
        items: processSidebarItems(item.items || [])
      };
    } else if (item.type === 'doc') {
      return {
        type: 'doc',
        id: item.id,
        label: item.label
      };
    } else {
      // Handle other item types or return as-is
      return item;
    }
  });
}

/**
 * Convert sidebar structure to simple navigation items for client-side use
 */
function simplifyForClient(sidebarData) {
  return processSidebarItems(sidebarData);
}

module.exports = {
  generateSidebar,
  simplifyForClient,
  processSidebarItems
};
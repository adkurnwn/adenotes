const { loadContent, contentDidLoad } = require('./contentLoader');
const { generateSidebar } = require('./sidebarGenerator');

/**
 * Custom Docusaurus plugin to load content from database instead of filesystem
 * This plugin fetches content from our API during build time and provides it to Docusaurus
 */
module.exports = function databaseContentPlugin(context, options) {
  return {
    name: 'database-content-plugin',
    
    async loadContent() {
      // Load content from our API during build process
      return await loadContent(options);
    },
    
    async contentLoaded({ content, actions, allContent }) {
      // Process loaded content and provide it to Docusaurus
      await contentDidLoad({ content, actions, allContent, options });
    },
    
    async allContentLoaded({ allContent, actions }) {
      // Final processing after all plugins have loaded their content
      console.log('📊 Database content plugin: All content loaded');
    },
    
    getPathsToWatch() {
      // Return empty array since we don't watch filesystem changes
      // Content changes come from database
      return [];
    },
    
    configureWebpack() {
      return {
        resolve: {
          alias: {
            '@database-content': require.resolve('./contentLoader'),
          },
        },
      };
    },
    
    getClientModules() {
      return [require.resolve('./clientModule')];
    },
  };
};
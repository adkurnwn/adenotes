// Development test script to verify API endpoints
// Run with: node test-api.js

const API_BASE = 'http://127.0.0.1:8787/api'

async function testAPI() {
  console.log('🧪 Testing Note-ADE API endpoints...\n')
  
  try {
    // Test health check
    const health = await fetch('http://127.0.0.1:8787/')
    const healthData = await health.json()
    console.log('✅ Health check:', healthData.message)
    
    // Test content endpoints
    console.log('\n📄 Testing content endpoints:')
    
    const sidebar = await fetch(`${API_BASE}/content/sidebar`)
    console.log('- Sidebar:', sidebar.status === 200 ? '✅' : '❌', sidebar.status)
    
    const manifest = await fetch(`${API_BASE}/content/manifest`)
    console.log('- Manifest:', manifest.status === 200 ? '✅' : '❌', manifest.status)
    
    const searchIndex = await fetch(`${API_BASE}/content/search-index`)
    console.log('- Search Index:', searchIndex.status === 200 ? '✅' : '❌', searchIndex.status)
    
    // Test admin endpoints
    console.log('\n⚙️ Testing admin endpoints:')
    
    const documents = await fetch(`${API_BASE}/admin/documents`)
    console.log('- Documents List:', documents.status === 200 ? '✅' : '❌', documents.status)
    
    const categories = await fetch(`${API_BASE}/categories`)
    console.log('- Categories:', categories.status === 200 ? '✅' : '❌', categories.status)
    
    // Test a specific document
    const docTest = await fetch(`${API_BASE}/content/documents/intro`)
    console.log('- Get Document (intro):', docTest.status === 200 ? '✅' : '❌', docTest.status)
    if (docTest.status === 200) {
      const docData = await docTest.json()
      console.log('  Title:', docData.title)
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
    console.log('\n💡 Make sure to run: npm run preview')
  }
}

testAPI()
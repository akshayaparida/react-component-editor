const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testAuthentication() {
  try {
    console.log('🧪 Testing Authentication Flow...\n');

    // Test 1: Login with valid credentials
    console.log('1. Testing Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('   User:', loginResponse.data.data.user.username);
      console.log('   Token received:', !!loginResponse.data.data.accessToken);
    }

    // Test 2: Get profile with token
    console.log('\n2. Testing Profile Retrieval...');
    const token = loginResponse.data.data.accessToken;
    
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (profileResponse.data.success) {
      console.log('✅ Profile retrieval successful');
      console.log('   Profile:', profileResponse.data.data.username);
      console.log('   Components count:', profileResponse.data.data._count.components);
    }

    // Test 3: Test token refresh
    console.log('\n3. Testing Token Refresh...');
    const refreshToken = loginResponse.data.data.refreshToken;
    
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    if (refreshResponse.data.success) {
      console.log('✅ Token refresh successful');
      console.log('   New token received:', !!refreshResponse.data.data.accessToken);
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthentication();

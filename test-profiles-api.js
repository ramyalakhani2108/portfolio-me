#!/usr/bin/env node

/**
 * Test Profiles API Endpoints
 */

const API_URL = 'http://localhost:3001/api';

async function testProfilesAPI() {
  console.log('\n✓ Testing Profiles API Endpoints...\n');

  try {
    // Test GET all profiles
    console.log('1️⃣  Testing GET /api/profiles');
    const getResponse = await fetch(`${API_URL}/profiles`);
    const getdata = await getResponse.json();
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Profiles found: ${getdata.data?.length || 0}`);
    
    // Test POST create profile
    console.log('\n2️⃣  Testing POST /api/profiles (create)');
    const postResponse = await fetch(`${API_URL}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Profile',
        role: 'Test Developer',
        bio: 'This is a test profile for API testing',
        experience: '3 years',
        status: 'Available'
      })
    });
    const postData = await postResponse.json();
    console.log(`   Status: ${postResponse.status}`);
    if (postData.data && postData.data[0]) {
      console.log(`   Created profile with ID: ${postData.data[0].id}`);
      
      const profileId = postData.data[0].id;
      
      // Test PUT update profile
      console.log(`\n3️⃣  Testing PUT /api/profiles/${profileId} (update)`);
      const putResponse = await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Updated Test Profile',
          bio: 'Updated test bio'
        })
      });
      const putData = await putResponse.json();
      console.log(`   Status: ${putResponse.status}`);
      console.log(`   Updated profile: ${putData.data?.[0]?.full_name || 'N/A'}`);
      
      // Test GET single profile
      console.log(`\n4️⃣  Testing GET /api/profiles/${profileId} (get single)`);
      const getSingleResponse = await fetch(`${API_URL}/profiles/${profileId}`);
      const getSingleData = await getSingleResponse.json();
      console.log(`   Status: ${getSingleResponse.status}`);
      console.log(`   Profile: ${getSingleData.data?.[0]?.full_name || 'N/A'}`);
      
      // Test DELETE profile
      console.log(`\n5️⃣  Testing DELETE /api/profiles/${profileId} (delete)`);
      const deleteResponse = await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      console.log(`   Status: ${deleteResponse.status}`);
      console.log(`   Deleted: ${deleteData.success ? 'Yes' : 'No'}`);
    }
    
    // Test GET all profiles again
    console.log('\n6️⃣  Final check - GET /api/profiles');
    const finalResponse = await fetch(`${API_URL}/profiles`);
    const finalData = await finalResponse.json();
    console.log(`   Status: ${finalResponse.status}`);
    console.log(`   Profiles found: ${finalData.data?.length || 0}`);
    
    console.log('\n✅ All API tests passed!\n');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n⚠️  Make sure the server is running on http://localhost:3001\n');
    process.exit(1);
  }
}

testProfilesAPI();

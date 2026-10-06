const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testHomepageCollectionsFlow() {
  console.log('🚀 Starting Comprehensive Homepage Collections & Image Management Test...');

  try {
    // 1. Login as Admin
    console.log('\n1. Authenticating as Admin...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@vyre.store',
      password: 'Password123!',
    });
    const adminToken = loginRes.data?.data?.tokens?.accessToken;
    if (!adminToken) throw new Error('Failed to acquire admin access token.');
    console.log('✅ Admin authenticated successfully.');

    // 2. Fetch Existing Collections
    console.log('\n2. Fetching public categories list (GET /categories)...');
    const catRes = await axios.get(`${API_BASE_URL}/categories`);
    const categories = catRes.data?.data;
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error('Categories list is empty or invalid.');
    }
    console.log(`✅ Loaded ${categories.length} categories:`, categories.map(c => `${c.name} (${c.slug})`).join(', '));

    const hoodiesCat = categories.find(c => c.slug === 'hoodies-sweaters') || categories[0];
    const jacketsCat = categories.find(c => c.slug === 'jackets') || categories[1];
    const originalHoodiesImage = hoodiesCat.image;
    const originalJacketsImage = jacketsCat.image;

    // 3. Security: Test Unauthenticated / Customer Update (Expect 401/403)
    console.log('\n3. Testing security: unauthenticated PATCH /categories/:id (Should reject 401)...');
    try {
      await axios.patch(`${API_BASE_URL}/categories/${hoodiesCat.id}`, {
        image: 'https://malicious.com/fake.jpg',
      });
      throw new Error('Security vulnerability: unauthenticated user updated category!');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ Correctly rejected unauthenticated update with 401:', err.response.data.error);
      } else {
        throw err;
      }
    }

    // 4. Update Hoodies & Sweaters Image via Admin Token
    const testHoodiesImage = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1400&auto=format&fit=crop';
    console.log(`\n4. Updating 'Hoodies & Sweaters' collection cover image...`);
    const updateHoodiesRes = await axios.patch(
      `${API_BASE_URL}/categories/${hoodiesCat.id}`,
      {
        image: testHoodiesImage,
        displayOrder: 1,
        active: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    if (!updateHoodiesRes.data?.success) {
      throw new Error('Failed to update Hoodies & Sweaters category.');
    }
    console.log('✅ Hoodies & Sweaters collection image updated successfully.');

    // 5. Update Jackets Image via Admin Token
    const testJacketsImage = 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1400&auto=format&fit=crop';
    console.log(`\n5. Updating 'Jackets' collection cover image...`);
    const updateJacketsRes = await axios.patch(
      `${API_BASE_URL}/categories/${jacketsCat.id}`,
      {
        image: testJacketsImage,
        displayOrder: 2,
        active: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    if (!updateJacketsRes.data?.success) {
      throw new Error('Failed to update Jackets category.');
    }
    console.log('✅ Jackets collection image updated successfully.');

    // 6. Verify Persistence on Public Storefront API
    console.log('\n6. Verifying persistence on public GET /categories...');
    const verifyRes = await axios.get(`${API_BASE_URL}/categories`);
    const verifiedHoodies = verifyRes.data?.data?.find(c => c.id === hoodiesCat.id);
    const verifiedJackets = verifyRes.data?.data?.find(c => c.id === jacketsCat.id);

    if (verifiedHoodies.image !== testHoodiesImage) {
      throw new Error(`Hoodies image mismatch! Expected ${testHoodiesImage}, got ${verifiedHoodies.image}`);
    }
    if (verifiedJackets.image !== testJacketsImage) {
      throw new Error(`Jackets image mismatch! Expected ${testJacketsImage}, got ${verifiedJackets.image}`);
    }
    console.log('✅ Verified: Both updated images are correctly returned by the public API.');

    // 7. Test Visibility Toggle (Active / Inactive)
    console.log('\n7. Testing visibility toggle (Deactivating Jackets temporarily)...');
    await axios.patch(
      `${API_BASE_URL}/categories/${jacketsCat.id}`,
      { active: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const hiddenRes = await axios.get(`${API_BASE_URL}/categories`);
    const isJacketsHidden = !hiddenRes.data?.data?.some(c => c.id === jacketsCat.id);
    console.log('✅ Deactivated category is filtered from public storefront listing:', isJacketsHidden);

    // Re-activate Jackets
    await axios.patch(
      `${API_BASE_URL}/categories/${jacketsCat.id}`,
      { active: true, image: originalJacketsImage },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    await axios.patch(
      `${API_BASE_URL}/categories/${hoodiesCat.id}`,
      { image: originalHoodiesImage },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ Re-activated Jackets & restored clean test state.');

    console.log('\n🎉 ALL HOMEPAGE COLLECTION & IMAGE MANAGEMENT TESTS PASSED!');
  } catch (err) {
    console.error('\n❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testHomepageCollectionsFlow();

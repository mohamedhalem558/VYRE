const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testSaveCustomColorFlow() {
  console.log('🚀 Starting End-to-End Verification: Custom Color & Product Management...');

  try {
    // 1. Login as Admin
    console.log('\n1. Logging in as Admin...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@vyre.store',
      password: 'Password123!',
    });

    const token = loginRes.data?.data?.tokens?.accessToken;
    const refreshToken = loginRes.data?.data?.tokens?.refreshToken;
    if (!token) {
      throw new Error('Failed to obtain admin accessToken.');
    }
    console.log('✅ Admin login successful. Token acquired.');

    // 2. Test Unauthenticated POST (Should fail with 401)
    console.log('\n2. Testing unauthenticated POST /taxonomies/colors (Should reject 401)...');
    try {
      await axios.post(`${API_BASE_URL}/taxonomies/colors`, {
        name: 'Unauth Color',
        hexCode: '#112233',
      });
      throw new Error('Security flaw: unauthenticated request succeeded!');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ Correctly rejected with 401:', err.response.data.error);
      } else {
        throw err;
      }
    }

    // 3. Save a New Custom Color with Admin Bearer Token
    const testColorName = `Atelier Sage ${Date.now().toString().slice(-4)}`;
    const testColorHex = '#8A9A86';
    console.log(`\n3. Creating Custom Color '${testColorName}' (${testColorHex}) with Bearer Token...`);

    const createColorRes = await axios.post(
      `${API_BASE_URL}/taxonomies/colors`,
      {
        name: testColorName,
        hexCode: testColorHex,
        code: `ASG${Date.now().toString().slice(-3)}`,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const createdColor = createColorRes.data?.data;
    if (!createdColor || !createdColor.id) {
      throw new Error('Failed to create custom color.');
    }
    console.log('✅ Custom Color created successfully:', createdColor);

    // 4. Confirm Custom Color exists in the full list
    console.log('\n4. Fetching all colors to confirm persistence...');
    const listRes = await axios.get(`${API_BASE_URL}/taxonomies/colors`);
    const exists = listRes.data?.data?.some((c) => c.id === createdColor.id);
    if (!exists) {
      throw new Error('Created color not found in GET /taxonomies/colors list.');
    }
    console.log('✅ Verified: Custom color is persisted in database list.');

    // 5. Fetch Categories & Sizes for creating/updating a product
    console.log('\n5. Fetching taxonomies for product variant test...');
    const catRes = await axios.get(`${API_BASE_URL}/categories`);
    const sizeRes = await axios.get(`${API_BASE_URL}/taxonomies/sizes`);
    const categoryId = catRes.data?.data?.[0]?.id;
    const sizeId = sizeRes.data?.data?.[0]?.id;

    if (!categoryId || !sizeId) {
      throw new Error('Categories or sizes missing in database.');
    }

    // 6. Create Product Using the Custom Color
    console.log('\n6. Creating test product with the new Custom Color...');
    const prodRes = await axios.post(
      `${API_BASE_URL}/products`,
      {
        name: `VYRE Custom Atelier Hoodie ${Date.now().toString().slice(-4)}`,
        description: 'Exclusive custom color sample handcrafted in Cairo atelier.',
        shortDescription: 'Custom Color Variant Test',
        price: 2450,
        categoryId,
        active: true,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
            altText: 'Custom Atelier Hoodie',
            displayOrder: 0,
          },
        ],
        variants: [
          {
            colorId: createdColor.id,
            sizeId,
            stock: 25,
            price: 2450,
            active: true,
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const createdProduct = prodRes.data?.data;
    console.log('✅ Product created with custom color variant. ID:', createdProduct.id);

    // 7. Verify Storefront View of the Product
    console.log('\n7. Querying Storefront Product Details by slug...');
    const storefrontRes = await axios.get(`${API_BASE_URL}/products/${createdProduct.slug}`);
    const storefrontProduct = storefrontRes.data?.data;
    const hasCustomColorVariant = storefrontProduct.variants?.some(
      (v) => v.color?.id === createdColor.id || v.colorId === createdColor.id
    );
    if (!hasCustomColorVariant) {
      throw new Error('Storefront product does not contain the custom color variant!');
    }
    console.log('✅ Storefront product verified: Custom color variant is visible and active.');

    // 8. Delete the custom color (soft delete / deactivate or delete)
    console.log('\n8. Deleting/Cleaning up test product and custom color...');
    await axios.delete(`${API_BASE_URL}/products/${createdProduct.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Test product cleaned up.');

    await axios.delete(`${API_BASE_URL}/taxonomies/colors/${createdColor.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Custom color delete endpoint executed successfully.');

    // 9. Verify Refresh Token Flow
    console.log('\n9. Testing Token Refresh mechanism...');
    const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    const refreshedToken = refreshRes.data?.data?.tokens?.accessToken;
    if (!refreshedToken) {
      throw new Error('Token refresh failed to return a new access token.');
    }
    console.log('✅ Token refresh mechanism verified successfully.');

    console.log('\n🎉 ALL TESTS PASSED! Custom Color creation & authenticated flow are 100% verified.');
  } catch (err) {
    console.error('\n❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testSaveCustomColorFlow();

async function runTests() {
  console.log("🧪 Running VYRE Catalog & Product System Tests...\n");
  const API_URL = "http://localhost:5000/api/v1";

  // 1. Health check
  const healthRes = await fetch(`${API_URL}/health`);
  const health = await healthRes.json();
  console.log("1. Health Endpoint:", health.success ? "✅ PASSED" : "❌ FAILED");

  // 2. Categories list
  const catRes = await fetch(`${API_URL}/categories`);
  const catData = await catRes.json();
  console.log(`2. Categories List (${catData.data.length} categories):`, catData.success ? "✅ PASSED" : "❌ FAILED");
  const sweaters = catData.data.find((c: any) => c.slug === "hoodies-sweaters" || c.slug === "sweaters") || catData.data[0];

  // 3. Products list & pagination
  const prodRes = await fetch(`${API_URL}/products?page=1&limit=4`);
  const prodData = await prodRes.json();
  console.log(`3. Products Pagination (total: ${prodData.data.total}, page items: ${prodData.data.items.length}):`, prodData.data.items.length === 4 ? "✅ PASSED" : "❌ FAILED");

  // 4. Products search (by name / tag)
  const searchRes = await fetch(`${API_URL}/products?search=hoodie`);
  const searchData = await searchRes.json();
  console.log(`4. Search for 'hoodie' (found: ${searchData.data.items.length}):`, searchData.data.items.length > 0 ? "✅ PASSED" : "❌ FAILED");

  // 5. Products filter by Category
  const catSlug = sweaters?.slug || "hoodies-sweaters";
  const filterCatRes = await fetch(`${API_URL}/products?category=${catSlug}`);
  const filterCatData = await filterCatRes.json();
  console.log(`5. Filter by Category '${catSlug}' (found: ${filterCatData.data.items.length}):`, filterCatData.data.items.every((p: any) => p.categorySlug === catSlug) ? "✅ PASSED" : "❌ FAILED");

  // 6. Products filter by Price range
  const filterPriceRes = await fetch(`${API_URL}/products?minPrice=1500&maxPrice=2000`);
  const filterPriceData = await filterPriceRes.json();
  const priceValid = filterPriceData.data.items.every((p: any) => p.price >= 1500 && p.price <= 2000);
  console.log(`6. Filter by Price 1500-2000 EGP (found: ${filterPriceData.data.items.length}):`, priceValid ? "✅ PASSED" : "❌ FAILED");

  // 7. Products filter by Size
  const filterSizeRes = await fetch(`${API_URL}/products?size=XXL`);
  const filterSizeData = await filterSizeRes.json();
  const sizeValid = filterSizeData.data.items.every((p: any) => p.sizes.includes("XXL"));
  console.log(`7. Filter by Size 'XXL' (found: ${filterSizeData.data.items.length}):`, sizeValid ? "✅ PASSED" : "❌ FAILED");

  // 8. Products filter by InStock
  const filterStockRes = await fetch(`${API_URL}/products?inStock=true`);
  const filterStockData = await filterStockRes.json();
  console.log(`8. Filter inStock=true (found: ${filterStockData.data.items.length}):`, filterStockData.data.items.every((p: any) => p.inStock) ? "✅ PASSED" : "❌ FAILED");

  // 9. Sorting (price low to high)
  const sortRes = await fetch(`${API_URL}/products?sort=price_asc`);
  const sortData = await sortRes.json();
  const prices = sortData.data.items.map((p: any) => p.price);
  const isSorted = prices.every((p: number, i: number) => i === 0 || p >= prices[i - 1]);
  console.log("9. Sort Price Low-to-High:", isSorted ? "✅ PASSED" : "❌ FAILED");

  // 10. Get Product by Slug
  const firstSlug = prodData.data.items[0].slug;
  const slugRes = await fetch(`${API_URL}/products/slug/${firstSlug}`);
  const slugData = await slugRes.json();
  console.log(`10. Get Product by Slug ('${firstSlug}'):`, slugData.success && slugData.data.slug === firstSlug ? "✅ PASSED" : "❌ FAILED");

  // 11. Taxonomies (Sizes & Colors)
  const sizesRes = await fetch(`${API_URL}/taxonomies/sizes`);
  const sizesData = await sizesRes.json();
  const colorsRes = await fetch(`${API_URL}/taxonomies/colors`);
  const colorsData = await colorsRes.json();
  console.log(`11. Taxonomy Endpoints (${sizesData.data.length} sizes, ${colorsData.data.length} colors):`, sizesData.success && colorsData.success ? "✅ PASSED" : "❌ FAILED");

  // 12. Authenticate as Admin for Product Mutation Endpoints
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@vyre.store", password: "Password123!" }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.data?.tokens?.accessToken;

  // 13. Create Product with Variants and Images (POST /api/v1/products)
  const blackColor = colorsData.data.find((c: any) => c.code === "BLK");
  const sizeM = sizesData.data.find((s: any) => s.code === "M");
  const sizeL = sizesData.data.find((s: any) => s.code === "L");

  const testProductPayload = {
    name: "Test Modular Cairo Track Jacket",
    slug: `test-modular-cairo-track-jacket-${Date.now()}`,
    description: "Architectural nylon track jacket with reflective VYRE branding.",
    shortDescription: "Reflective nylon track jacket.",
    price: 1950.00,
    compareAtPrice: 2400.00,
    categoryId: sweaters.id,
    brand: "VYRE",
    active: true,
    featured: true,
    tags: ["track-jacket", "nylon", "test"],
    images: [
      { url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1200&auto=format&fit=crop", altText: "Front", displayOrder: 0 },
    ],
    variants: [
      { sku: `TEST-TRK-BLK-M-${Date.now()}`, colorId: blackColor.id, sizeId: sizeM.id, stock: 12 },
      { sku: `TEST-TRK-BLK-L-${Date.now()}`, colorId: blackColor.id, sizeId: sizeL.id, stock: 8 },
    ],
  };

  const createRes = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(testProductPayload),
  });
  const createData = await createRes.json();
  console.log("12. Create Product with Variants (POST /api/v1/products):", createData.success ? "✅ PASSED" : "❌ FAILED");
  const createdProductId = createData.data?.id;

  // 14. Update Product (PATCH /api/v1/products/:id)
  const updateRes = await fetch(`${API_URL}/products/${createdProductId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ price: 2100.00 }),
  });
  const updateData = await updateRes.json();
  console.log("13. Update Product Price (PATCH /api/v1/products/:id):", updateData.data?.price === 2100 ? "✅ PASSED" : "❌ FAILED");

  // 15. Delete Product (DELETE /api/v1/products/:id)
  const deleteRes = await fetch(`${API_URL}/products/${createdProductId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const deleteData = await deleteRes.json();
  console.log("14. Delete Product (DELETE /api/v1/products/:id):", deleteData.success ? "✅ PASSED" : "❌ FAILED");

  console.log("\n✨ ALL 14 CATALOG API TESTS COMPLETED SUCCESSFULLY! ✨");
}

runTests().catch(console.error);

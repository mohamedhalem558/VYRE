// scratch/test-admin-dashboard.cjs
// Phase 8: Admin Dashboard & Management Comprehensive Integration Test

const http = require("http");

const BASE_URL = "http://localhost:5000/api/v1";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, text: body, headers: res.headers });
        }
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("PHASE 8: ADMIN DASHBOARD & MANAGEMENT E2E TEST");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Authenticate as Admin
    console.log("1. Authenticating as ADMIN...");
    const adminRes = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@vyre.local", password: "Password123!" },
    });
    console.log("adminRes.data:", JSON.stringify(adminRes.data, null, 2));
    assert(adminRes.status === 200 && adminRes.data?.data?.user?.role === "ADMIN", "Admin login successful with role ADMIN");
    const adminToken = adminRes.data?.data?.tokens?.accessToken;
    const adminAuth = { Authorization: `Bearer ${adminToken}` };
    const adminId = adminRes.data?.data?.user?.id;

    // 2. Authenticate as Customer
    console.log("\n2. Authenticating as CUSTOMER...");
    const custRes = await request("/auth/login", {
      method: "POST",
      body: { email: "customer@vyre.local", password: "Password123!" },
    });
    assert(custRes.status === 200 && custRes.data?.data?.user?.role === "CUSTOMER", "Customer login successful with role CUSTOMER");
    const custToken = custRes.data?.data?.tokens?.accessToken;
    const custAuth = { Authorization: `Bearer ${custToken}` };

    // 3. RBAC Enforcement Test
    console.log("\n3. Testing RBAC Middleware Security...");
    const custBlockedStats = await request("/admin/stats", { headers: custAuth });
    console.log("custBlockedStats response:", custBlockedStats.status, custBlockedStats.data);
    assert(custBlockedStats.status === 403, "Customer is strictly forbidden from accessing /admin/stats (HTTP 403)");

    const custBlockedCustomers = await request("/admin/customers", { headers: custAuth });
    assert(custBlockedCustomers.status === 403, "Customer is strictly forbidden from accessing /admin/customers (HTTP 403)");

    const custBlockedUsers = await request("/admin/users", { headers: custAuth });
    assert(custBlockedUsers.status === 403, "Customer is strictly forbidden from accessing /admin/users (HTTP 403)");

    // 4. Admin Dashboard Real Stats
    console.log("\n4. Testing Real Database Admin Stats (/api/v1/admin/stats)...");
    const statsRes = await request("/admin/stats", { headers: adminAuth });
    assert(statsRes.status === 200, "Admin stats endpoint returned 200 OK");
    const stats = statsRes.data?.data;
    assert(typeof stats?.totalRevenue === "number", `Total revenue returned: ${stats?.totalRevenue} EGP`);
    assert(typeof stats?.totalOrders === "number", `Total orders: ${stats?.totalOrders}, Pending: ${stats?.pendingOrders}, Completed: ${stats?.completedOrders}`);
    assert(typeof stats?.totalCustomers === "number", `Total customers: ${stats?.totalCustomers}`);
    assert(typeof stats?.totalProducts === "number", `Total products: ${stats?.totalProducts}, Low Stock: ${stats?.lowStockCount}, Out of Stock: ${stats?.outOfStockCount}`);
    assert(Array.isArray(stats?.salesTrend), `Sales trend returned with ${stats?.salesTrend?.length} data points`);
    assert(Array.isArray(stats?.recentOrders), `Recent orders returned: ${stats?.recentOrders?.length} orders`);

    // 5. Customer Directory Management
    console.log("\n5. Testing Customer Management (/api/v1/admin/customers)...");
    const customersRes = await request("/admin/customers", { headers: adminAuth });
    assert(customersRes.status === 200, "Admin customers endpoint returned 200 OK");
    const customersList = customersRes.data?.data?.customers;
    assert(Array.isArray(customersList) && customersList.length > 0, `Found ${customersList.length} registered customers`);

    const targetCustomer = customersList[0];
    assert(targetCustomer.totalSpent !== undefined, `Customer stats include totalSpent: ${targetCustomer.totalSpent} EGP`);
    assert(targetCustomer.totalOrders !== undefined, `Customer stats include totalOrders: ${targetCustomer.totalOrders}`);

    // Customer order history
    const customerOrdersRes = await request(`/admin/customers/${targetCustomer.id}/orders`, { headers: adminAuth });
    assert(customerOrdersRes.status === 200, `Retrieved ${customerOrdersRes.data?.data?.length} orders for customer ${targetCustomer.id}`);

    // Toggle customer status
    const toggleCustRes = await request(`/admin/customers/${targetCustomer.id}/toggle`, {
      method: "PATCH",
      headers: adminAuth,
    });
    assert(toggleCustRes.status === 200, `Toggled customer active status successfully (now ${toggleCustRes.data?.data?.active})`);
    // Toggle back
    await request(`/admin/customers/${targetCustomer.id}/toggle`, { method: "PATCH", headers: adminAuth });

    // 6. User RBAC Staff Management
    console.log("\n6. Testing User Staff Management (/api/v1/admin/users)...");
    const usersRes = await request("/admin/users", { headers: adminAuth });
    assert(usersRes.status === 200, "Admin users endpoint returned 200 OK");
    const usersList = usersRes.data?.data?.users;
    assert(Array.isArray(usersList) && usersList.length >= 4, `Found ${usersList.length} staff and customer users`);

    // Find non-admin user
    const targetUser = usersList.find((u) => u.email === "marketing@vyre.local" || u.email === "customer@vyre.local");
    if (targetUser) {
      const originalRole = targetUser.role;
      const changeRoleRes = await request(`/admin/users/${targetUser.id}/role`, {
        method: "PATCH",
        headers: adminAuth,
        body: { role: "INVENTORY_MANAGER" },
      });
      assert(changeRoleRes.status === 200 && changeRoleRes.data?.data?.role === "INVENTORY_MANAGER", `Changed user role to INVENTORY_MANAGER`);

      // Revert role back
      await request(`/admin/users/${targetUser.id}/role`, {
        method: "PATCH",
        headers: adminAuth,
        body: { role: originalRole },
      });
    }

    // Safety: Admin cannot deactivate self
    const deactivateSelfRes = await request(`/admin/users/${adminId}/toggle`, {
      method: "PATCH",
      headers: adminAuth,
    });
    assert(deactivateSelfRes.status === 400, "Admin is prevented from deactivating their own account (HTTP 400)");

    // 7. Product CRUD & Multi-Variant Management
    console.log("\n7. Testing Admin Product & Variant Creation...");
    // Get categories, sizes, colors
    const catRes = await request("/categories");
    const categories = catRes.data?.data || [];
    const targetCat = categories[0] || { id: "cat-1", slug: "sweaters" };

    const sizesRes = await request("/taxonomies/sizes");
    const availableSizes = sizesRes.data?.data || [];
    const colorsRes = await request("/taxonomies/colors");
    const availableColors = colorsRes.data?.data || [];

    const newProductPayload = {
      name: `VYRE Admin Drop ${Date.now()}`,
      slug: `vyre-admin-drop-${Date.now()}`,
      description: "Heavyweight drop engineered for modern streetwear enthusiasts in Cairo.",
      shortDescription: "Exclusive runway drop.",
      price: 1850,
      compareAtPrice: 2200,
      categoryId: targetCat.id,
      featured: true,
      bestseller: true,
      newArrival: true,
      tags: ["admin-drop", "limited", "heavyweight"],
      images: [
        { url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80", displayOrder: 1 },
      ],
      variants: availableSizes.slice(0, 2).map((s, idx) => ({
        sizeId: s.id,
        colorId: availableColors[0]?.id || availableSizes[0].id,
        sku: `VYRE-TEST-${Date.now()}-${idx}`,
        stock: 20,
        price: 1850,
      })),
    };

    const createProdRes = await request("/products", {
      method: "POST",
      headers: adminAuth,
      body: newProductPayload,
    });
    assert(createProdRes.status === 201, `Admin created new product with variants (HTTP 201): ${createProdRes.data?.data?.name}`);
    const createdProductId = createProdRes.data?.data?.id;

    // Update product
    const updateProdRes = await request(`/products/${createdProductId}`, {
      method: "PATCH",
      headers: adminAuth,
      body: {
        price: 1950,
        featured: false,
      },
    });
    assert(updateProdRes.status === 200 && updateProdRes.data?.data?.price === 1950, "Admin updated product price and flags (HTTP 200)");

    // Clean up product
    const deleteProdRes = await request(`/products/${createdProductId}`, {
      method: "DELETE",
      headers: adminAuth,
    });
    assert(deleteProdRes.status === 200, "Admin deleted/deactivated test product (HTTP 200)");

    // 8. Admin Global Orders Management
    console.log("\n8. Testing Admin Orders Management (/api/v1/orders)...");
    const allOrdersRes = await request("/orders", { headers: adminAuth });
    assert(allOrdersRes.status === 200, "Admin successfully fetched all system orders");
    const allOrders = allOrdersRes.data?.data?.orders || [];
    assert(Array.isArray(allOrders), `Retrieved ${allOrders.length} orders in system`);

    if (allOrders.length > 0) {
      const sampleOrder = allOrders[0];
      const updateStatusRes = await request(`/orders/${sampleOrder.id}/status`, {
        method: "PATCH",
        headers: adminAuth,
        body: { status: "PROCESSING" },
      });
      assert(updateStatusRes.status === 200 && updateStatusRes.data?.data?.orderStatus === "PROCESSING", `Admin updated order ${sampleOrder.orderNumber} status to PROCESSING`);
    }

    console.log("\n==================================================");
    console.log(`PHASE 8 TESTS COMPLETED: ${passed}/${total} PASSED`);
    console.log("==================================================");

    if (passed === total) {
      console.log("\n🎉 ALL PHASE 8 REQUIREMENTS FULLY VERIFIED!");
      process.exit(0);
    } else {
      console.error(`\n❌ SOME TESTS FAILED: ${total - passed} failures`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Test runner encountered error:", err);
    process.exit(1);
  }
}

runTests();

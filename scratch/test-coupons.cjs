// scratch/test-coupons.cjs
// Phase 9: Coupons & Promotions Comprehensive Integration Test

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
  console.log("PHASE 9: COUPONS & PROMOTIONS E2E TEST");
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
    assert(adminRes.status === 200, "Admin login successful");
    const adminToken = adminRes.data?.data?.tokens?.accessToken;
    const adminAuth = { Authorization: `Bearer ${adminToken}` };

    // 2. Authenticate as Customer
    console.log("\n2. Authenticating as CUSTOMER...");
    const custEmail = `coupon_test_${Date.now()}@vyre.local`;
    const custReg = await request("/auth/register", {
      method: "POST",
      body: {
        email: custEmail,
        password: "Password123!",
        firstName: "Tamer",
        lastName: "Ashour",
        phoneNumber: "+201099887766",
      },
    });
    assert(custReg.status === 201, "Registered customer account");
    const custToken = custReg.data?.data?.tokens?.accessToken;
    const custAuth = { Authorization: `Bearer ${custToken}` };

    // 3. RBAC Enforcement Test
    console.log("\n3. Testing RBAC Security for Coupon Management...");
    const custCreateBlocked = await request("/coupons", {
      method: "POST",
      headers: custAuth,
      body: { code: "HACK50", value: 50 },
    });
    assert(custCreateBlocked.status === 403, "Customer cannot create coupons (HTTP 403)");

    const custGetBlocked = await request("/coupons", { headers: custAuth });
    assert(custGetBlocked.status === 403, "Customer cannot list internal coupons (HTTP 403)");

    // 4. Admin Creates Coupons
    console.log("\n4. Admin Creating Real Coupons...");
    const testCodePerc = `VYRE20_${Date.now().toString().slice(-4)}`;
    const createPercRes = await request("/coupons", {
      method: "POST",
      headers: adminAuth,
      body: {
        code: testCodePerc,
        description: "20% off for VIP drops with 500 EGP min spend and 600 EGP max cap",
        type: "PERCENTAGE",
        value: 20,
        minimumOrderAmount: 500,
        maximumDiscount: 600,
        usageLimit: 50,
      },
    });
    assert(createPercRes.status === 201, `Created percentage coupon ${testCodePerc} (HTTP 201)`);
    const percCoupon = createPercRes.data?.data;

    const testCodeFixed = `FLAT150_${Date.now().toString().slice(-4)}`;
    const createFixedRes = await request("/coupons", {
      method: "POST",
      headers: adminAuth,
      body: {
        code: testCodeFixed,
        description: "150 EGP flat discount for orders over 1000 EGP",
        type: "FIXED_AMOUNT",
        value: 150,
        minimumOrderAmount: 1000,
      },
    });
    assert(createFixedRes.status === 201, `Created fixed amount coupon ${testCodeFixed} (HTTP 201)`);
    const fixedCoupon = createFixedRes.data?.data;

    // 5. Admin Lists and Updates Coupons
    console.log("\n5. Admin Listing & Updating Coupons...");
    const listRes = await request("/coupons", { headers: adminAuth });
    assert(listRes.status === 200, "Coupons list returned HTTP 200");
    const couponsList = listRes.data?.data?.coupons || [];
    assert(couponsList.some((c) => c.code === testCodePerc), `Found ${testCodePerc} in coupon listing`);

    const updateRes = await request(`/coupons/${percCoupon.id}`, {
      method: "PATCH",
      headers: adminAuth,
      body: { description: "Updated VIP description" },
    });
    assert(updateRes.status === 200 && updateRes.data?.data?.description === "Updated VIP description", "Admin updated coupon description");

    // 6. Public / Authoritative Coupon Validation
    console.log("\n6. Testing Authoritative Backend Validation (/coupons/validate)...");

    // Invalid code
    const invalidVal = await request("/coupons/validate", {
      method: "POST",
      body: { code: "NONEXISTENT", subtotal: 1000 },
    });
    assert(invalidVal.status === 200 && invalidVal.data?.data?.valid === false, "Invalid code returns valid=false");

    // Below minimum order amount
    const belowMinVal = await request("/coupons/validate", {
      method: "POST",
      body: { code: testCodePerc, subtotal: 300 }, // min is 500
    });
    assert(belowMinVal.data?.data?.valid === false, "Order subtotal below minimum returns valid=false");

    // Valid Percentage discount calculation
    const validPercVal = await request("/coupons/validate", {
      method: "POST",
      body: { code: testCodePerc, subtotal: 1000 },
    });
    assert(validPercVal.data?.data?.valid === true, "Valid coupon validation returns valid=true");
    assert(validPercVal.data?.data?.discountAmount === 200, `Calculated 20% discount correctly: 200 EGP (got ${validPercVal.data?.data?.discountAmount})`);
    assert(validPercVal.data?.data?.finalSubtotal === 800, `Calculated final subtotal correctly: 800 EGP (got ${validPercVal.data?.data?.finalSubtotal})`);

    // Max Discount Cap validation
    const cappedPercVal = await request("/coupons/validate", {
      method: "POST",
      body: { code: testCodePerc, subtotal: 5000 }, // 20% of 5000 = 1000, but cap is 600
    });
    assert(cappedPercVal.data?.data?.discountAmount === 600, `Discount correctly capped at maximumDiscount: 600 EGP (got ${cappedPercVal.data?.data?.discountAmount})`);

    // Fixed amount discount calculation
    const validFixedVal = await request("/coupons/validate", {
      method: "POST",
      body: { code: testCodeFixed, subtotal: 1200 },
    });
    assert(validFixedVal.data?.data?.valid === true, "Fixed coupon returns valid=true");
    assert(validFixedVal.data?.data?.discountAmount === 150, `Fixed discount correctly calculated: 150 EGP (got ${validFixedVal.data?.data?.discountAmount})`);
    assert(validFixedVal.data?.data?.finalSubtotal === 1050, `Final subtotal correctly calculated: 1050 EGP (got ${validFixedVal.data?.data?.finalSubtotal})`);

    // 7. Complete Checkout Flow with Coupon Application
    console.log("\n7. Testing End-to-End Checkout with Coupon & Database Usage Tracking...");
    // Find a product with active variant
    const prodRes = await request("/products?limit=1");
    const product = prodRes.data?.data?.items?.[0];
    const variant = product?.variants?.[0];
    assert(product && variant, `Found purchasable product '${product?.name}'`);

    // Add 2 items to customer cart
    const addCartRes = await request("/cart/items", {
      method: "POST",
      headers: custAuth,
      body: {
        productId: product.id,
        variantId: variant.id,
        sizeId: variant.sizeId,
        colorId: variant.colorId,
        quantity: 2,
      },
    });
    assert(addCartRes.status === 201, "Added product items to customer cart");

    // Place order applying testCodePerc
    const orderRes = await request("/orders", {
      method: "POST",
      headers: custAuth,
      body: {
        customerName: "Tamer Ashour",
        customerEmail: custEmail,
        customerPhone: "+201099887766",
        shippingAddress: {
          fullName: "Tamer Ashour",
          phoneNumber: "+201099887766",
          streetAddress: "90 North Road, New Cairo",
          city: "New Cairo",
          governorate: "Cairo",
        },
        paymentMethod: "CASH_ON_DELIVERY",
        couponCode: testCodePerc,
      },
    });
    assert(orderRes.status === 201, `Order placed successfully with promo code ${testCodePerc} (HTTP 201)`);
    const createdOrder = orderRes.data?.data;
    assert(createdOrder.discount > 0, `Order record reflects backend discount: ${createdOrder.discount} EGP`);

    // Verify coupon usedCount incremented in database
    const refreshedCouponRes = await request(`/coupons/${percCoupon.id}`, { headers: adminAuth });
    assert(refreshedCouponRes.data?.data?.usedCount === 1, `Coupon usedCount incremented in database to 1`);

    // 8. Delete Coupon Clean up
    console.log("\n8. Admin Deleting Test Coupons...");
    const delPercRes = await request(`/coupons/${percCoupon.id}`, {
      method: "DELETE",
      headers: adminAuth,
    });
    assert(delPercRes.status === 200, "Admin deleted percentage coupon (HTTP 200)");

    const delFixedRes = await request(`/coupons/${fixedCoupon.id}`, {
      method: "DELETE",
      headers: adminAuth,
    });
    assert(delFixedRes.status === 200, "Admin deleted fixed coupon (HTTP 200)");

    console.log("\n==================================================");
    console.log(`PHASE 9 TESTS COMPLETED: ${passed}/${total} PASSED`);
    console.log("==================================================");

    if (passed === total) {
      console.log("\n🎉 ALL PHASE 9 REQUIREMENTS FULLY VERIFIED!");
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

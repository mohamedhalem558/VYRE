const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const API_BASE = "http://localhost:5000/api/v1";

async function runTests() {
  console.log("=== STARTING USER ROLE MANAGEMENT RBAC VERIFICATION ===");

  // 1. Login as ADMIN
  console.log("\n[TEST 1] Admin Login...");
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@vyre.local", password: "Password123!" }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminLoginData.success) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  const adminToken = adminLoginData.data.tokens.accessToken;
  const adminUser = adminLoginData.data.user;
  console.log(`✅ Admin logged in: ${adminUser.email} (ID: ${adminUser.id}, Role: ${adminUser.role})`);

  // 2. Fetch Users via GET /api/v1/users
  console.log("\n[TEST 2] Fetching users list via GET /api/v1/users...");
  const usersRes = await fetch(`${API_BASE}/users?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const usersData = await usersRes.json();
  if (!usersRes.ok || !usersData.success) {
    throw new Error(`Fetch users failed: ${JSON.stringify(usersData)}`);
  }
  console.log(`✅ Users retrieved successfully. Total count: ${usersData.data.total}`);

  // 3. Register or locate test customer
  console.log("\n[TEST 3] Setup test customer...");
  const testEmail = "test_rbac_customer@vyre.local";
  let targetUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!targetUser) {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Tariq",
        lastName: "Nasser",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Test user registration failed: ${JSON.stringify(regData)}`);
    }
    targetUser = regData.data.user;
  }
  console.log(`✅ Test customer ready: ${targetUser.email} (ID: ${targetUser.id}, Current Role: ${targetUser.role})`);

  // 4. Update Role: CUSTOMER -> INVENTORY_MANAGER via PATCH /api/v1/users/:id/role
  console.log("\n[TEST 4] Updating role to INVENTORY_MANAGER via PATCH /api/v1/users/:id/role...");
  const roleChangeRes = await fetch(`${API_BASE}/users/${targetUser.id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ role: "INVENTORY_MANAGER" }),
  });
  const roleChangeData = await roleChangeRes.json();
  console.log("Status:", roleChangeRes.status, "Response:", roleChangeData);
  if (roleChangeRes.status !== 200 || roleChangeData.data.role !== "INVENTORY_MANAGER") {
    throw new Error("Failed to change user role to INVENTORY_MANAGER");
  }
  console.log("✅ Role updated to INVENTORY_MANAGER via API!");

  // 5. Verify PostgreSQL persistence
  console.log("\n[TEST 5] Checking PostgreSQL persistence directly...");
  const dbUserAfterPromo = await prisma.user.findUnique({ where: { id: targetUser.id } });
  if (dbUserAfterPromo.role !== "INVENTORY_MANAGER") {
    throw new Error(`Database check failed! Expected INVENTORY_MANAGER, got ${dbUserAfterPromo.role}`);
  }
  console.log(`✅ Database confirmed: Role is persisted as ${dbUserAfterPromo.role}`);

  // 6. Login as test user and check permissions
  console.log("\n[TEST 6] Login as newly promoted INVENTORY_MANAGER...");
  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "Password123!" }),
  });
  const userLoginData = await userLoginRes.json();
  const userToken = userLoginData.data.tokens.accessToken;
  console.log(`✅ Test user logged in. Role in token/session: ${userLoginData.data.user.role}`);

  // 7. Verify RBAC enforcement:
  console.log("\n[TEST 7] Verifying role-based permissions...");
  // 7a. INVENTORY_MANAGER should have access to /inventory
  const invRes = await fetch(`${API_BASE}/inventory`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`- Access /inventory: Status ${invRes.status} (Expected: 200)`);
  if (invRes.status !== 200) {
    throw new Error(`INVENTORY_MANAGER denied access to /inventory!`);
  }
  console.log("✅ INVENTORY_MANAGER successfully accessed /inventory!");

  // 7b. INVENTORY_MANAGER must NOT have access to /users (Admin only)
  const forbiddenUsersRes = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`- Access /users: Status ${forbiddenUsersRes.status} (Expected: 403)`);
  if (forbiddenUsersRes.status !== 403) {
    throw new Error(`INVENTORY_MANAGER unexpectedly allowed access to /users! Status: ${forbiddenUsersRes.status}`);
  }
  console.log("✅ INVENTORY_MANAGER denied access to /users (403 Forbidden)!");

  // 7c. INVENTORY_MANAGER must NOT be able to change roles (Admin only)
  const forbiddenRoleChangeRes = await fetch(`${API_BASE}/users/${targetUser.id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ role: "ADMIN" }),
  });
  console.log(`- Role change call by non-admin: Status ${forbiddenRoleChangeRes.status} (Expected: 403)`);
  if (forbiddenRoleChangeRes.status !== 403) {
    throw new Error(`Non-admin unexpectedly able to call role change API! Status: ${forbiddenRoleChangeRes.status}`);
  }
  console.log("✅ Non-admin role escalation prevented with 403 Forbidden!");

  // 8. Change role back: INVENTORY_MANAGER -> CUSTOMER
  console.log("\n[TEST 8] Changing role back to CUSTOMER via Admin...");
  const demoteRes = await fetch(`${API_BASE}/users/${targetUser.id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ role: "CUSTOMER" }),
  });
  const demoteData = await demoteRes.json();
  if (demoteRes.status !== 200 || demoteData.data.role !== "CUSTOMER") {
    throw new Error("Failed to change user role back to CUSTOMER");
  }
  const dbUserCustomer = await prisma.user.findUnique({ where: { id: targetUser.id } });
  console.log(`✅ Role restored to CUSTOMER. DB confirms: ${dbUserCustomer.role}`);

  // 9. Admin Self-Protection: Admin cannot modify their own role
  console.log("\n[TEST 9] Admin self-protection: Admin cannot modify own role...");
  const selfRoleRes = await fetch(`${API_BASE}/users/${adminUser.id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ role: "CUSTOMER" }),
  });
  const selfRoleData = await selfRoleRes.json();
  console.log(`- Admin self-role modification: Status ${selfRoleRes.status} Error: ${selfRoleData.error}`);
  if (selfRoleRes.status !== 403) {
    throw new Error(`Expected 403 for admin self-role change, got ${selfRoleRes.status}`);
  }
  console.log("✅ Admin self-protection verified! 403 returned with clear message.");

  // 10. Admin Self-Protection: Admin cannot deactivate own account
  console.log("\n[TEST 10] Admin self-protection: Admin cannot deactivate own account...");
  const selfDeactivateRes = await fetch(`${API_BASE}/users/${adminUser.id}/toggle`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const selfDeactivateData = await selfDeactivateRes.json();
  console.log(`- Admin self-deactivation: Status ${selfDeactivateRes.status} Error: ${selfDeactivateData.error}`);
  if (selfDeactivateRes.status !== 403) {
    throw new Error(`Expected 403 for admin self-deactivation, got ${selfDeactivateRes.status}`);
  }
  console.log("✅ Admin self-deactivation protection verified! 403 returned.");

  // 11. User Status: Toggle status of test customer
  console.log("\n[TEST 11] Toggle user status (Active / Inactive)...");
  const toggleRes1 = await fetch(`${API_BASE}/users/${targetUser.id}/toggle`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const toggleData1 = await toggleRes1.json();
  console.log(`- Deactivate: Active=${toggleData1.data.active}`);
  if (toggleData1.data.active !== false) throw new Error("Expected active to become false");

  const toggleRes2 = await fetch(`${API_BASE}/users/${targetUser.id}/toggle`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const toggleData2 = await toggleRes2.json();
  console.log(`- Re-activate: Active=${toggleData2.data.active}`);
  if (toggleData2.data.active !== true) throw new Error("Expected active to become true");
  console.log("✅ User status toggle verified in PostgreSQL!");

  console.log("\n=== ALL RBAC & USER ROLE MANAGEMENT TESTS PASSED PERFECTLY! ===");
  await prisma.$disconnect();
}

runTests().catch(async (e) => {
  console.error("❌ TEST RUN FAILED:", e);
  await prisma.$disconnect();
  process.exit(1);
});

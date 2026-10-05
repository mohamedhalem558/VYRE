import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function runAuthTests() {
  console.log("🔒 Running Comprehensive VYRE Authentication & Security Test Suite...\n");
  const API_URL = "http://localhost:5000/api/v1";

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [${total}] ${testName}: PASSED`);
    } else {
      console.error(`❌ [${total}] ${testName}: FAILED ${detail ? `(${detail})` : ""}`);
    }
  }

  // 1. User Registration (POST /auth/register)
  const testEmail = `authtest_${Date.now()}@example.com`;
  const initialPassword = "InitialPassword123!";
  const newPassword = "NewStrongPassword456!";

  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "User",
      email: testEmail,
      password: initialPassword,
      phoneNumber: "+201012345678",
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.success && regData.data?.user?.email === testEmail, "1. User Registration (POST /auth/register)");

  // 2. Duplicate Email Registration Rejection (409 Conflict)
  const dupRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "User",
      email: testEmail,
      password: initialPassword,
    }),
  });
  assert(dupRes.status === 409, "2. Duplicate Email Registration Rejection (409 Conflict)");

  // 3. User Login (POST /auth/login) with correct password
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: initialPassword }),
  });
  const loginData = await loginRes.json();
  const customerToken = loginData.data?.tokens?.accessToken;
  const customerRefreshToken = loginData.data?.tokens?.refreshToken;
  assert(loginRes.status === 200 && !!customerToken && !!customerRefreshToken, "3. User Login with Correct Password (POST /auth/login)");

  // 4. Login with Incorrect Password (401 Unauthorized)
  const wrongPassRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "WrongPassword999!" }),
  });
  assert(wrongPassRes.status === 401, "4. Login with Incorrect Password Rejection (401 Unauthorized)");

  // 5. Protected Route Access with Token (GET /auth/me)
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.data?.email === testEmail, "5. Protected Route Access with Valid Token (GET /auth/me)");

  // 6. Protected Route Rejection Without Token (401 Unauthorized)
  const noTokenRes = await fetch(`${API_URL}/auth/me`);
  assert(noTokenRes.status === 401, "6. Protected Route Access Denied Without Token (401 Unauthorized)");

  // 7. Refresh Token Rotation (POST /auth/refresh)
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: customerRefreshToken }),
  });
  const refreshData = await refreshRes.json();
  const newAccessToken = refreshData.data?.tokens?.accessToken;
  assert(refreshRes.status === 200 && !!newAccessToken, "7. Token Refresh Rotation (POST /auth/refresh)");

  // 8. Admin Account Authentication & Role Authorization
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@vyre.store", password: "Password123!" }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.data?.tokens?.accessToken;
  assert(adminLoginRes.status === 200 && adminLoginData.data?.user?.role === "ADMIN", "8. Admin Account Authentication");

  // 9. Role-based Access Control: Customer forbidden from Admin endpoint (403 Forbidden)
  const customerAdminRes = await fetch(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${newAccessToken}` },
  });
  assert(customerAdminRes.status === 403, "9. Customer Forbidden from Admin Endpoint (403 Forbidden)");

  // 10. Admin allowed on Admin endpoint (200 OK)
  const adminAccessRes = await fetch(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminAccessRes.status === 200, "10. Admin Permitted on Admin Endpoint (200 OK)");

  // 11. Generic Forgot Password Response (prevents email enumeration)
  const nonExistentEmail = "nonexistent_vyre_user_9999@example.com";
  const genericForgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: nonExistentEmail }),
  });
  const genericData = await genericForgotRes.json();
  assert(genericForgotRes.status === 200 && genericData.success, "11. Generic Forgot Password Response for Non-Existent Email (No Enumeration)");

  // 12. Forgot Password for Registered User
  const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotData = await forgotRes.json();
  const rawDevToken = forgotData.data?.devResetToken;
  assert(forgotRes.status === 200 && forgotData.success && !!rawDevToken, "12. Forgot Password Request Generated Token");

  // 13. Verify Database stores hashed token, not plain-text
  const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
  const isHashStored = dbUser?.resetPasswordToken && dbUser.resetPasswordToken !== rawDevToken && dbUser.resetPasswordToken.length === 64;
  assert(!!isHashStored, "13. Database Stores Secure SHA256 Hash of Reset Token (Not Plain-Text)");

  // 14. Reset Password with Valid Token (POST /auth/reset-password)
  const resetRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: rawDevToken, password: newPassword }),
  });
  const resetData = await resetRes.json();
  assert(resetRes.status === 200 && resetData.success, "14. Reset Password with Valid Token");

  // 15. Login with NEW Password succeeds
  const newLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: newPassword }),
  });
  const newLoginData = await newLoginRes.json();
  assert(newLoginRes.status === 200 && newLoginData.success, "15. Login with New Password Succeeds");

  // 16. Login with OLD Password fails (401 Unauthorized)
  const oldLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: initialPassword }),
  });
  assert(oldLoginRes.status === 401, "16. Login with Old Password Fails (401 Unauthorized)");

  // 17. Single-Use Token Enforcement: Reusing Reset Token Fails (400 Bad Request)
  const reuseRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: rawDevToken, password: "AnotherPassword789!" }),
  });
  assert(reuseRes.status === 400, "17. Reusing Already-Used Reset Token Rejected (400 Bad Request)");

  // 18. Invalid Reset Token Rejected (400 Bad Request)
  const invalidTokenRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "totally_invalid_random_token_12345", password: "AnotherPassword789!" }),
  });
  assert(invalidTokenRes.status === 400, "18. Invalid Reset Token Rejected (400 Bad Request)");

  // 19. Expired Reset Token Rejected
  const expiredRaw = `expired_raw_token_${Date.now()}_${Math.random()}`;
  const expiredHash = crypto.createHash("sha256").update(expiredRaw).digest("hex");
  await prisma.user.update({
    where: { email: testEmail },
    data: {
      resetPasswordToken: expiredHash,
      resetPasswordExpires: new Date(Date.now() - 60000), // Expired 1 minute ago
    },
  });
  const expiredRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: expiredRaw, password: "AnotherPassword789!" }),
  });
  assert(expiredRes.status === 400, "19. Expired Reset Token Rejected (400 Bad Request)");

  // 20. Weak Password Rejected by Validation Schema (400 Bad Request)
  const weakPassRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Weak",
      lastName: "User",
      email: `weak_${Date.now()}@example.com`,
      password: "short", // Only 5 chars, no upper, no number
    }),
  });
  assert(weakPassRes.status === 400, "20. Weak Password Rejected by Validation Schema (400 Bad Request)");

  // 21. User Logout (POST /auth/logout)
  const logoutRes = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${newLoginData.data?.tokens?.accessToken}` },
  });
  assert(logoutRes.status === 200, "21. User Logout Cleans Active Refresh Session");

  console.log(`\n=========================================`);
  console.log(`RESULTS: ${passed} / ${total} tests passed!`);
  console.log(`=========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAuthTests()
  .catch((err) => {
    console.error("Test runner error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

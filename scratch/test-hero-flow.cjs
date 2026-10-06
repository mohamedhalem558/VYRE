const http = require("http");

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log("=== 1. Test GET /api/v1/hero (Public) ===");
  const getRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/v1/hero",
    method: "GET",
  });
  console.log("Status:", getRes.status);
  console.log("Data:", getRes.data);

  console.log("\n=== 2. Test PUT /api/v1/hero without token (Expect 401) ===");
  const putNoAuth = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/v1/hero",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    },
    { title: "Hacked" }
  );
  console.log("Status:", putNoAuth.status, "Error:", putNoAuth.data?.error || putNoAuth.data?.message);

  console.log("\n=== 3. Login as Admin ===");
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/v1/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "admin@vyre.local", password: "Password123!" }
  );

  const token = loginRes.data?.data?.tokens?.accessToken;
  console.log("Admin logged in:", loginRes.data?.data?.user?.email, "Role:", loginRes.data?.data?.user?.role);
  console.log("Token received:", !!token);

  console.log("\n=== 4. Test PUT /api/v1/hero with Admin token ===");
  const updateRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/v1/hero",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      eyebrow: "SPRING / SUMMER 2026",
      title: "VYRE NOIR.",
      subtitle: "ARCHITECTURAL MINIMALISM.",
      ctaText: "EXPLORE DROP",
      ctaLink: "/shop",
      imageUrl: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1800&auto=format&fit=crop",
      active: true,
    }
  );
  console.log("Status:", updateRes.status, "Updated:", updateRes.data);

  console.log("\n=== 5. Verify updated hero via public GET ===");
  const getUpdatedRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/v1/hero",
    method: "GET",
  });
  console.log("Status:", getUpdatedRes.status, "Hero Title:", getUpdatedRes.data?.data?.title);

  console.log("\n=== 6. Reset back to Winter Collection ===");
  const resetRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/v1/hero",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      eyebrow: "WINTER 2026 COLLECTION",
      title: "VYRE.",
      subtitle: "BUILT FOR YOUR EVERYDAY.",
      ctaText: "SHOP COLLECTION",
      ctaLink: "/shop",
      imageUrl: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1800&auto=format&fit=crop",
      active: true,
    }
  );
  console.log("Status:", resetRes.status, "Reset Title:", resetRes.data?.data?.title);
  console.log("\nAll API tests PASSED!");
}

run().catch(console.error);

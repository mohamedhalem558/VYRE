import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log("🌱 Starting VYRE database seeding...");

  // Clean existing tables in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.color.deleteMany();
  await prisma.size.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();

  console.log("🧹 Cleaned database tables.");

  // 1. Create Core Taxonomy: Sizes
  const sizes = await Promise.all([
    prisma.size.create({ data: { name: "Extra Small", code: "XS", displayOrder: 1 } }),
    prisma.size.create({ data: { name: "Small", code: "S", displayOrder: 2 } }),
    prisma.size.create({ data: { name: "Medium", code: "M", displayOrder: 3 } }),
    prisma.size.create({ data: { name: "Large", code: "L", displayOrder: 4 } }),
    prisma.size.create({ data: { name: "Extra Large", code: "XL", displayOrder: 5 } }),
    prisma.size.create({ data: { name: "Double Extra Large", code: "XXL", displayOrder: 6 } }),
  ]);
  const sizeMap = new Map(sizes.map((s) => [s.code, s.id]));
  console.log(`✅ Seeded ${sizes.length} sizes.`);

  // 2. Create Core Taxonomy: Colors
  const colors = await Promise.all([
    prisma.color.create({ data: { name: "Obsidian Black", code: "BLK", hexCode: "#0a0a0a" } }),
    prisma.color.create({ data: { name: "Egyptian White", code: "WHT", hexCode: "#f8f9fa" } }),
    prisma.color.create({ data: { name: "Charcoal Grey", code: "GRY", hexCode: "#2b2b2b" } }),
    prisma.color.create({ data: { name: "Desert Sand", code: "SND", hexCode: "#c2b280" } }),
    prisma.color.create({ data: { name: "Military Olive", code: "OLV", hexCode: "#4b5320" } }),
    prisma.color.create({ data: { name: "Midnight Navy", code: "NVY", hexCode: "#1b263b" } }),
  ]);
  const colorMap = new Map(colors.map((c) => [c.code, c.id]));
  console.log(`✅ Seeded ${colors.length} colors.`);

  // 3. Create EXACTLY TWO Categories: "Hoodies & Sweaters" and "Jackets"
  const categoryHoodiesSweaters = await prisma.category.create({
    data: {
      name: "Hoodies & Sweaters",
      slug: "hoodies-sweaters",
      description: "Heavyweight 450 GSM French Terry hoodies and architectural knitted sweaters crafted from 100% Egyptian combed cotton.",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
      displayOrder: 1,
      active: true,
    },
  });

  const categoryJackets = await prisma.category.create({
    data: {
      name: "Jackets",
      slug: "jackets",
      description: "Tactical bombers, cropped workwear jackets, and architectural denim layers engineered in Cairo.",
      image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1200&auto=format&fit=crop",
      displayOrder: 2,
      active: true,
    },
  });
  console.log("✅ Seeded ONLY 2 categories: 'Hoodies & Sweaters' and 'Jackets'.");

  // 4. Create Users (Development Accounts for all roles)
  const defaultPasswordHash = await hashPassword("Password123!");

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@vyre.local",
      passwordHash: defaultPasswordHash,
      firstName: "Admin",
      lastName: "VYRE",
      phoneNumber: "+201000000001",
      role: "ADMIN",
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@vyre.store",
      passwordHash: defaultPasswordHash,
      firstName: "Admin",
      lastName: "VYRE",
      phoneNumber: "+201000000011",
      role: "ADMIN",
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "inventory@vyre.local",
      passwordHash: defaultPasswordHash,
      firstName: "Inventory",
      lastName: "Manager",
      phoneNumber: "+201000000002",
      role: "INVENTORY_MANAGER",
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "marketing@vyre.local",
      passwordHash: defaultPasswordHash,
      firstName: "Marketing",
      lastName: "Manager",
      phoneNumber: "+201000000003",
      role: "MARKETING_MANAGER",
      active: true,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: "customer@vyre.local",
      passwordHash: defaultPasswordHash,
      firstName: "Karim",
      lastName: "Hassan",
      phoneNumber: "+201012345678",
      role: "CUSTOMER",
      active: true,
      addresses: {
        create: {
          fullName: "Karim Hassan",
          phoneNumber: "+201012345678",
          streetAddress: "Road 9, Near Degla Square",
          buildingNumber: "14",
          apartmentNumber: "3B",
          city: "Maadi",
          governorate: "Cairo",
          isDefault: true,
        },
      },
    },
  });
  console.log("✅ Seeded Admin (admin@vyre.local), Inventory Manager (inventory@vyre.local), Marketing Manager (marketing@vyre.local) & Customer (customer@vyre.local).");

  // 4b. Seed Egyptian Shipping Rates
  await prisma.shippingRate.createMany({
    data: [
      {
        region: "Cairo",
        displayName: "Greater Cairo & New Cairo",
        fee: 60.0,
        estimatedDays: "1-2 Business Days",
        freeAbove: 3000.0,
        active: true,
      },
      {
        region: "Giza",
        displayName: "Giza & 6th of October",
        fee: 70.0,
        estimatedDays: "1-2 Business Days",
        freeAbove: 3000.0,
        active: true,
      },
      {
        region: "Other Egypt",
        displayName: "Alexandria, Delta & Other Governorates",
        fee: 90.0,
        estimatedDays: "2-4 Business Days",
        freeAbove: 3000.0,
        active: true,
      },
    ],
  });
  console.log("✅ Seeded Egyptian regional shipping rates (Cairo: 60 EGP, Giza: 70 EGP, Other Egypt: 90 EGP, Free above 3,000 EGP).");

  // 5. Seed Realistic Products (ONLY in Hoodies & Sweaters and Jackets)
  const productsData = [
    // --- HOODIES & SWEATERS ---
    {
      name: "VYRE. Signature 450 GSM Oversized Hoodie",
      slug: "vyre-signature-450gsm-oversized-hoodie",
      description: "The definitive VYRE. cornerstone hoodie. Spun with double-lined 450 GSM combed Egyptian cotton, deep sculptural hood, dropped shoulder tailoring, and zero drawstrings for pure minimalist aesthetics.",
      shortDescription: "Signature 450 GSM drop shoulder oversized hoodie in 100% Egyptian Cotton.",
      price: 1850.00,
      compareAtPrice: 2200.00,
      categoryId: categoryHoodiesSweaters.id,
      featured: true,
      bestseller: true,
      newArrival: true,
      tags: ["hoodie", "heavyweight", "oversized", "bestseller", "signature"],
      images: [
        { url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop", altText: "VYRE. Signature 450 GSM Oversized Hoodie - Obsidian Black", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1200&auto=format&fit=crop", altText: "Signature Hoodie Fabric Texture", displayOrder: 1 },
      ],
      colors: ["BLK", "WHT", "GRY", "SND"],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      name: "VYRE. 450 GSM Knit Waffle Sweater",
      slug: "vyre-450gsm-knit-waffle-sweater",
      description: "An architectural knit waffle sweater spun from 100% Egyptian combed cotton yarn in Cairo. Features a relaxed drop-shoulder cut, heavyweight thermal structure, and raw minimalist hemline with custom antique brass VYRE. hardware.",
      shortDescription: "Heavyweight 450 GSM waffle knit sweater in pure Egyptian cotton.",
      price: 1650.00,
      compareAtPrice: 1950.00,
      categoryId: categoryHoodiesSweaters.id,
      featured: true,
      bestseller: true,
      newArrival: false,
      tags: ["sweater", "knit", "heavyweight", "waffle", "winter", "egyptian-cotton"],
      images: [
        { url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop", altText: "VYRE. Knit Waffle Sweater - Obsidian Black Front", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=1200&auto=format&fit=crop", altText: "VYRE. Knit Waffle Sweater - Texture Close-up", displayOrder: 1 },
      ],
      colors: ["BLK", "WHT", "SND"],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      name: "VYRE. Arch Heavyweight Crewneck Sweater",
      slug: "vyre-arch-heavyweight-crewneck-sweater",
      description: "Engineered from 500 GSM loopback French Terry with ribbed neck collar and subtle tonal chest embroidery. Pre-shrunk for an enduring structural drape after countless washes.",
      shortDescription: "500 GSM loopback French Terry crewneck with minimal tonal branding.",
      price: 1450.00,
      compareAtPrice: 1750.00,
      categoryId: categoryHoodiesSweaters.id,
      featured: false,
      bestseller: true,
      newArrival: true,
      tags: ["sweater", "crewneck", "minimalist", "terry", "cairo"],
      images: [
        { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop", altText: "Arch Crewneck Front", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1200&auto=format&fit=crop", altText: "Arch Crewneck Studio Fit", displayOrder: 1 },
      ],
      colors: ["GRY", "BLK", "OLV"],
      sizes: ["S", "M", "L", "XL"],
    },
    {
      name: "VYRE. Minimalist Zip-Up Fleece Hoodie",
      slug: "vyre-minimalist-zip-up-fleece-hoodie",
      description: "Heavyweight 480 GSM Egyptian cotton brushed fleece zip hoodie with two-way matte gunmetal zipper and hidden seam pockets.",
      shortDescription: "480 GSM brushed fleece zip hoodie with clean architectural cut.",
      price: 1950.00,
      compareAtPrice: 2300.00,
      categoryId: categoryHoodiesSweaters.id,
      featured: true,
      bestseller: false,
      newArrival: true,
      tags: ["hoodie", "zip-up", "fleece", "heavyweight"],
      images: [
        { url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop", altText: "Minimalist Zip Hoodie", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop", altText: "Zip Hoodie Side View", displayOrder: 1 },
      ],
      colors: ["BLK", "GRY", "WHT"],
      sizes: ["S", "M", "L", "XL"],
    },

    // --- JACKETS ---
    {
      name: "VYRE. Tactical Canvas Bomber Jacket",
      slug: "vyre-tactical-canvas-bomber-jacket",
      description: "A rugged 14oz Egyptian cotton canvas bomber with water-resistant wax finish, padded quilted orange lining, dual-entry utility pockets, and heavy-duty matte black YKK dual zippers.",
      shortDescription: "14oz waxed cotton canvas bomber with padded lining and dual hardware.",
      price: 2650.00,
      compareAtPrice: 3200.00,
      categoryId: categoryJackets.id,
      featured: true,
      bestseller: true,
      newArrival: true,
      tags: ["jacket", "bomber", "outerwear", "tactical", "canvas"],
      images: [
        { url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1200&auto=format&fit=crop", altText: "Tactical Canvas Bomber Jacket Front", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop", altText: "Tactical Canvas Bomber Jacket Detail", displayOrder: 1 },
        { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop", altText: "Tactical Canvas Bomber Jacket Model Fit", displayOrder: 2 },
      ],
      colors: ["BLK", "OLV", "SND"],
      sizes: ["M", "L", "XL", "XXL"],
    },
    {
      name: "VYRE. Raw Selvedge Denim Worker Jacket",
      slug: "vyre-raw-selvedge-denim-worker-jacket",
      description: "Constructed with unwashed 13.5oz Egyptian selvedge denim. Boxy workwear silhouette featuring deep interior chest pockets and custom engraved metal buttons.",
      shortDescription: "13.5oz Egyptian selvedge denim worker jacket with boxy silhouette.",
      price: 2250.00,
      compareAtPrice: 2700.00,
      categoryId: categoryJackets.id,
      featured: true,
      bestseller: false,
      newArrival: true,
      tags: ["jacket", "denim", "selvedge", "raw-denim", "workwear"],
      images: [
        { url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1200&auto=format&fit=crop", altText: "Raw Denim Worker Jacket", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1200&auto=format&fit=crop", altText: "Denim Detail View", displayOrder: 1 },
      ],
      colors: ["NVY", "BLK"],
      sizes: ["S", "M", "L", "XL"],
    },
    {
      name: "VYRE. Oversized Quilted Liner Jacket",
      slug: "vyre-oversized-quilted-liner-jacket",
      description: "Lightweight thermal military onion-quilted jacket designed as a standalone outer piece or mid-layer. Finished with snap closures and bound seams.",
      shortDescription: "Minimalist onion-quilted liner jacket with snap closures.",
      price: 2100.00,
      compareAtPrice: 2500.00,
      categoryId: categoryJackets.id,
      featured: false,
      bestseller: true,
      newArrival: true,
      tags: ["jacket", "quilted", "liner", "outerwear"],
      images: [
        { url: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop", altText: "Quilted Liner Jacket", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1200&auto=format&fit=crop", altText: "Liner Back View", displayOrder: 1 },
      ],
      colors: ["OLV", "BLK", "SND"],
      sizes: ["S", "M", "L", "XL"],
    },
    {
      name: "VYRE. Wool Blend Minimal Overshirt Jacket",
      slug: "vyre-wool-blend-minimal-overshirt-jacket",
      description: "Substantial 400 GSM wool-cotton blend overshirt jacket with clean point collar, hidden placket, and sleek vertical chest pockets.",
      shortDescription: "Heavyweight wool blend overshirt jacket with concealed placket.",
      price: 2400.00,
      compareAtPrice: 2850.00,
      categoryId: categoryJackets.id,
      featured: false,
      bestseller: false,
      newArrival: true,
      tags: ["jacket", "overshirt", "wool", "minimal"],
      images: [
        { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop", altText: "Wool Overshirt Front", displayOrder: 0 },
        { url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1200&auto=format&fit=crop", altText: "Wool Overshirt Profile", displayOrder: 1 },
      ],
      colors: ["GRY", "BLK", "NVY"],
      sizes: ["M", "L", "XL"],
    },
  ];

  let totalVariantsCreated = 0;

  for (const p of productsData) {
    // Create product
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        categoryId: p.categoryId,
        brand: "VYRE.",
        active: true,
        featured: p.featured,
        bestseller: p.bestseller,
        newArrival: p.newArrival,
        tags: p.tags,
        images: {
          create: p.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            displayOrder: img.displayOrder,
          })),
        },
      },
    });

    // Create all size x color variants with realistic SKUs and stock
    const variantCreations = [];
    const prefix = p.slug.split("-").map((w) => w[0].toUpperCase()).join("");

    for (const colorCode of p.colors) {
      const colorId = colorMap.get(colorCode)!;
      for (const sizeCode of p.sizes) {
        const sizeId = sizeMap.get(sizeCode)!;
        const sku = `VYRE-${prefix}-${colorCode}-${sizeCode}`;
        const stock = sizeCode === "XXL" ? 4 : sizeCode === "M" || sizeCode === "L" ? 18 : 10;

        variantCreations.push({
          productId: product.id,
          sku,
          colorId,
          sizeId,
          stock,
          lowStockThreshold: 5,
          active: true,
        });
      }
    }

    await prisma.productVariant.createMany({
      data: variantCreations,
    });
    totalVariantsCreated += variantCreations.length;

    // Create inventory transaction logs
    const createdVariants = await prisma.productVariant.findMany({
      where: { productId: product.id },
      select: { id: true, stock: true },
    });

    await prisma.inventoryTransaction.createMany({
      data: createdVariants.map((v) => ({
        productId: product.id,
        variantId: v.id,
        previousQuantity: 0,
        changedQuantity: v.stock,
        newQuantity: v.stock,
        reason: "INITIAL_STOCK",
        userId: adminUser.id,
        metadata: { source: "seed_migration", brand: "VYRE." },
      })),
    });

    // Create initial verified reviews for social proof
    await prisma.review.createMany({
      data: [
        {
          productId: product.id,
          userId: customerUser.id,
          authorName: "Omar S.",
          rating: 5,
          comment: "Fabric weight and construction are exceptional. Best local Egyptian streetwear quality by far.",
          verified: true,
          approved: true,
        },
        {
          productId: product.id,
          userId: null,
          authorName: "Youssef M.",
          rating: 5,
          comment: "True drop-shoulder fit. Heavy and holds shape even after washing. Highly recommended.",
          verified: true,
          approved: true,
        },
      ],
    });
  }

  console.log(`✅ Seeded ${productsData.length} products with ${totalVariantsCreated} variants, stock & reviews.`);

  // 6. Seed Sample Promotional Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: "VYRE10",
        description: "10% off on all orders",
        type: "PERCENTAGE",
        value: 10,
        minimumOrderAmount: 500,
        maximumDiscount: 500,
        usageLimit: 500,
        active: true,
      },
      {
        code: "CAIRO20",
        description: "20% off for runway drops over 2000 EGP",
        type: "PERCENTAGE",
        value: 20,
        minimumOrderAmount: 2000,
        maximumDiscount: 800,
        usageLimit: 200,
        active: true,
      },
      {
        code: "WELCOME150",
        description: "150 EGP flat discount for first order",
        type: "FIXED_AMOUNT",
        value: 150,
        minimumOrderAmount: 1200,
        usageLimit: 1000,
        active: true,
      },
    ],
  });
  console.log("✅ Seeded promotional coupons (VYRE10, CAIRO20, WELCOME150).");

  console.log("\n==================================================");
  console.log("🚀 VYRE DATABASE SEEDED SUCCESSFULLY!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

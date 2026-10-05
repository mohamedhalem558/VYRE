import { Product, Category } from "@vyre/shared";

export const CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Hoodies & Sweaters",
    slug: "hoodies-sweaters",
    description:
      "450 GSM Heavyweight French Terry cotton crafted for Egyptian winter and oversized streetwear aesthetics.",
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop",
    itemCount: 12,
    featured: true,
  },
  {
    id: "cat-2",
    name: "Jackets",
    slug: "jackets",
    description:
      "Utility bombers, raw denim jackets, and windbreakers for modern urban navigation.",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop",
    itemCount: 6,
    featured: true,
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    slug: "cairo-heavyweight-oversized-hoodie-black",
    name: "Cairo Heavyweight Oversized Hoodie",
    tagline: "450 GSM Egyptian French Terry Cotton",
    description:
      "The flagship VYRE hoodie. Cut in an exaggerated boxy silhouette from ultra-heavyweight 450 GSM 100% Egyptian French Terry cotton. Features double-layered hood without drawstrings for a clean architectural profile, ribbed cuffs, and subtle embossed tonal branding on the chest.",
    details: [
      "Custom 450 GSM Heavyweight Egyptian French Terry",
      "Double-layered structured hood (no drawstrings)",
      "Drop-shoulder boxy oversized cut",
      "Kangaroo pocket with reinforced bar-tack stitching",
      "Pre-shrunk for zero shrinkage after washing",
      "Crafted in Cairo, Egypt",
    ],
    fabricCare: [
      "100% Premium Egyptian Combed Cotton",
      "Machine wash cold inside out with similar dark colors",
      "Do not bleach or tumble dry",
      "Cool iron on reverse side",
    ],
    price: 1350,
    compareAtPrice: 1650,
    discountPercentage: 18,
    category: "Hoodies & Sweaters",
    categorySlug: "hoodies-sweaters",
    tags: ["Heavyweight", "Oversized", "Winter 2026", "Signature"],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    inStock: true,
    stockCount: 45,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Obsidian Black", hex: "#0a0a0b" },
      { name: "Slate Grey", hex: "#4b5563" },
      { name: "Desert Sand", hex: "#d2b48c" },
    ],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1000&auto=format&fit=crop",
    ],
    primaryImage:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop",
    secondaryImage:
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 38,
    sku: "VYR-HD-001",
    createdAt: "2026-09-15T00:00:00.000Z",
    reviews: [
      {
        id: "rev-1",
        userName: "Youssef M.",
        userCity: "New Cairo",
        rating: 5,
        title: "Best hoodie in Egypt period",
        comment:
          "The fabric weight is insane. Heavy, warm, and the hood stands up perfectly without feeling cheap.",
        date: "2026-09-28",
        verifiedPurchase: true,
      },
      {
        id: "rev-2",
        userName: "Karim H.",
        userCity: "Zamalek",
        rating: 5,
        title: "True oversized fit",
        comment:
          "Got size L and it fits exactly like high-end European streetwear brands. Fast 24hr delivery in Cairo.",
        date: "2026-10-01",
        verifiedPurchase: true,
      },
    ],
  },
  {
    id: "prod-4",
    slug: "giza-raw-denim-oversized-jacket",
    name: "Giza Raw Denim Oversized Jacket",
    tagline: "14.5 oz Egyptian Selvedge Denim",
    description:
      "A masterpiece of local denim tailoring. Constructed using untreated 14.5 oz Egyptian selvedge denim that develops a bespoke patina with every wear. Features custom matte gunmetal hardware and dual welt chest pockets.",
    details: [
      "14.5 oz Raw Rigid Egyptian Denim",
      "Heavy matte gunmetal engraved buttons",
      "Relaxed drop-shoulder trucker cut",
      "Internal stash pockets",
    ],
    fabricCare: [
      "100% Cotton Selvedge Denim",
      "Spot clean or cold hand wash to preserve raw indigo",
    ],
    price: 1850,
    compareAtPrice: 2200,
    discountPercentage: 16,
    category: "Jackets",
    categorySlug: "jackets",
    tags: ["Raw Denim", "Selvedge", "Outerwear", "Premium"],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    inStock: true,
    stockCount: 18,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Raw Indigo", hex: "#1a2a3a" },
      { name: "Washed Black", hex: "#2b2b2b" },
    ],
    images: [
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop",
    ],
    primaryImage:
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=1000&auto=format&fit=crop",
    secondaryImage:
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop",
    rating: 5.0,
    reviewCount: 14,
    sku: "VYR-JK-004",
    createdAt: "2026-09-22T00:00:00.000Z",
  },
];

export const MOCK_USER = {
  id: "user-1",
  firstName: "Karim",
  lastName: "Hassan",
  email: "karim.hassan@example.com",
  phoneNumber: "+20 100 123 4567",
  role: "customer" as const,
  addresses: [
    {
      id: "addr-1",
      fullName: "Karim Hassan",
      phoneNumber: "+20 100 123 4567",
      streetAddress: "Road 9, Building 42, Apt 5",
      buildingNumber: "42",
      apartmentNumber: "5",
      city: "Maadi",
      governorate: "Cairo",
      postalCode: "11728",
      isDefault: true,
    },
    {
      id: "addr-2",
      fullName: "Karim Hassan",
      phoneNumber: "+20 100 123 4567",
      streetAddress: "26th of July Corridor, Villa 12",
      city: "Sheikh Zayed",
      governorate: "Giza",
      postalCode: "12588",
      isDefault: false,
    },
  ],
  createdAt: "2026-05-12T00:00:00.000Z",
};

export const EGYPT_GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Fayoum",
  "Gharbia",
  "Ismailia",
  "Menofia",
  "Minya",
  "Qaliubiya",
  "New Valley",
  "Suez",
  "Aswan",
  "Assiut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharkia",
  "South Sinai",
  "Kafr El Sheikh",
  "Matrouh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag",
];

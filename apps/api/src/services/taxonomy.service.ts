import { prisma } from "../config/prisma.js";

const DEFAULT_SIZES = [
  { name: "Extra Small", code: "XS", displayOrder: 1 },
  { name: "Small", code: "S", displayOrder: 2 },
  { name: "Medium", code: "M", displayOrder: 3 },
  { name: "Large", code: "L", displayOrder: 4 },
  { name: "Extra Large", code: "XL", displayOrder: 5 },
  { name: "Double Extra Large", code: "XXL", displayOrder: 6 },
  { name: "Triple Extra Large", code: "3XL", displayOrder: 7 },
  { name: "Free Size", code: "FREE", displayOrder: 8 },
];

const DEFAULT_COLORS = [
  { name: "Obsidian Black", code: "BLK", hexCode: "#0a0a0a" },
  { name: "Egyptian White", code: "WHT", hexCode: "#f8f9fa" },
  { name: "Charcoal Grey", code: "GRY", hexCode: "#2b2b2b" },
  { name: "Desert Sand", code: "SND", hexCode: "#c2b280" },
  { name: "Military Olive", code: "OLV", hexCode: "#4b5320" },
  { name: "Midnight Navy", code: "NVY", hexCode: "#1b263b" },
];

export class TaxonomyService {
  async getSizes() {
    let sizes = await prisma.size.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
    });

    // Automatically seed standard sizes if database table is empty
    if (sizes.length === 0) {
      await this.seedDefaultSizes();
      sizes = await prisma.size.findMany({
        where: { active: true },
        orderBy: { displayOrder: "asc" },
      });
    }

    return sizes;
  }

  async seedDefaultSizes() {
    for (const item of DEFAULT_SIZES) {
      await prisma.size.upsert({
        where: { code: item.code },
        update: { active: true },
        create: {
          name: item.name,
          code: item.code,
          displayOrder: item.displayOrder,
          active: true,
        },
      });
    }
  }

  async createSize(name: string, code: string, displayOrder?: number) {
    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.size.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { name: { equals: cleanName, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      if (!existing.active) {
        return prisma.size.update({
          where: { id: existing.id },
          data: { active: true },
        });
      }
      return existing;
    }

    const maxOrder = await prisma.size.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const order = displayOrder ?? (maxOrder ? maxOrder.displayOrder + 1 : 1);

    return prisma.size.create({
      data: {
        name: cleanName,
        code: cleanCode,
        displayOrder: order,
        active: true,
      },
    });
  }

  async getColors() {
    let colors = await prisma.color.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    // Automatically seed standard colors if database table is empty
    if (colors.length === 0) {
      await this.seedDefaultColors();
      colors = await prisma.color.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      });
    }

    return colors;
  }

  async seedDefaultColors() {
    for (const item of DEFAULT_COLORS) {
      await prisma.color.upsert({
        where: { code: item.code },
        update: { active: true },
        create: {
          name: item.name,
          code: item.code,
          hexCode: item.hexCode,
          active: true,
        },
      });
    }
  }

  async createColor(name: string, hexCode: string, code?: string) {
    const cleanName = name.trim();
    const cleanHex = hexCode.trim();
    const generatedCode = (
      code || cleanName.substring(0, 3).toUpperCase()
    ).replace(/[^A-Z0-9]/g, "");

    const existing = await prisma.color.findFirst({
      where: {
        OR: [
          { name: { equals: cleanName, mode: "insensitive" } },
          { code: generatedCode },
        ],
      },
    });

    if (existing) {
      if (!existing.active) {
        return prisma.color.update({
          where: { id: existing.id },
          data: { active: true },
        });
      }
      return existing;
    }

    return prisma.color.create({
      data: {
        name: cleanName,
        hexCode: cleanHex.startsWith("#") ? cleanHex : `#${cleanHex}`,
        code: generatedCode || `COL${Date.now().toString().slice(-3)}`,
        active: true,
      },
    });
  }

  async deleteColor(id: string) {
    const inUse = await prisma.productVariant.count({
      where: { colorId: id },
    });
    if (inUse > 0) {
      return prisma.color.update({
        where: { id },
        data: { active: false },
      });
    }
    return prisma.color.delete({
      where: { id },
    });
  }
}

export const taxonomyService = new TaxonomyService();


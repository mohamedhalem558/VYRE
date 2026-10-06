import { prisma } from "../config/prisma.js";

export class TaxonomyService {
  async getSizes() {
    return prisma.size.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
    });
  }

  async getColors() {
    return prisma.color.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  async createColor(name: string, hexCode: string, code?: string) {
    const cleanName = name.trim();
    const cleanHex = hexCode.trim();
    const generatedCode = (
      code || cleanName.substring(0, 3).toUpperCase()
    ).replace(/[^A-Z0-9]/g, "");

    // Check if color already exists with same name or code
    const existing = await prisma.color.findFirst({
      where: {
        OR: [
          { name: { equals: cleanName, mode: "insensitive" } },
          { code: generatedCode },
        ],
      },
    });

    if (existing) {
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
    // Check if color is in use by variants
    const inUse = await prisma.productVariant.count({
      where: { colorId: id },
    });
    if (inUse > 0) {
      // Soft-delete / deactivate so existing products aren't broken
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

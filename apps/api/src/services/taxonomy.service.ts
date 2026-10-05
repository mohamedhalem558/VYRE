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
}

export const taxonomyService = new TaxonomyService();

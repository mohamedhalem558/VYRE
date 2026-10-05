import { prisma } from "../config/prisma.js";
import { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category.schema.js";

export class CategoryService {
  async getAllCategories() {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
      active: cat.active,
      displayOrder: cat.displayOrder,
      itemCount: cat._count.products,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));
  }

  async getCategoryByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const category = await prisma.category.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      active: category.active,
      displayOrder: category.displayOrder,
      itemCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async createCategory(data: CreateCategoryInput) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        active: data.active,
        displayOrder: data.displayOrder,
      },
    });
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();

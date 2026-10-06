import { prisma } from "../config/prisma.js";
import { HomepageHeroDTO, UpdateHeroDTO } from "@vyre/shared";

export const DEFAULT_HERO = {
  eyebrow: "WINTER 2026 COLLECTION",
  title: "VYRE.",
  subtitle: "BUILT FOR YOUR EVERYDAY.",
  ctaText: "SHOP COLLECTION",
  ctaLink: "/shop",
  imageUrl: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1800&auto=format&fit=crop",
  active: true,
};

export class HeroService {
  async getHero(): Promise<HomepageHeroDTO> {
    let hero = await prisma.homepageHero.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!hero) {
      hero = await prisma.homepageHero.create({
        data: DEFAULT_HERO,
      });
    }

    return {
      id: hero.id,
      eyebrow: hero.eyebrow,
      title: hero.title,
      subtitle: hero.subtitle,
      ctaText: hero.ctaText,
      ctaLink: hero.ctaLink,
      imageUrl: hero.imageUrl,
      active: hero.active,
      createdAt: hero.createdAt.toISOString(),
      updatedAt: hero.updatedAt.toISOString(),
    };
  }

  async updateHero(data: UpdateHeroDTO): Promise<HomepageHeroDTO> {
    const existing = await prisma.homepageHero.findFirst({
      orderBy: { createdAt: "asc" },
    });

    let hero;
    if (existing) {
      hero = await prisma.homepageHero.update({
        where: { id: existing.id },
        data: {
          ...(data.eyebrow !== undefined && { eyebrow: data.eyebrow }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
          ...(data.ctaText !== undefined && { ctaText: data.ctaText }),
          ...(data.ctaLink !== undefined && { ctaLink: data.ctaLink }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.active !== undefined && { active: data.active }),
        },
      });
    } else {
      hero = await prisma.homepageHero.create({
        data: {
          eyebrow: data.eyebrow || DEFAULT_HERO.eyebrow,
          title: data.title || DEFAULT_HERO.title,
          subtitle: data.subtitle || DEFAULT_HERO.subtitle,
          ctaText: data.ctaText || DEFAULT_HERO.ctaText,
          ctaLink: data.ctaLink || DEFAULT_HERO.ctaLink,
          imageUrl: data.imageUrl || DEFAULT_HERO.imageUrl,
          active: data.active !== undefined ? data.active : DEFAULT_HERO.active,
        },
      });
    }

    return {
      id: hero.id,
      eyebrow: hero.eyebrow,
      title: hero.title,
      subtitle: hero.subtitle,
      ctaText: hero.ctaText,
      ctaLink: hero.ctaLink,
      imageUrl: hero.imageUrl,
      active: hero.active,
      createdAt: hero.createdAt.toISOString(),
      updatedAt: hero.updatedAt.toISOString(),
    };
  }
}

export const heroService = new HeroService();

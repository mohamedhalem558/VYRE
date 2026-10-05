import React from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { Button } from "../components/ui/button.js";
import { ArrowRight } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 text-neutral-900">
      <Breadcrumb items={[{ label: "About VYRE." }]} />

      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6 pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
          The Brand
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
          Built For Your Everyday.
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl mx-auto">
          VYRE. is an independent contemporary fashion label based in Cairo, Egypt. We focus on architectural minimalism, essential silhouettes, and premium local textiles crafted to elevate your daily style.
        </p>
      </div>

      {/* Large Visual Section */}
      <div className="aspect-[16/9] sm:aspect-[21/9] w-full rounded-xs overflow-hidden bg-neutral-100 border border-neutral-200">
        <img
          src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1800&auto=format&fit=crop"
          alt="VYRE. Brand Story"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* 2-Column Story Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-6">
        <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Craft & Philosophy
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            Authentic Egyptian Craftsmanship
          </h2>
          <p>
            Rooted in Cairo's enduring textile legacy, we believe that modern luxury is defined by high craftsmanship, clean proportions, and thoughtful fabric selection.
          </p>
          <p>
            Each piece is designed with clean lines and fabricated with long-staple combed cotton, ensuring longevity, soft comfort, and timeless wearability through every season.
          </p>
          <div className="pt-2">
            <Link to="/shop">
              <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Explore Collection
              </Button>
            </Link>
          </div>
        </div>

        <div className="aspect-[4/5] rounded-xs overflow-hidden border border-neutral-200 bg-neutral-100">
          <img
            src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop"
            alt="VYRE. Craft"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neutral-200">
        <div className="p-6 rounded-xs border border-neutral-200 bg-neutral-50 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Egyptian Combed Cotton
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Ultra-soft, high-grade long-staple cotton cultivated and processed locally for enduring quality.
          </p>
        </div>

        <div className="p-6 rounded-xs border border-neutral-200 bg-neutral-50 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Modern Silhouettes
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Relaxed proportions and clean architectural cuts engineered for seamless daily comfort.
          </p>
        </div>

        <div className="p-6 rounded-xs border border-neutral-200 bg-neutral-50 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Local Production
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Tailored in Cairo, supporting local artisans and maintaining high quality standards.
          </p>
        </div>
      </div>
    </div>
  );
};

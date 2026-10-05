import React from "react";
import { Instagram } from "lucide-react";

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#f5f5f5] text-neutral-800 text-[11px] sm:text-xs font-medium border-b border-neutral-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
        {/* Social media icons on the left */}
        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-neutral-600 hover:text-black transition-colors"
          >
            <Instagram className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
            className="text-neutral-600 hover:text-black transition-colors"
          >
            <svg
              className="h-3.5 w-3.5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.48V8.71a8.16 8.16 0 0 0 4.91 1.63v-3.65h-.01z" />
            </svg>
          </a>
        </div>

        {/* Center promotional message */}
        <div className="text-center font-medium tracking-wide text-neutral-700 flex items-center justify-center gap-2 sm:gap-3 truncate px-2">
          <span>Free shipping over 3000 EGP</span>
          <span className="text-neutral-400 font-bold">•</span>
          <span>3 Days Returns & Exchanges</span>
          <span className="hidden md:inline text-neutral-400 font-bold">•</span>
          <span className="hidden md:inline">Cash on Delivery</span>
        </div>

        {/* Right helper info */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500 font-mono uppercase">
          <span>EGP / CAIRO</span>
        </div>
      </div>
    </div>
  );
};

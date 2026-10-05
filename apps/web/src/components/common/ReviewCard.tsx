import React from "react";
import { ProductReview } from "@vyre/shared";
import { Star, CheckCircle } from "lucide-react";

export const ReviewCard: React.FC<{ review: ProductReview }> = ({ review }) => {
  return (
    <div className="rounded-xs border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-black">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              className={`h-3.5 w-3.5 ${
                idx < review.rating ? "fill-current text-black" : "text-neutral-200"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] font-mono text-neutral-400">{review.date}</span>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase">{review.title}</h4>
        <p className="text-xs text-neutral-600 leading-relaxed">{review.comment}</p>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 text-xs text-neutral-500">
        <span className="font-semibold text-neutral-900">{review.userName}</span>
        {review.userCity && <span className="text-neutral-400">• {review.userCity}</span>}
        {review.verifiedPurchase && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-neutral-700 font-semibold uppercase tracking-wider">
            <CheckCircle className="h-3 w-3 text-black" />
            Verified Buyer
          </span>
        )}
      </div>
    </div>
  );
};

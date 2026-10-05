import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.js";
import { ArrowLeft } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 text-neutral-900">
      <span className="text-8xl font-black text-neutral-200 select-none">404</span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-neutral-900">Page Not Found</h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm">
          The requested page does not exist or has been moved in the VYRE. storefront.
        </p>
      </div>
      <Link to="/">
        <Button variant="primary" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>
      </Link>
    </div>
  );
};

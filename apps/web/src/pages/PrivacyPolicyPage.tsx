import React from "react";
import { Breadcrumb } from "../components/common/Breadcrumb.js";

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-800">
      <Breadcrumb items={[{ label: "Privacy Policy" }]} />

      <div className="border-b border-neutral-200 pb-4 space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Legal Notice
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold uppercase text-neutral-900 font-heading">
          Privacy Policy
        </h1>
        <p className="text-xs text-neutral-500">
          Effective Date: January 1, 2026 • Last updated: 2026
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-neutral-700">
        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">1. Introduction</h2>
          <p>
            VYRE. ("we", "us", or "our") is committed to protecting your privacy. This policy outlines how your personal data is handled when using our website and ordering across Egypt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">2. Information We Collect</h2>
          <p>
            We collect the information required to process and fulfill your orders:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-600 pl-2">
            <li>
              <strong>Contact Information:</strong> Name, delivery address in Egypt, email, and phone number for courier coordination.
            </li>
            <li>
              <strong>Order Details:</strong> Products, sizes, colors, and order history.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">3. Delivery & Courier Sharing</h2>
          <p>
            Your delivery address and phone number are shared solely with our courier partners for parcel delivery. We do not sell or share your personal data with third parties for marketing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">4. Contact Us</h2>
          <p>
            For inquiries regarding your personal data, contact us at <strong>support@vyre.store</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};

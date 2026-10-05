import React from "react";
import { Breadcrumb } from "../components/common/Breadcrumb.js";

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-800">
      <Breadcrumb items={[{ label: "Terms & Conditions" }]} />

      <div className="border-b border-neutral-200 pb-4 space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Terms of Service
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold uppercase text-neutral-900 font-heading">
          Terms & Conditions
        </h1>
        <p className="text-xs text-neutral-500">Effective Date: January 1, 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-neutral-700">
        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">1. Overview</h2>
          <p>
            By purchasing from VYRE., you agree to these Terms and Conditions regarding orders, delivery, and returns across Egypt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">2. Pricing & Payments</h2>
          <p>
            All prices are in Egyptian Pounds (EGP). We currently provide Cash on Delivery (COD) for all domestic shipments.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">3. Shipping & Delivery</h2>
          <p>
            Delivery times are typically 24-48 hours for Cairo and Giza, and 2-4 business days for other governorates in Egypt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold uppercase text-neutral-900">
            4. 3 Days Returns & Exchanges
          </h2>
          <p>
            Unworn garments with original tags intact may be exchanged or returned within 3 days of delivery date via courier.
          </p>
        </section>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Modal } from "../ui/modal.js";
import { Sparkles } from "lucide-react";
import { cn } from "../../utils/cn.js";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  category = "hoodies-sweaters",
}) => {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [activeTab, setActiveTab] = useState<string>(
    category.toLowerCase().includes("jacket") ? "jackets" : "hoodies"
  );

  const measurements = {
    hoodies: {
      cm: [
        { size: "XS", chest: "108", length: "68", shoulder: "54", sleeve: "58" },
        { size: "S", chest: "114", length: "70", shoulder: "56", sleeve: "60" },
        { size: "M", chest: "120", length: "72", shoulder: "58", sleeve: "62" },
        { size: "L", chest: "126", length: "74", shoulder: "60", sleeve: "64" },
        { size: "XL", chest: "132", length: "76", shoulder: "62", sleeve: "65" },
        { size: "XXL", chest: "138", length: "78", shoulder: "64", sleeve: "66" },
      ],
      in: [
        { size: "XS", chest: "42.5", length: "26.8", shoulder: "21.2", sleeve: "22.8" },
        { size: "S", chest: "44.9", length: "27.5", shoulder: "22.0", sleeve: "23.6" },
        { size: "M", chest: "47.2", length: "28.3", shoulder: "22.8", sleeve: "24.4" },
        { size: "L", chest: "49.6", length: "29.1", shoulder: "23.6", sleeve: "25.2" },
        { size: "XL", chest: "52.0", length: "29.9", shoulder: "24.4", sleeve: "25.6" },
        { size: "XXL", chest: "54.3", length: "30.7", shoulder: "25.2", sleeve: "26.0" },
      ],
    },
    jackets: {
      cm: [
        { size: "S", chest: "116", length: "70", shoulder: "56", sleeve: "62" },
        { size: "M", chest: "122", length: "72", shoulder: "58", sleeve: "64" },
        { size: "L", chest: "128", length: "74", shoulder: "60", sleeve: "66" },
        { size: "XL", chest: "134", length: "76", shoulder: "62", sleeve: "67" },
      ],
      in: [
        { size: "S", chest: "45.6", length: "27.5", shoulder: "22.0", sleeve: "24.4" },
        { size: "M", chest: "48.0", length: "28.3", shoulder: "22.8", sleeve: "25.2" },
        { size: "L", chest: "50.4", length: "29.1", shoulder: "23.6", sleeve: "26.0" },
        { size: "XL", chest: "52.8", length: "29.9", shoulder: "24.4", sleeve: "26.4" },
      ],
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="VYRE. Sizing & Fit Guide"
      description="All VYRE garments are engineered with relaxed, modern architectural silhouettes."
      size="lg"
    >
      <div className="space-y-6 text-neutral-900">
        {/* Unit & Type Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          {/* Tab selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("hoodies")}
              className={cn(
                "px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors border",
                activeTab === "hoodies"
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
              )}
            >
              Hoodies & Sweaters
            </button>
            <button
              onClick={() => setActiveTab("jackets")}
              className={cn(
                "px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors border",
                activeTab === "jackets"
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
              )}
            >
              Jackets
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xs border border-neutral-200 text-xs">
            <button
              onClick={() => setUnit("cm")}
              className={cn(
                "px-2.5 py-1 rounded-xs font-bold font-mono transition-colors",
                unit === "cm" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              )}
            >
              CM
            </button>
            <button
              onClick={() => setUnit("in")}
              className={cn(
                "px-2.5 py-1 rounded-xs font-bold font-mono transition-colors",
                unit === "in" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              )}
            >
              INCHES
            </button>
          </div>
        </div>

        {/* Measurement Table */}
        <div className="overflow-x-auto rounded-sm border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase font-mono tracking-wider border-b border-neutral-200">
              <tr>
                <th className="p-3 font-bold text-neutral-900">Size</th>
                <th className="p-3">Chest Width</th>
                <th className="p-3">Body Length</th>
                <th className="p-3">Shoulder Drop</th>
                <th className="p-3">Sleeve Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono text-neutral-700">
              {(activeTab === "jackets" ? measurements.jackets[unit] : measurements.hoodies[unit]).map((row) => (
                <tr key={row.size} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-neutral-900 font-sans">{row.size}</td>
                  <td className="p-3">
                    {row.chest} {unit}
                  </td>
                  <td className="p-3">
                    {row.length} {unit}
                  </td>
                  <td className="p-3">
                    {row.shoulder} {unit}
                  </td>
                  <td className="p-3">
                    {row.sleeve} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fit Advice Banner */}
        <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-xs text-neutral-600">
          <div className="flex items-center gap-2 text-neutral-900 font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-black" />
            <span>Fit Recommendation</span>
          </div>
          <p>
            • For an intended <strong>signature oversized streetwear look</strong>, select your standard size.
          </p>
          <p>
            • If you prefer a <strong>more tailored or fitted look</strong>, we recommend sizing down one full size.
          </p>
          <p>
            • All garments have been pre-washed and treated in Cairo to eliminate future washing shrinkage.
          </p>
        </div>
      </div>
    </Modal>
  );
};

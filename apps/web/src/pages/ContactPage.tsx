import React, { useState } from "react";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Textarea } from "../components/ui/textarea.js";
import { Select } from "../components/ui/select.js";
import { MapPin, Mail, Clock, CheckCircle2, HelpCircle, Instagram } from "lucide-react";

export const ContactPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Order Inquiry");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setLoading(false);
    setSubmitted(true);
  };

  const faqs = [
    {
      q: "How fast is delivery inside Cairo & Giza?",
      a: "Orders placed before 2:00 PM are dispatched same-day and typically arrive within 24 to 48 hours.",
    },
    {
      q: "What is your exchange and return policy in Egypt?",
      a: "We offer 3 days for doorstep exchanges or returns. The courier will deliver your requested size and collect the current piece at your door.",
    },
    {
      q: "Are all VYRE. garments 100% Egyptian Cotton?",
      a: "Yes. Every piece is crafted with premium combed Egyptian long-staple cotton, strictly manufactured in Cairo.",
    },
    {
      q: "What payment methods are supported?",
      a: "We accept Cash on Delivery (COD) across all Egyptian governorates.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 text-neutral-900">
      <Breadcrumb items={[{ label: "Contact & Support" }]} />

      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Customer Care
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
          Get in Touch
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-xl">
          Have questions regarding orders, sizing, or product details? Our Cairo team is available 7 days a week.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Form */}
        <div className="lg:col-span-2 rounded-xs border border-neutral-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              Send Us a Message
            </h2>
            <p className="text-xs text-neutral-500">
              We respond promptly during business hours.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xs border border-emerald-200 bg-emerald-50 text-emerald-800 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold uppercase text-neutral-900">Message Sent</h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                Thank you, <strong>{name}</strong>. A VYRE. representative will contact you shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name *"
                  placeholder="e.g. Omar Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Egyptian Mobile Number"
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Select
                  label="Inquiry Subject *"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  options={[
                    { label: "Order & Tracking Inquiry", value: "Order Inquiry" },
                    { label: "Sizing & Fit Advice", value: "Sizing Advice" },
                    { label: "Exchanges & Returns", value: "Exchanges" },
                    { label: "General Feedback", value: "Feedback" },
                  ]}
                />
              </div>

              <Textarea
                label="Message *"
                rows={5}
                placeholder="How can our team assist you?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                isLoading={loading}
              >
                Submit Inquiry
              </Button>
            </form>
          )}
        </div>

        {/* Cairo Headquarters & Info */}
        <div className="space-y-6">
          <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-6 text-xs shadow-xs">
            <h3 className="font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-3">
              Cairo Office & Support
            </h3>

            <div className="space-y-4 text-neutral-700">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 block">Location:</strong>
                  <span>Cairo, Egypt</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 block">Email Support:</strong>
                  <span className="text-neutral-600">support@vyre.store</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 block">Operating Hours:</strong>
                  <span>Saturday – Thursday: 10:00 AM – 10:00 PM CLT</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <strong className="text-neutral-900 block mb-2">Official Channels:</strong>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.instagram.com/vyree.shop/?utm_source=ig_web_button_share_sheet"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-neutral-200 text-neutral-700 hover:text-black hover:border-black transition-colors"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://www.tiktok.com/@vyrrre.eg?is_from_webapp=1&sender_device=pc"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-neutral-200 text-neutral-700 hover:text-black hover:border-black transition-colors"
                  >
                    <svg
                      className="h-3.5 w-3.5 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.48V8.71a8.16 8.16 0 0 0 4.91 1.63v-3.65h-.01z" />
                    </svg>
                    <span>TikTok</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <section className="space-y-6 pt-8 border-t border-neutral-200">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            FAQ
          </p>
          <h2 className="text-2xl font-bold uppercase text-neutral-900 font-heading">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xs border border-neutral-200 bg-neutral-50 p-5 space-y-2"
            >
              <h4 className="text-xs font-bold uppercase text-neutral-900 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-black shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

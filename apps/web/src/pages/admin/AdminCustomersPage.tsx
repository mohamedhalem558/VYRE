import React, { useState, useEffect } from "react";
import { adminService } from "../../services/admin.service.js";
import { AdminCustomerDTO } from "@vyre/shared";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import {
  Search,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  RefreshCw,
  X,
} from "lucide-react";

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomerDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected customer for order history modal
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerDTO | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCustomers({
        page,
        limit: 15,
        search: search || undefined,
      });

      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  const handleToggleActive = async (cust: AdminCustomerDTO) => {
    try {
      const newStatus = await adminService.toggleCustomerStatus(cust.id);
      setCustomers((prev) =>
        prev.map((c) => (c.id === cust.id ? { ...c, active: newStatus } : c))
      );
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to update customer status.");
    }
  };

  const handleOpenCustomerOrders = async (cust: AdminCustomerDTO) => {
    setSelectedCustomer(cust);
    try {
      setLoadingOrders(true);
      const orders = await adminService.getCustomerOrders(cust.id);
      setCustomerOrders(orders || []);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
            Client Relations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            Customer Directory
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadCustomers}
          isLoading={loading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh Customers
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-sm">
        <form onSubmit={handleSearchSubmit} className="max-w-md">
          <Input
            placeholder="Search by name, email, Egyptian phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-neutral-500" />}
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="border border-neutral-800 rounded-sm bg-neutral-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Member Since</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-bold text-xs text-[#d4af37]">
                          {c.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {c.firstName} {c.lastName}
                          </p>
                          <span className="text-[10px] font-mono text-neutral-400">{c.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 font-mono text-neutral-300">
                      {c.phoneNumber || "No phone registered"}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-neutral-300">
                      {c.city ? `${c.city}, ${c.governorate}` : "Egypt"}
                    </td>

                    {/* Total Orders */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                    </td>

                    {/* Total Spent */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(c.totalSpent)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                          c.active
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/80"
                            : "bg-rose-950/40 text-rose-400 border border-rose-900"
                        }`}
                        title="Click to toggle customer account status"
                      >
                        {c.active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> DEACTIVATED
                          </>
                        )}
                      </button>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 font-mono text-neutral-400 text-[11px]">
                      {formatDate(c.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCustomerOrders(c)}
                        className="h-7 text-[10px] gap-1"
                      >
                        <ShoppingBag className="h-3 w-3" /> Orders
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-900 text-xs text-neutral-400">
            <span>
              Page {page} of {totalPages} ({total} total buyers)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {selectedCustomer.firstName} {selectedCustomer.lastName} • Order Dossier
                </h3>
                <p className="text-[11px] font-mono text-neutral-400">
                  {selectedCustomer.email} • Total Spent: {formatCurrency(selectedCustomer.totalSpent)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {loadingOrders ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  Loading order history...
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  This customer has not placed any orders yet.
                </div>
              ) : (
                customerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-sm border border-neutral-800 bg-neutral-900/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                      <span className="font-mono font-bold text-white">{ord.orderNumber}</span>
                      <Badge variant="gold">{ord.orderStatus}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-neutral-300">
                      <span>Items: {ord.items.length} garments</span>
                      <span className="font-mono font-bold text-white">
                        {formatCurrency(Number(ord.total))}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      Ordered: {formatDate(ord.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

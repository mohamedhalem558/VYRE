import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { orderService } from "../../services/order.service.js";
import { OrderDTO, OrderStatus } from "@vyre/shared";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import {
  Search,
  Filter,
  Eye,
  MapPin,
  X,
  RefreshCw,
  Printer,
} from "lucide-react";

export const AdminOrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("PENDING");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as OrderStatus) : undefined,
      });

      setOrders(res.orders || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (err) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleOpenOrder = (ord: OrderDTO) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setTrackingNumber(ord.trackingNumber || "");
    setEstimatedDelivery(ord.estimatedDelivery || "");
    setStatusNotes("");
    setStatusMessage("");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setIsUpdatingStatus(true);
      setStatusMessage("");
      const updated = await orderService.updateOrderStatus(selectedOrder.id, {
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
        notes: statusNotes || undefined,
      });

      setSelectedOrder(updated);
      setStatusMessage(`Order updated to ${newStatus} successfully.`);
      // Update local orders list
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to update order status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
            Fulfillment Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            Order Management
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          isLoading={loading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh Orders
        </Button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-800 rounded-sm">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <Input
            placeholder="Search by order #, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-neutral-500" />}
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
          {[
            "ALL",
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
          ].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-colors shrink-0 ${
                statusFilter === st
                  ? "bg-white text-black"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-neutral-800 rounded-sm bg-neutral-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Loading orders from database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-900/40 transition-colors">
                    {/* Order Number */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {ord.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-white truncate max-w-[150px]">
                        {ord.customerName}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[150px]">
                        {ord.customerEmail}
                      </p>
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-4 text-neutral-300">
                      <span>
                        {ord.shippingAddress.city}, {ord.shippingAddress.governorate}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatCurrency(ord.total)}
                    </td>

                    {/* Payment */}
                    <td className="py-3 px-4">
                      <span className="block text-[11px] font-medium text-white uppercase">
                        {ord.paymentMethod.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          ord.paymentStatus === "PAID"
                            ? "text-emerald-400"
                            : ord.paymentStatus === "REFUNDED"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          ord.orderStatus === "DELIVERED"
                            ? "success"
                            : ord.orderStatus === "CONFIRMED"
                            ? "gold"
                            : ord.orderStatus === "CANCELLED"
                            ? "destructive"
                            : ord.orderStatus === "PENDING"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {ord.orderStatus}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-neutral-400 text-[11px]">
                      {formatDate(ord.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenOrder(ord)}
                        className="h-7 text-[10px] gap-1"
                      >
                        <Eye className="h-3 w-3" /> Inspect
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
              Showing page {page} of {totalPages} ({total} total orders)
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

      {/* Order Details & Status Changer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white font-mono">
                  {selectedOrder.orderNumber}
                </span>
                <Badge variant="gold">{selectedOrder.orderStatus}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                  className="h-8"
                >
                  Print
                </Button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {statusMessage && (
                <div className="p-3 rounded-xs border border-emerald-900 bg-emerald-950/40 text-emerald-300 text-xs font-semibold">
                  ✓ {statusMessage}
                </div>
              )}

              {/* Status Update Control Box */}
              <form
                onSubmit={handleUpdateStatus}
                className="p-4 rounded-sm border border-neutral-800 bg-neutral-900/50 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                  Fulfillment Status Control
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-neutral-300">Set Order Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xs text-xs text-white p-2 outline-none focus:border-[#d4af37]"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING (In Atelier)</option>
                      <option value="SHIPPED">SHIPPED (With Courier)</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="RETURNED">RETURNED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>

                  <Input
                    label="Courier Tracking Code"
                    placeholder="e.g. BOSTA-98213"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />

                  <Input
                    label="Estimated Delivery Window"
                    placeholder="e.g. Tomorrow by 6:00 PM"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Input
                    placeholder="Admin status update note (optional)..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="flex-1 mr-3"
                  />
                  <Button type="submit" variant="gold" size="sm" isLoading={isUpdatingStatus}>
                    Update Status
                  </Button>
                </div>
              </form>

              {/* Garments in this Order */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
                  Garments ({selectedOrder.items.length})
                </h4>

                <div className="divide-y divide-neutral-900">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
                      <img
                        src={
                          item.productImage ||
                          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop"
                        }
                        alt=""
                        className="h-14 w-12 object-cover rounded-xs border border-neutral-800 bg-neutral-900 shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-white uppercase truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          Size: {item.sizeName} • Color: {item.colorName} • SKU: {item.sku}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          {formatCurrency(item.unitPrice)} × {item.quantity} units
                        </p>
                      </div>
                      <span className="font-mono font-black text-white text-xs">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-sm border border-neutral-800 bg-neutral-900/40 space-y-2">
                  <h5 className="font-bold uppercase text-white flex items-center gap-1.5 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-[#d4af37]" />
                    Delivery Destination
                  </h5>
                  <p className="text-white font-bold">{selectedOrder.shippingAddress.fullName}</p>
                  <p className="text-neutral-300">
                    {selectedOrder.shippingAddress.streetAddress}
                    {selectedOrder.shippingAddress.buildingNumber &&
                      `, Building ${selectedOrder.shippingAddress.buildingNumber}`}
                    {selectedOrder.shippingAddress.apartmentNumber &&
                      `, Apt ${selectedOrder.shippingAddress.apartmentNumber}`}
                  </p>
                  <p className="text-neutral-300">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.governorate},{" "}
                    Egypt
                  </p>
                  <p className="font-mono text-neutral-400">
                    Phone: {selectedOrder.shippingAddress.phoneNumber}
                  </p>
                </div>

                <div className="p-4 rounded-sm border border-neutral-800 bg-neutral-900/40 space-y-2">
                  <h5 className="font-bold uppercase text-white text-[11px]">Financial Summary</h5>
                  <div className="space-y-1 text-[11px] text-neutral-400">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-white">
                        {formatCurrency(selectedOrder.subtotal)}
                      </span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount:</span>
                        <span className="font-mono">-{formatCurrency(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping ({selectedOrder.shippingAddress.governorate}):</span>
                      <span className="font-mono text-white">
                        {selectedOrder.shippingFee === 0
                          ? "FREE"
                          : formatCurrency(selectedOrder.shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-800 pt-1.5 text-xs font-bold text-white">
                      <span>Total Amount:</span>
                      <span className="font-mono text-[#d4af37]">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

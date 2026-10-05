import React, { useState, useEffect } from "react";
import { adminService } from "../../services/admin.service.js";
import { useAuth } from "../../context/AuthContext.js";
import { AdminUserDTO } from "@vyre/shared";
import { formatDate } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Shield,
  AlertTriangle,
  Check,
} from "lucide-react";

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Role Edit & Confirmation Modal
  const [selectedUser, setSelectedUser] = useState<AdminUserDTO | null>(null);
  const [newRole, setNewRole] = useState<string>("CUSTOMER");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        page,
        limit: 15,
        search: search || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
      });

      setUsers(res.users || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setToast({
        type: "error",
        text: err?.response?.data?.error || err.message || "Failed to load users.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleActive = async (u: AdminUserDTO) => {
    if (u.id === currentAdmin?.id) {
      setToast({
        type: "error",
        text: "You cannot deactivate your own administrative account.",
      });
      return;
    }

    try {
      const newStatus = await adminService.toggleUserStatus(u.id);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, active: newStatus } : item))
      );
      setToast({
        type: "success",
        text: `Account for ${u.firstName} ${u.lastName} is now ${newStatus ? "ACTIVE" : "INACTIVE"}.`,
      });
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.error || err.message || "Failed to update user status.",
      });
    }
  };

  const handleOpenRoleModal = (u: AdminUserDTO) => {
    if (u.id === currentAdmin?.id) {
      setToast({
        type: "error",
        text: "Administrators cannot modify their own role (self-protection enforced).",
      });
      return;
    }

    setSelectedUser(u);
    setNewRole(u.role);
    setShowConfirm(false);
    setErrorMsg("");
  };

  const handleRoleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setNewRole(selected);
    setErrorMsg("");
    // If different from current role, prompt confirmation
    if (selectedUser && selected !== selectedUser.role) {
      setShowConfirm(true);
    } else {
      setShowConfirm(false);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.id === currentAdmin?.id) {
      setErrorMsg("You cannot modify your own administrator role.");
      return;
    }

    if (newRole === selectedUser.role) {
      setSelectedUser(null);
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMsg("");
      const updated = await adminService.updateUserRole(selectedUser.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setToast({
        type: "success",
        text: `Successfully updated ${selectedUser.firstName} ${selectedUser.lastName}'s role to ${newRole}.`,
      });
      setSelectedUser(null);
      setShowConfirm(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err.message || "Failed to change role.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-neutral-100">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`p-4 rounded-sm border flex items-center justify-between text-xs font-semibold shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : "bg-rose-950/80 border-rose-800 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-neutral-400 hover:text-white ml-4"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
            RBAC Access Controls
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            User Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage registered accounts, permissions, and security roles across the VYRE platform.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          isLoading={loading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh Users
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-800 rounded-sm">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <Input
            placeholder="Search by name, email, Egyptian phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-neutral-500" />}
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "CUSTOMER", "ADMIN", "INVENTORY_MANAGER", "MARKETING_MANAGER"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRoleFilter(r);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-colors shrink-0 ${
                roleFilter === r
                  ? "bg-white text-black"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {r.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-neutral-800 rounded-sm bg-neutral-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
                      <span>Loading registered users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentAdmin?.id;

                  return (
                    <tr key={u.id} className="hover:bg-neutral-900/40 transition-colors">
                      {/* 1. Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-bold text-xs text-[#d4af37] shrink-0">
                            {u.firstName?.[0] || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white">
                                {u.firstName} {u.lastName}
                              </p>
                              {isSelf && (
                                <span className="text-[9px] font-mono font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 px-1 py-0.2 rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            {u.phoneNumber && (
                              <span className="text-[10px] font-mono text-neutral-400">
                                {u.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Email */}
                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        {u.email}
                      </td>

                      {/* 3. Current Role */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            u.role === "ADMIN"
                              ? "gold"
                              : u.role === "INVENTORY_MANAGER"
                              ? "secondary"
                              : u.role === "MARKETING_MANAGER"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {u.role.replace(/_/g, " ")}
                        </Badge>
                      </td>

                      {/* 4. Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-colors ${
                            u.active
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/60"
                              : "bg-rose-950/40 text-rose-400 border border-rose-900 hover:bg-rose-900/40"
                          } ${isSelf ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                          title={
                            isSelf
                              ? "You cannot deactivate your own administrative account"
                              : "Click to toggle user status"
                          }
                        >
                          {u.active ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> ACTIVE
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> INACTIVE
                            </>
                          )}
                        </button>
                      </td>

                      {/* 5. Created At */}
                      <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isSelf ? (
                          <span
                            className="text-[10px] font-mono text-neutral-500 italic px-2 py-1"
                            title="Administrators cannot modify their own role"
                          >
                            Protected (Self)
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRoleModal(u)}
                            className="h-7 text-[10px] gap-1 hover:border-[#d4af37] hover:text-[#d4af37]"
                          >
                            <Shield className="h-3 w-3" /> Change Role
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-900 text-xs text-neutral-400">
            <span>
              Page {page} of {totalPages} ({total} total users)
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

      {/* Role Modifier & Confirmation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-sm p-6 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#d4af37]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Change User Role
                </h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xs border border-rose-900 bg-rose-950/40 text-rose-300 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* User Target Info */}
            <div className="p-3 rounded-xs bg-neutral-900/60 border border-neutral-800 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">User:</span>
                <span className="font-bold text-white">
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Email:</span>
                <span className="font-mono text-neutral-300">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Current Role:</span>
                <Badge
                  variant={
                    selectedUser.role === "ADMIN"
                      ? "gold"
                      : selectedUser.role === "INVENTORY_MANAGER"
                      ? "secondary"
                      : selectedUser.role === "MARKETING_MANAGER"
                      ? "outline"
                      : "secondary"
                  }
                >
                  {selectedUser.role.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            {/* Role Selection Form */}
            <form onSubmit={handleSaveRole} className="space-y-4 pt-1">
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-neutral-300 uppercase tracking-wider">
                  Select New Role
                </label>
                <select
                  value={newRole}
                  onChange={handleRoleSelect}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xs text-xs text-white p-2.5 outline-none focus:border-[#d4af37]"
                >
                  <option value="CUSTOMER">CUSTOMER (Storefront Buyer)</option>
                  <option value="INVENTORY_MANAGER">
                    INVENTORY_MANAGER (Stock & Warehousing)
                  </option>
                  <option value="MARKETING_MANAGER">
                    MARKETING_MANAGER (Promotions & Coupons)
                  </option>
                  <option value="ADMIN">ADMIN (Full Platform Authority)</option>
                </select>
              </div>

              {/* Confirmation Dialog Box */}
              {showConfirm && newRole !== selectedUser.role && (
                <div className="p-3.5 rounded-xs border border-amber-800/80 bg-amber-950/30 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-300 text-[11px]">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Confirmation Required</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Are you sure you want to change this user's role from{" "}
                    <strong className="text-white underline">{selectedUser.role}</strong> to{" "}
                    <strong className="text-[#d4af37] underline">{newRole}</strong>?
                  </p>
                  <p className="text-[10px] text-amber-400/80">
                    The change will be saved directly to PostgreSQL. Their platform permissions will update immediately.
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  isLoading={isUpdating}
                  disabled={newRole === selectedUser.role}
                >
                  {showConfirm ? "Confirm Role Change" : "Apply Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

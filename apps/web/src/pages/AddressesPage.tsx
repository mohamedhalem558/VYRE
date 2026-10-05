import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { EGYPT_GOVERNORATES } from "../services/mockData.js";
import { Address } from "@vyre/shared";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Select } from "../components/ui/select.js";
import { Modal } from "../components/ui/modal.js";
import { Plus, Trash2, Edit3 } from "lucide-react";

export const AddressesPage: React.FC = () => {
  const { user, saveAddress, deleteAddress } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [city, setCity] = useState("Maadi");
  const [governorate, setGovernorate] = useState("Cairo");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setFullName(user ? `${user.firstName} ${user.lastName}` : "");
    setPhoneNumber(user?.phoneNumber || "");
    setStreetAddress("");
    setBuildingNumber("");
    setApartmentNumber("");
    setCity("Maadi");
    setGovernorate("Cairo");
    setIsDefault(user?.addresses.length === 0);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingId(addr.id);
    setFullName(addr.fullName);
    setPhoneNumber(addr.phoneNumber);
    setStreetAddress(addr.streetAddress);
    setBuildingNumber(addr.buildingNumber || "");
    setApartmentNumber(addr.apartmentNumber || "");
    setCity(addr.city);
    setGovernorate(addr.governorate);
    setIsDefault(addr.isDefault);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveAddress({
        id: editingId || undefined,
        fullName,
        phoneNumber,
        streetAddress,
        buildingNumber,
        apartmentNumber,
        city,
        governorate,
        isDefault,
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      await deleteAddress(id);
    }
  };

  return (
    <div className="space-y-6 text-neutral-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900">
            Shipping Addresses
          </h2>
          <p className="text-xs text-neutral-500">
            Manage your delivery destinations across Egypt.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add New Address
        </Button>
      </div>

      {user?.addresses.length === 0 ? (
        <div className="rounded-xs border border-neutral-200 bg-neutral-50 p-8 text-center space-y-3">
          <p className="text-xs text-neutral-500">You don't have any saved shipping addresses.</p>
          <Button variant="primary" size="sm" onClick={openAddModal}>
            Add First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user?.addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-xs border border-neutral-200 bg-white p-5 space-y-4 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-900">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase rounded-xs">
                      Default
                    </span>
                  )}
                </div>

                <div className="text-xs text-neutral-600 space-y-1">
                  <p>{addr.streetAddress}</p>
                  {(addr.buildingNumber || addr.apartmentNumber) && (
                    <p>
                      {addr.buildingNumber ? `Bldg ${addr.buildingNumber}` : ""}
                      {addr.apartmentNumber ? `, Apt ${addr.apartmentNumber}` : ""}
                    </p>
                  )}
                  <p>
                    {addr.city}, {addr.governorate}, Egypt
                  </p>
                  <p className="font-mono text-neutral-500 pt-1">{addr.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(addr)}
                  leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(addr.id)}
                  className="text-neutral-500 hover:text-rose-600 hover:border-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Shipping Address" : "Add New Address"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <Input
            label="Full Recipient Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Mobile Phone Number *"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Governorate *"
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              options={EGYPT_GOVERNORATES.map((g) => ({ value: g, label: g }))}
            />
            <Input
              label="City / District *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <Input
            label="Street Address *"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Building No."
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
            />
            <Input
              label="Apartment / Floor"
              value={apartmentNumber}
              onChange={(e) => setApartmentNumber(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-neutral-300 text-black accent-black"
            />
            <span>Set as my default delivery address</span>
          </label>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={loading}>
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

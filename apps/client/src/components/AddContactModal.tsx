import { useState } from "react";
import { Modal, Button } from "@/components";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded?: (contact: any) => void;
  companyId?: string | number;
  addressId?: string | number;
}

export const AddContactModal = ({ 
  isOpen, 
  onClose, 
  onContactAdded,
  companyId,
  addressId 
}: AddContactModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    Company_ID: companyId || "",
    Address_ID: addressId || "",
    FirstName: "",
    LastName: "",
    Type: "",
    Notes: "",
    PhoneNumber: "",
    PhoneExt: "",
    FaxPhoneNum: "",
    Email: "",
    Website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/legacy/std/Contacts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const newContact = await response.json();
        
        // Reset form
        setFormData({
          Company_ID: companyId || "",
          Address_ID: addressId || "",
          FirstName: "",
          LastName: "",
          Type: "",
          Notes: "",
          PhoneNumber: "",
          PhoneExt: "",
          FaxPhoneNum: "",
          Email: "",
          Website: "",
        });

        // Notify parent component
        if (onContactAdded) {
          onContactAdded(newContact);
        }

        onClose();
      } else {
        const errorText = await response.text();
        console.error("Failed to create contact:", response.status, errorText);
        alert("Failed to create contact. Please try again.");
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Error creating contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      Company_ID: companyId || "",
      Address_ID: addressId || "",
      FirstName: "",
      LastName: "",
      Type: "",
      Notes: "",
      PhoneNumber: "",
      PhoneExt: "",
      FaxPhoneNum: "",
      Email: "",
      Website: "",
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add New Contact"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.FirstName}
              onChange={(e) => setFormData(prev => ({ ...prev, FirstName: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.LastName}
              onChange={(e) => setFormData(prev => ({ ...prev, LastName: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={25}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Contact Type
            </label>
            <select
              value={formData.Type}
              onChange={(e) => setFormData(prev => ({ ...prev, Type: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Select Type</option>
              <option value="A">Administrative</option>
              <option value="E">Engineering</option>
              <option value="S">Sales</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Company ID
            </label>
            <input
              type="number"
              value={formData.Company_ID}
              onChange={(e) => setFormData(prev => ({ ...prev, Company_ID: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.Email}
              onChange={(e) => setFormData(prev => ({ ...prev, Email: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.PhoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, PhoneNumber: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={20}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Phone Extension
            </label>
            <input
              type="text"
              value={formData.PhoneExt}
              onChange={(e) => setFormData(prev => ({ ...prev, PhoneExt: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Fax Number
            </label>
            <input
              type="text"
              value={formData.FaxPhoneNum}
              onChange={(e) => setFormData(prev => ({ ...prev, FaxPhoneNum: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={20}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.Website}
              onChange={(e) => setFormData(prev => ({ ...prev, Website: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Address ID
            </label>
            <input
              type="number"
              value={formData.Address_ID}
              onChange={(e) => setFormData(prev => ({ ...prev, Address_ID: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Notes
          </label>
          <textarea
            value={formData.Notes}
            onChange={(e) => setFormData(prev => ({ ...prev, Notes: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            maxLength={30}
            rows={3}
            placeholder="Notes (max 30 characters)"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary-outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300 h-max px-3 py-1.5 border-primary bg-primary text-foreground hover:bg-primary/80 hover:border-primary/80 cursor-pointer disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
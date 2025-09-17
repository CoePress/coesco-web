import { useState } from "react";
import { Modal, Button } from "@/components";
import { generateUniqueId } from "@/utils/unique-id-generator";

interface AddJourneyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded?: (contact: any) => void;
  journeyId: string | number;
  isFirstContact?: boolean;
}


export const AddJourneyContactModal = ({ 
  isOpen, 
  onClose, 
  onContactAdded,
  journeyId,
  isFirstContact = false
}: AddJourneyContactModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    Contact_Name: "",
    Contact_Email: "",
    Contact_Office: "",
    Contact_Mobile: "",
    Contact_Position: "",
    Contact_Note: "",
    IsPrimary: isFirstContact,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate unique ID for the Journey_Contact
      const uniqueId = await generateUniqueId("Journey_Contact", "ID", "std");
      
      const now = new Date();
      const formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
      
      const journeyContactData = {
        ID: uniqueId,
        Jrn_ID: journeyId,
        Contact_Name: formData.Contact_Name,
        Contact_Email: formData.Contact_Email,
        Contact_Office: formData.Contact_Office,
        Contact_Mobile: formData.Contact_Mobile,
        Contact_Position: formData.Contact_Position,
        Contact_Note: formData.Contact_Note,
        CreateDtTm: formattedDate,
        IsPrimary: formData.IsPrimary ? 1 : 0,
      };

      const response = await fetch(
        "http://localhost:8080/api/legacy/std/Journey_Contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(journeyContactData),
        }
      );

      if (response.ok) {
        const apiResponse = await response.json();
        
        // Reset form
        setFormData({
          Contact_Name: "",
          Contact_Email: "",
          Contact_Office: "",
          Contact_Mobile: "",
          Contact_Position: "",
          Contact_Note: "",
          IsPrimary: false,
        });

        // Notify parent component with the data we sent (since API just returns true)
        if (onContactAdded) {
          onContactAdded(journeyContactData);
        }

        onClose();
      } else {
        const errorText = await response.text();
        console.error("Failed to create journey contact:", response.status, errorText);
        alert("Failed to create contact. Please try again.");
      }
    } catch (error) {
      console.error("Error creating journey contact:", error);
      alert("Error creating contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      Contact_Name: "",
      Contact_Email: "",
      Contact_Office: "",
      Contact_Mobile: "",
      Contact_Position: "",
      Contact_Note: "",
      IsPrimary: isFirstContact,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add Journey Contact"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Contact Name *
          </label>
          <input
            type="text"
            value={formData.Contact_Name}
            onChange={(e) => setFormData(prev => ({ ...prev, Contact_Name: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            maxLength={50}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.Contact_Email}
              onChange={(e) => setFormData(prev => ({ ...prev, Contact_Email: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Position
            </label>
            <input
              type="text"
              value={formData.Contact_Position}
              onChange={(e) => setFormData(prev => ({ ...prev, Contact_Position: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={50}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Office Phone
            </label>
            <input
              type="text"
              value={formData.Contact_Office}
              onChange={(e) => setFormData(prev => ({ ...prev, Contact_Office: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Mobile Phone
            </label>
            <input
              type="text"
              value={formData.Contact_Mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, Contact_Mobile: e.target.value }))}
              className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              maxLength={30}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Notes
          </label>
          <textarea
            value={formData.Contact_Note}
            onChange={(e) => setFormData(prev => ({ ...prev, Contact_Note: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            maxLength={500}
            rows={5}
            placeholder="Additional notes about this contact..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPrimary"
            checked={formData.IsPrimary}
            onChange={(e) => setFormData(prev => ({ ...prev, IsPrimary: e.target.checked }))}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label
            htmlFor="isPrimary"
            className="text-sm text-text-muted"
          >
            Set as Primary Contact
          </label>
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
            disabled={isSubmitting || !formData.Contact_Name.trim()}
            className="border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300 h-max px-3 py-1.5 border-primary bg-primary text-foreground hover:bg-primary/80 hover:border-primary/80 cursor-pointer disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Add Contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
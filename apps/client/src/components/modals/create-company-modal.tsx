import { useState } from "react";
import { Modal, Button } from "@/components";
import { useApi } from "@/hooks/use-api";

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated?: (company: any) => void;
}

export const CreateCompanyModal = ({ 
  isOpen, 
  onClose, 
  onCompanyCreated
}: CreateCompanyModalProps) => {
  const { post, loading } = useApi();
  const [formData, setFormData] = useState({
    CustDlrName: "",
    IsDealer: false,
    Notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      Active: 1,
      IsDealer: formData.IsDealer ? 1 : 0
    };


    try {
      const newCompany = await post("/legacy/std/Company", submitData);

      if (newCompany) {
        setFormData({
          CustDlrName: "",
          IsDealer: false,
          Notes: "",
        });

        if (onCompanyCreated) {
          onCompanyCreated(newCompany);
        }

        onClose();
      } else {
        alert('Failed to create company. Please try again.');
      }
    } catch (error) {
      alert('Error creating company. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      CustDlrName: "",
      IsDealer: false,
      Notes: "",
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Create New Company (Disabled due to AX)"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={formData.CustDlrName}
            onChange={(e) => setFormData(prev => ({ ...prev, CustDlrName: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            maxLength={30}
            required
            placeholder="Enter company name (max 30 characters)"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <input
              type="checkbox"
              checked={formData.IsDealer}
              onChange={(e) => setFormData(prev => ({ ...prev, IsDealer: e.target.checked }))}
              className="rounded border border-border focus:ring-1 focus:ring-primary"
            />
            Is Dealer
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Notes
          </label>
          <textarea
            value={formData.Notes}
            onChange={(e) => setFormData(prev => ({ ...prev, Notes: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            maxLength={500}
            rows={4}
            placeholder="Notes about the company (max 500 characters)"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary-outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button disabled
            type="submit"
          >
            {loading ? "Creating..." : "Create Company"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
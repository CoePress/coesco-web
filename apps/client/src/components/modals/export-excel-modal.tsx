import { useState } from "react";
import { Download } from "lucide-react";
import { Modal, Button } from "@/components";

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: { includePrimaryContactOnly: boolean }) => void;
}

export const ExportExcelModal = ({
  isOpen,
  onClose,
  onExport
}: ExportExcelModalProps) => {
  const [includePrimaryContactOnly, setIncludePrimaryContactOnly] = useState(true);

  const handleExport = () => {
    onExport({ includePrimaryContactOnly });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Pipeline to Excel"
      size="sm"
    >
      <div className="space-y-4">
        <div className="text-sm text-text-muted">
          Configure your export options below:
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includePrimaryContactOnly}
              onChange={(e) => setIncludePrimaryContactOnly(e.target.checked)}
              className="rounded border-border"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text">
                Include only primary contact
              </span>
              <span className="text-xs text-text-muted">
                Only the primary contact for each journey will be included in the export
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="secondary-outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Export to Excel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
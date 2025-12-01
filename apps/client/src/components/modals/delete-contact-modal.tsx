import { Button, Modal } from "@/components";
import { ContactType } from "@/types/enums";

interface DeleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: ContactType) => void;
  contact: any;
  isUpdating?: boolean;
}

export function DeleteContactModal({
  isOpen,
  onClose,
  onConfirm,
  contact,
  isUpdating = false,
}: DeleteContactModalProps) {
  const contactName = `${contact?.FirstName || ""} ${contact?.LastName || ""}`.trim() || "Unnamed Contact";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disable Contact"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-text">
          Choose the status for
          {" "}
          <strong>{contactName}</strong>
          :
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => onConfirm(ContactType.Inactive)}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? "Updating..." : "Mark as Inactive"}
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => onConfirm(ContactType.Left_Company)}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? "Updating..." : "Mark as Left Company"}
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={onClose}
            disabled={isUpdating}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

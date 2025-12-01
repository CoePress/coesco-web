import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Modal } from "@/components";
import { useAuth } from "@/contexts/auth.context";
import { useApi } from "@/hooks/use-api";

interface AddTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyId: string;
  onTagsUpdated?: () => void;
}

export function AddTagsModal({
  isOpen,
  onClose,
  journeyId,
  onTagsUpdated,
}: AddTagsModalProps) {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const api = useApi();
  const { employee } = useAuth();

  useEffect(() => {
    if (isOpen && journeyId) {
      fetchTags();
    }
  }, [isOpen, journeyId]);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const tagData = await api.get("/core/tags", {
        filter: JSON.stringify({
          parentTable: "journeys",
          parentId: journeyId,
        }),
      });

      if (tagData?.success && Array.isArray(tagData.data)) {
        setTags(tagData.data);
      }
      else {
        setTags([]);
      }
    }
    catch (error) {
      console.error("Error fetching tags:", error);
      setTags([]);
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    if (!newTagInput.trim())
      return;

    const tagDescription = newTagInput.trim().toUpperCase();

    // Check if tag already exists
    const existingTag = tags.find(tag =>
      tag.description.toUpperCase() === tagDescription,
    );

    if (existingTag) {
      setErrorMessage(`Tag "${tagDescription}" already exists`);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const newTag = await api.post("/core/tags", {
        description: tagDescription,
        parentTable: "journeys",
        parentId: journeyId,
        createdBy: employee?.initials || "unknown",
      });

      if (newTag?.success && newTag.data) {
        setTags(prev => [...prev, newTag.data]);
        setNewTagInput("");
        onTagsUpdated?.();
      }
      else {
        setErrorMessage("Failed to add tag. Please try again.");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }
    catch (error) {
      console.error("Error adding tag:", error);
      setErrorMessage("Failed to add tag. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const success = await api.delete(`/core/tags/${tagId}`);

      if (success !== null) {
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        onTagsUpdated?.();
      }
    }
    catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Journey Tags"
      size="md"
      backdropClosable={true}
    >
      <div className="space-y-4">
        {/* Existing Tags */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">
            Current Tags
          </label>

          {isLoading
            ? (
                <div className="text-sm text-text-muted">Loading tags...</div>
              )
            : tags.length > 0
              ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <div
                        key={tag.id}
                        className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag.description}
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-white/80 hover:text-white transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              : (
                  <div className="text-sm text-text-muted">No tags yet</div>
                )}
        </div>

        {/* Add New Tag */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">
            Add New Tag
          </label>
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              placeholder="Enter tag name..."
              className="flex-1 rounded border border-border px-3 py-2 text-sm bg-background text-text"
              disabled={isSaving}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving || !newTagInput.trim()}
              onClick={handleAddTag}
            >
              {isSaving ? "Adding..." : "Add"}
            </Button>
          </form>
          {errorMessage && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { useState } from "react";

interface UseEditModeOptions<T, ID = number | string | boolean | null> {
  onSave: (id: ID | null, data: T) => Promise<any>;
  onSuccess?: (result: any, id: ID | null) => void;
  onError?: (error: any) => void;
}

interface UseEditModeReturn<T, ID = number | string | boolean | null> {
  isEditing: boolean;
  editingId: ID | null;
  editData: T;
  startEdit: (id: ID | null, data: T) => void;
  updateField: (field: string, value: any) => void;
  save: () => Promise<void>;
  cancel: () => void;
  isSaving: boolean;
}

export function useEditMode<T extends Record<string, any>, ID = number | string | boolean | null>(
  options: UseEditModeOptions<T, ID>,
): UseEditModeReturn<T, ID> {
  const { onSave, onSuccess, onError } = options;

  const [editingId, setEditingId] = useState<ID | null>(null);
  const [editData, setEditData] = useState<T>({} as T);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = editingId !== null;

  const startEdit = (id: ID | null, data: T) => {
    setEditingId(id);
    setEditData({ ...data });
  };

  const updateField = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    if (!isEditing)
      return;

    try {
      setIsSaving(true);
      const result = await onSave(editingId, editData);

      if (onSuccess) {
        onSuccess(result, editingId);
      }

      setEditingId(null);
      setEditData({} as T);
    }
    catch (error) {
      if (onError) {
        onError(error);
      }
      else {
        console.error("Error saving:", error);
      }
    }
    finally {
      setIsSaving(false);
    }
  };

  const cancel = () => {
    setEditingId(null);
    setEditData({} as T);
  };

  return {
    isEditing,
    editingId,
    editData,
    startEdit,
    updateField,
    save,
    cancel,
    isSaving,
  };
}

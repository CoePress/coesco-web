import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";

interface Field {
  id: string;
  label: string;
  variable: string;
  controlType: string;
  dataType: string;
  isRequired: boolean;
  isReadOnly: boolean;
  isHiddenOnDevice: boolean;
  isHiddenOnReport: boolean;
  sequence: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  sequence: number;
  fields: Field[];
}

interface Page {
  id: string;
  title: string;
  sequence: number;
  sections: Section[];
}

interface Form {
  id: string;
  name: string;
  description?: string;
  status: string;
  pages: Page[];
}

const controlTypes = [
  { value: "INPUT", label: "Input" },
  { value: "TEXTBOX", label: "Text Box" },
  { value: "TEXT_AREA", label: "Text Area" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "RADIO_BUTTON", label: "Radio Button" },
  { value: "MULTI_SELECT", label: "Multi Select" },
  { value: "BUTTON_GROUP", label: "Button Group" },
  { value: "DATE_SELECTOR", label: "Date Selector" },
  { value: "TIME_SELECTOR", label: "Time Selector" },
  { value: "GEO_LOCATION", label: "GPS Location" },
  { value: "STAMP", label: "Stamp" },
  { value: "SKETCH_PAD", label: "Sketch Pad" },
  { value: "CAMERA", label: "Camera" },
  { value: "SIGNATURE_PAD", label: "Signature Pad" },
];

const dataTypes = [
  { value: "TEXT", label: "Text" },
  { value: "EMAIL", label: "Email" },
  { value: "EMAIL_ADDRESS", label: "Email Address" },
  { value: "URL", label: "URL" },
  { value: "PHONE_NUMBER", label: "Phone Number" },
  { value: "INTEGER", label: "Integer" },
  { value: "DECIMAL", label: "Decimal" },
  { value: "CURRENCY", label: "Currency" },
  { value: "DATE", label: "Date" },
  { value: "TIME", label: "Time" },
  { value: "DATE_TIME", label: "Date/Time" },
  { value: "GEO_LOCATION", label: "GPS Location" },
  { value: "IMAGE", label: "Image" },
  { value: "SIGNATURE", label: "Signature" },
];

const FormBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { get, patch, post, delete: del } = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Form | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "page" | "section" | "field";
    id: string;
    parentIds?: { pageId?: string; sectionId?: string };
    title: string;
  } | null>(null);

  const include = useMemo(() => ["pages.sections.fields"], []);

  const fetchForm = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const response = await get(
      `/forms/${id}?include=${JSON.stringify(include)}`
    );

    if (response.data?.success && response.data.data) {
      const data = response.data.data as Form;
      setFormData(data);
      const pagesData =
        data.pages?.map((page) => ({
          ...page,
          sections:
            page.sections?.map((section) => ({
              ...section,
              fields: section.fields || [],
            })) || [],
        })) || [];
      setPages(pagesData.sort((a, b) => a.sequence - b.sequence));

      const pageParam = searchParams.get("page");
      if (pageParam && pagesData.find((p) => p.id === pageParam)) {
        setSelectedPageId(pageParam);
      } else if (pagesData.length > 0) {
        const lowestSequencePage = pagesData.reduce(
          (min, page) => (page.sequence < min.sequence ? page : min),
          pagesData[0]
        );
        setSelectedPageId(lowestSequencePage.id);
        setSearchParams({ page: lowestSequencePage.id });
      }
    } else {
      setError(response.error || "Failed to fetch form");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchForm();
  }, [id]);

  const handleSave = async () => {
    if (!id || !formData) return;

    setSaving(true);
    setError(null);

    try {
      await patch(`/forms/${id}`, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });

      for (const page of pages) {
        await patch(`/forms/${id}/pages/${page.id}`, {
          title: page.title,
          sequence: page.sequence,
        });

        for (const section of page.sections || []) {
          await patch(`/forms/${id}/pages/${page.id}/sections/${section.id}`, {
            title: section.title,
            description: section.description,
          });

          if (section.fields && section.fields.length > 0) {
            const sortedFields = [...section.fields].sort(
              (a, b) => a.sequence - b.sequence
            );
            for (let i = 0; i < sortedFields.length; i++) {
              const field = sortedFields[i];
              await patch(
                `/forms/${id}/pages/${page.id}/sections/${section.id}/fields/${field.id}`,
                {
                  label: field.label,
                  variable: field.variable,
                  controlType: field.controlType,
                  dataType: field.dataType,
                  isRequired: field.isRequired,
                  isReadOnly: field.isReadOnly,
                  isHiddenOnDevice: field.isHiddenOnDevice,
                  isHiddenOnReport: field.isHiddenOnReport,
                  sequence: i + 1,
                }
              );
            }
          }
        }
      }

      navigate(`/forms/${id}`);
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const addPage = async () => {
    if (!id) return;

    const maxSequence =
      pages.length > 0 ? Math.max(...pages.map((p) => p.sequence ?? 0)) : 0;

    const response = await post(`/forms/${id}/pages`, {
      title: "New Page",
      sequence: maxSequence + 1,
    });

    if (response.data?.success) {
      const newPage = {
        ...response.data.data,
        sections: [],
      };
      setPages([...pages, newPage]);
      setSelectedPageId(newPage.id);
      setSearchParams({ page: newPage.id });
    } else {
      setError(response.error || "Failed to create page");
    }
  };

  const removePage = async (pageId: string) => {
    if (!id) return;

    const response = await del(`/forms/${id}/pages/${pageId}`);

    if (response.data?.success || response.error === null) {
      const remainingPages = pages.filter((page) => page.id !== pageId);
      setPages(remainingPages);

      if (selectedPageId === pageId && remainingPages.length > 0) {
        const firstPage = remainingPages.sort(
          (a, b) => a.sequence - b.sequence
        )[0];
        setSelectedPageId(firstPage.id);
        setSearchParams({ page: firstPage.id });
      } else if (remainingPages.length === 0) {
        setSelectedPageId(null);
        setSearchParams({});
      }
      setDeleteModal(null);
    } else {
      setError(response.error || "Failed to delete page");
    }
  };

  const addSection = async (pageId: string) => {
    if (!id) return;

    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    const maxSequence =
      page.sections.length > 0
        ? Math.max(...page.sections.map((s) => s.sequence ?? 0))
        : 0;

    const response = await post(`/forms/${id}/pages/${pageId}/sections`, {
      title: "New Section",
      description: "",
      sequence: maxSequence + 1,
    });

    if (response.data?.success) {
      const newSection = {
        ...response.data.data,
        fields: [],
      };
      setPages(
        pages.map((p) =>
          p.id === pageId
            ? { ...p, sections: [...p.sections, newSection] }
            : p
        )
      );
    } else {
      setError(response.error || "Failed to create section");
    }
  };

  const removeSection = async (pageId: string, sectionId: string) => {
    if (!id) return;

    const response = await del(
      `/forms/${id}/pages/${pageId}/sections/${sectionId}`
    );

    if (response.data?.success || response.error === null) {
      setPages(
        pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                sections: page.sections.filter((s) => s.id !== sectionId),
              }
            : page
        )
      );
      setDeleteModal(null);
    } else {
      setError(response.error || "Failed to delete section");
    }
  };

  const addField = async (pageId: string, sectionId: string) => {
    if (!id) return;

    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    const section = page.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const maxSequence =
      section.fields?.length > 0
        ? Math.max(...section.fields.map((f) => f.sequence ?? 0))
        : 0;

    const response = await post(
      `/forms/${id}/pages/${pageId}/sections/${sectionId}/fields`,
      {
        label: "New Field",
        variable: `field_${Date.now()}`,
        controlType: "TEXTBOX",
        dataType: "TEXT",
        isRequired: false,
        isReadOnly: false,
        isHiddenOnDevice: false,
        isHiddenOnReport: false,
        sequence: maxSequence + 1,
      }
    );

    if (response.data?.success) {
      const newField = response.data.data;
      setPages(
        pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                sections: p.sections.map((s) =>
                  s.id === sectionId
                    ? { ...s, fields: [...(s.fields || []), newField] }
                    : s
                ),
              }
            : p
        )
      );
    } else {
      setError(response.error || "Failed to create field");
    }
  };

  const removeField = async (
    pageId: string,
    sectionId: string,
    fieldId: string
  ) => {
    if (!id) return;

    const response = await del(
      `/forms/${id}/pages/${pageId}/sections/${sectionId}/fields/${fieldId}`
    );

    if (response.data?.success || response.error === null) {
      setPages(
        pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        fields:
                          section.fields?.filter((f) => f.id !== fieldId) || [],
                      }
                    : section
                ),
              }
            : page
        )
      );
      setDeleteModal(null);
    } else {
      setError(response.error || "Failed to delete field");
    }
  };

  const updatePageTitle = (pageId: string, title: string) => {
    setPages(pages.map((p) => (p.id === pageId ? { ...p, title } : p)));
  };

  const updateSectionTitle = (
    pageId: string,
    sectionId: string,
    title: string
  ) => {
    setPages(
      pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.id === sectionId ? { ...section, title } : section
              ),
            }
          : page
      )
    );
  };

  const updateSectionDescription = (
    pageId: string,
    sectionId: string,
    description: string
  ) => {
    setPages(
      pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.id === sectionId ? { ...section, description } : section
              ),
            }
          : page
      )
    );
  };

  const updateField = (
    pageId: string,
    sectionId: string,
    fieldId: string,
    updates: Partial<Field>
  ) => {
    setPages(
      pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      fields:
                        section.fields?.map((field) =>
                          field.id === fieldId
                            ? { ...field, ...updates }
                            : field
                        ) || [],
                    }
                  : section
              ),
            }
          : page
      )
    );
  };

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Form not found</p>
        <Button onClick={() => navigate("/forms")}>Back to Forms</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/forms/${id}`)}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Edit: {formData.name}</h1>
              <p className="text-sm text-muted-foreground">
                Design and configure your form
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/forms/${id}`)}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pages sidebar */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Pages
            </span>
            <Button variant="outline" size="sm" onClick={addPage}>
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {pages
              .sort((a, b) => a.sequence - b.sequence)
              .map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPageId(page.id);
                    setSearchParams({ page: page.id });
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                    selectedPageId === page.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <GripVertical className="size-4 opacity-50" />
                  <span className="truncate flex-1">{page.title}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Page editor */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedPage ? (
            <div className="space-y-4">
              {/* Page title */}
              <div className="flex items-center gap-2">
                <Input
                  value={selectedPage.title}
                  onChange={(e) =>
                    updatePageTitle(selectedPage.id, e.target.value)
                  }
                  placeholder="Page title"
                  className="text-lg font-medium"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      type: "page",
                      id: selectedPage.id,
                      title: selectedPage.title,
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                {selectedPage.sections
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="border rounded-lg bg-card"
                    >
                      {/* Section header */}
                      <div className="p-3 border-b flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newCollapsed = new Set(collapsedSections);
                            if (newCollapsed.has(section.id)) {
                              newCollapsed.delete(section.id);
                            } else {
                              newCollapsed.add(section.id);
                            }
                            setCollapsedSections(newCollapsed);
                          }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {collapsedSections.has(section.id) ? (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          Section {sectionIndex + 1}
                        </span>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              type: "section",
                              id: section.id,
                              parentIds: { pageId: selectedPage.id },
                              title: section.title,
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {/* Section content */}
                      {!collapsedSections.has(section.id) && (
                        <div className="p-3 space-y-3">
                          <Input
                            value={section.title}
                            onChange={(e) =>
                              updateSectionTitle(
                                selectedPage.id,
                                section.id,
                                e.target.value
                              )
                            }
                            placeholder="Section title"
                          />
                          <Input
                            value={section.description || ""}
                            onChange={(e) =>
                              updateSectionDescription(
                                selectedPage.id,
                                section.id,
                                e.target.value
                              )
                            }
                            placeholder="Section description (optional)"
                          />

                          {/* Fields */}
                          <div className="space-y-2">
                            {section.fields
                              ?.sort((a, b) => a.sequence - b.sequence)
                              .map((field, fieldIndex) => (
                                <div
                                  key={field.id}
                                  className="flex items-start gap-2 p-3 border rounded bg-background"
                                >
                                  <GripVertical className="size-4 mt-2 text-muted-foreground/50" />
                                  <div className="flex items-center justify-center size-6 bg-primary text-primary-foreground rounded-full text-xs font-medium mt-1">
                                    {fieldIndex + 1}
                                  </div>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <Input
                                      value={field.label}
                                      onChange={(e) =>
                                        updateField(
                                          selectedPage.id,
                                          section.id,
                                          field.id,
                                          { label: e.target.value }
                                        )
                                      }
                                      placeholder="Field label"
                                    />
                                    <Input
                                      value={field.variable}
                                      onChange={(e) =>
                                        updateField(
                                          selectedPage.id,
                                          section.id,
                                          field.id,
                                          { variable: e.target.value }
                                        )
                                      }
                                      placeholder="Variable name"
                                    />
                                    <select
                                      value={field.controlType}
                                      onChange={(e) =>
                                        updateField(
                                          selectedPage.id,
                                          section.id,
                                          field.id,
                                          { controlType: e.target.value }
                                        )
                                      }
                                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                      {controlTypes.map((type) => (
                                        <option
                                          key={type.value}
                                          value={type.value}
                                        >
                                          {type.label}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={field.dataType}
                                      onChange={(e) =>
                                        updateField(
                                          selectedPage.id,
                                          section.id,
                                          field.id,
                                          { dataType: e.target.value }
                                        )
                                      }
                                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                      {dataTypes.map((type) => (
                                        <option
                                          key={type.value}
                                          value={type.value}
                                        >
                                          {type.label}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="col-span-2 flex items-center gap-4 text-sm">
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={field.isRequired}
                                          onChange={(e) =>
                                            updateField(
                                              selectedPage.id,
                                              section.id,
                                              field.id,
                                              { isRequired: e.target.checked }
                                            )
                                          }
                                          className="rounded"
                                        />
                                        Required
                                      </label>
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={field.isReadOnly}
                                          onChange={(e) =>
                                            updateField(
                                              selectedPage.id,
                                              section.id,
                                              field.id,
                                              { isReadOnly: e.target.checked }
                                            )
                                          }
                                          className="rounded"
                                        />
                                        Read Only
                                      </label>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteModal({
                                        isOpen: true,
                                        type: "field",
                                        id: field.id,
                                        parentIds: {
                                          pageId: selectedPage.id,
                                          sectionId: section.id,
                                        },
                                        title: field.label,
                                      })
                                    }
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>

                          {/* Add field button */}
                          <div className="flex justify-center p-4 border-2 border-dashed rounded">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                addField(selectedPage.id, section.id)
                              }
                            >
                              <Plus className="size-4" />
                              Add Field
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                {/* Add section button */}
                <div className="flex justify-center p-6 border-2 border-dashed rounded-lg">
                  <Button
                    variant="outline"
                    onClick={() => addSection(selectedPage.id)}
                  >
                    <Plus className="size-4" />
                    Add Section
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No page selected</p>
              <Button variant="outline" onClick={addPage} className="mt-4">
                <Plus className="size-4" />
                Add First Page
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Dialog
        open={deleteModal?.isOpen ?? false}
        onOpenChange={() => setDeleteModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteModal?.type}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p>
              Are you sure you want to delete the {deleteModal?.type} "
              {deleteModal?.title}"?
            </p>
            {deleteModal?.type === "page" && (
              <p className="text-sm text-muted-foreground">
                This will also delete all sections and fields within this page.
              </p>
            )}
            {deleteModal?.type === "section" && (
              <p className="text-sm text-muted-foreground">
                This will also delete all fields within this section.
              </p>
            )}
            <p className="text-sm text-destructive">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteModal) return;
                if (deleteModal.type === "page") {
                  removePage(deleteModal.id);
                } else if (deleteModal.type === "section") {
                  removeSection(
                    deleteModal.parentIds?.pageId!,
                    deleteModal.id
                  );
                } else if (deleteModal.type === "field") {
                  removeField(
                    deleteModal.parentIds?.pageId!,
                    deleteModal.parentIds?.sectionId!,
                    deleteModal.id
                  );
                }
              }}
            >
              Delete {deleteModal?.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;

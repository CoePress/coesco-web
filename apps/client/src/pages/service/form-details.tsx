import { useState, useEffect, useMemo } from 'react';
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import {Button, Input, PageHeader, Table, Modal } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

const FormDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, post, delete: deleteRequest } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'page' | 'section' | 'field';
    id: string;
    title: string;
    onConfirm: () => void;
  } | null>(null);

  const include = useMemo(
      () => ["pages.sections.fields"],
      []
  );

  const fetchForm = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    
    const response = await get(`/forms/${id}`, {
      include
    });
    
    if (response?.success && response.data) {
      setFormData(response.data);
      const pagesData = response.data.pages?.map((page: any) => ({
        ...page,
        sections: page.sections?.map((section: any) => ({
          ...section,
          fields: section.fields || []
        })) || []
      })) || [];
      setPages(pagesData);
      if (pagesData.length > 0 && !selectedPageId) {
        setSelectedPageId(pagesData[0].id);
      }
    } else {
      const errorMessage = response?.error || "Failed to fetch form";
      setError(errorMessage);
      toast.error(errorMessage);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchForm();
  }, [id]);

  const handleSave = async () => {
    if (!id || !formData) return;
    
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        status: formData.status
      };
      
      await patch(`/forms/${id}`, updateData);

      for (const page of pages) {
        await patch(`/forms/${id}/pages/${page.id}`, { title: page.title });

        for (const section of page.sections || []) {
          await patch(`/forms/${id}/pages/${page.id}/sections/${section.id}`, {
            title: section.title,
            description: section.description
          });

          if (section.fields && section.fields.length > 0) {
            for (const field of section.fields) {
              await patch(`/forms/${id}/pages/${page.id}/sections/${section.id}/fields/${field.id}`, {
                label: field.label,
                variable: field.variable,
                controlType: field.controlType,
                dataType: field.dataType,
                isRequired: field.isRequired,
                isReadOnly: field.isReadOnly,
                isHiddenOnDevice: field.isHiddenOnDevice,
                isHiddenOnReport: field.isHiddenOnReport,
                sequence: field.sequence
              });
            }
          }
        }
      }
      
      toast.success('Form updated successfully!');
      setIsEditing(false);
      await fetchForm();
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = 'Failed to save changes';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchForm();
  };

  const addPage = async () => {
    if (!id) return;

    const maxSequence = pages.length > 0
      ? Math.max(...pages.map(p => p.sequence ?? 0))
      : 0;

    const pageData = {
      title: 'New Page',
      sequence: maxSequence + 1
    };

    const response = await post(`/forms/${id}/pages`, pageData);

    if (response?.success) {
      const newPage = {
        ...response.data,
        isCollapsed: false,
        sections: []
      };
      setPages([...pages, newPage]);
      toast.success('Page added successfully!');
    } else {
      const errorMessage = response?.error || "Failed to create page";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const addSection = async (pageId: string) => {
    if (!id) return;

    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const maxSequence = page.sections.length > 0
      ? Math.max(...page.sections.map((s: any) => s.sequence ?? 0))
      : 0;

    const sectionData = {
      title: 'New Section',
      description: '',
      sequence: maxSequence + 1
    };

    const response = await post(`/forms/${id}/pages/${pageId}/sections`, sectionData);

    if (response?.success) {
      const newSection = {
        ...response.data,
        isCollapsed: false,
        fields: []
      };
      setPages(pages.map(page =>
        page.id === pageId
          ? { ...page, sections: [...page.sections, newSection] }
          : page
      ));
      toast.success('Section added successfully!');
    } else {
      const errorMessage = response?.error || "Failed to create section";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const confirmRemovePage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    setDeleteModal({
      isOpen: true,
      type: 'page',
      id: pageId,
      title: page.title,
      onConfirm: () => removePage(pageId)
    });
  };

  const removePage = async (pageId: string) => {
    if (!id) return;

    const response = await deleteRequest(`/forms/${id}/pages/${pageId}`);

    if (response?.success) {
      setPages(pages.filter(page => page.id !== pageId));
      toast.success('Page removed successfully!');
      setDeleteModal(null);
    } else {
      const errorMessage = response?.error || "Failed to delete page";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const confirmRemoveSection = (pageId: string, sectionId: string) => {
    const page = pages.find(p => p.id === pageId);
    const section = page?.sections.find((s: any) => s.id === sectionId);
    if (!section) return;

    setDeleteModal({
      isOpen: true,
      type: 'section',
      id: sectionId,
      title: section.title,
      onConfirm: () => removeSection(pageId, sectionId)
    });
  };

  const removeSection = async (pageId: string, sectionId: string) => {
    if (!id) return;

    const response = await deleteRequest(`/forms/${id}/pages/${pageId}/sections/${sectionId}`);

    if (response?.success) {
      setPages(pages.map(page =>
        page.id === pageId
          ? { ...page, sections: page.sections.filter((section: any) => section.id !== sectionId) }
          : page
      ));
      toast.success('Section removed successfully!');
      setDeleteModal(null);
    } else {
      const errorMessage = response?.error || "Failed to delete section";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const addFieldToSection = async (pageId: string, sectionId: string) => {
    if (!id) return;

    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const section = page.sections.find((s: any) => s.id === sectionId);
    if (!section) return;

    const maxSequence = section.fields?.length > 0
      ? Math.max(...section.fields.map((f: any) => f.sequence ?? 0))
      : 0;

    const fieldData = {
      label: 'New Field',
      variable: 'new_field',
      controlType: 'TEXTBOX',
      dataType: 'TEXT',
      isRequired: false,
      isReadOnly: false,
      isHiddenOnDevice: false,
      isHiddenOnReport: false,
      sequence: maxSequence + 1
    };

    const response = await post(`/forms/${id}/pages/${pageId}/sections/${sectionId}/fields`, fieldData);

    if (response?.success) {
      const newField = response.data;
      setPages(pages.map(page =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map((section: any) =>
                section.id === sectionId
                  ? { ...section, fields: [...(section.fields || []), newField] }
                  : section
              )
            }
          : page
      ));
      toast.success('Field added successfully!');
    } else {
      const errorMessage = response?.error || "Failed to create field";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const confirmRemoveField = (pageId: string, sectionId: string, fieldId: string) => {
    const page = pages.find(p => p.id === pageId);
    const section = page?.sections.find((s: any) => s.id === sectionId);
    const field = section?.fields?.find((f: any) => f.id === fieldId);
    if (!field) return;

    setDeleteModal({
      isOpen: true,
      type: 'field',
      id: fieldId,
      title: field.label,
      onConfirm: () => removeField(pageId, sectionId, fieldId)
    });
  };

  const removeField = async (pageId: string, sectionId: string, fieldId: string) => {
    if (!id) return;

    const response = await deleteRequest(`/forms/${id}/pages/${pageId}/sections/${sectionId}/fields/${fieldId}`);

    if (response?.success) {
      setPages(pages.map(page =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map((section: any) =>
                section.id === sectionId
                  ? { ...section, fields: section.fields?.filter((field: any) => field.id !== fieldId) || [] }
                  : section
              )
            }
          : page
      ));
      toast.success('Field removed successfully!');
      setDeleteModal(null);
    } else {
      const errorMessage = response?.error || "Failed to delete field";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const updatePageTitle = (pageId: string, title: string) => {
    setPages(pages.map(page =>
      page.id === pageId ? { ...page, title } : page
    ));
  };

  const updateSectionTitle = (pageId: string, sectionId: string, title: string) => {
    setPages(pages.map(page =>
      page.id === pageId
        ? {
            ...page,
            sections: page.sections.map((section: any) =>
              section.id === sectionId ? { ...section, title } : section
            )
          }
        : page
    ));
  };

  const updateSectionDescription = (pageId: string, sectionId: string, description: string) => {
    setPages(pages.map(page =>
      page.id === pageId
        ? {
            ...page,
            sections: page.sections.map((section: any) =>
              section.id === sectionId ? { ...section, description } : section
            )
          }
        : page
    ));
  };

  const updateField = (pageId: string, sectionId: string, fieldId: string, updates: any) => {
    setPages(pages.map(page =>
      page.id === pageId
        ? {
            ...page,
            sections: page.sections.map((section: any) =>
              section.id === sectionId
                ? {
                    ...section,
                    fields: section.fields?.map((field: any) =>
                      field.id === fieldId ? { ...field, ...updates } : field
                    ) || []
                  }
                : section
            )
          }
        : page
    ));
  };

  const controlTypes = [
    { value: 'INPUT', label: 'Input' },
    { value: 'TEXTBOX', label: 'Text Box' },
    { value: 'TEXT_AREA', label: 'Text Area' },
    { value: 'DROPDOWN', label: 'Dropdown' },
    { value: 'RADIO_BUTTON', label: 'Radio Button' },
    { value: 'MULTI_SELECT', label: 'Multi Select' },
    { value: 'BUTTON_GROUP', label: 'Button Group' },
    { value: 'DATE_SELECTOR', label: 'Date Selector' },
    { value: 'TIME_SELECTOR', label: 'Time Selector' },
    { value: 'GEO_LOCATION', label: 'GPS Location' },
    { value: 'STAMP', label: 'Stamp' },
    { value: 'SKETCH_PAD', label: 'Sketch Pad' },
    { value: 'CAMERA', label: 'Camera' },
    { value: 'SIGNATURE_PAD', label: 'Signature Pad' }
  ];

  const dataTypes = [
    { value: 'TEXT', label: 'Text' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'EMAIL_ADDRESS', label: 'Email Address' },
    { value: 'URL', label: 'URL' },
    { value: 'PHONE_NUMBER', label: 'Phone Number' },
    { value: 'INTEGER', label: 'Integer' },
    { value: 'DECIMAL', label: 'Decimal' },
    { value: 'CURRENCY', label: 'Currency' },
    { value: 'DATE', label: 'Date' },
    { value: 'TIME', label: 'Time' },
    { value: 'DATE_TIME', label: 'Date/Time' },
    { value: 'GEO_LOCATION', label: 'GPS Location' },
    { value: 'IMAGE', label: 'Image' },
    { value: 'SIGNATURE', label: 'Signature' }
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        {!isEditing ? (
          <>
            <Button 
              onClick={() => setIsEditing(true)}
              variant='secondary-outline'
            >
              <Edit size={16} />
              <span>Edit Form</span>
            </Button>
            <Button
              onClick={() => navigate("submit")}
            >
              <Plus size={16} />
              <span>New Submission</span>
            </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleCancel}
                variant='secondary-outline'
              >
                <X size={16} />
                <span>Cancel</span>
              </Button>
              <Button 
                onClick={handleSave}
              >
                <Save size={16} />
                <span>Save Changes</span>
              </Button>
            </>
          )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg">Loading form...</div>
      </div>
    );
  }

  if (!formData && !loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-error text-lg mb-4">Form not found</div>
        <Button onClick={() => navigate('/service/forms')}>
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title={formData.name}
        description={formData.description}
        actions={<Actions />}
      />

      {error && (
        <div className="p-2">
          <div className="bg-error/10 border border-error/20 rounded p-2 text-error text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <div className="flex h-full">
              <div className="w-64 border-r border-border bg-foreground">
                <div className="p-2 border-b flex items-center justify-between">
                  <h3 className="text-sm text-text-muted">Pages</h3>
                  <Button
                    onClick={addPage}
                    size="sm"
                    variant="secondary-outline"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                <div className="p-2 space-y-1">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPageId(page.id)}
                      className={`w-full text-left px-2 py-2 text-sm rounded transition-colors truncate cursor-pointer ${
                        selectedPageId === page.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-surface text-text-muted'
                      }`}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedPageId && pages.find(p => p.id === selectedPageId) && (
                  <EditPageView
                    page={pages.find(p => p.id === selectedPageId)!}
                    pageIndex={pages.findIndex(p => p.id === selectedPageId)}
                    onUpdatePageTitle={updatePageTitle}
                    onRemovePage={confirmRemovePage}
                    onAddSection={addSection}
                    onRemoveSection={confirmRemoveSection}
                    onUpdateSectionTitle={updateSectionTitle}
                    onUpdateSectionDescription={updateSectionDescription}
                    onAddField={addFieldToSection}
                    onRemoveField={confirmRemoveField}
                    onUpdateField={updateField}
                    controlTypes={controlTypes}
                    dataTypes={dataTypes}
                  />
                )}
              </div>
            </div>
          ) : (
          <Table
            columns={[
              {
                key: 'label',
                header: 'Field Label'
              },
              {
                key: 'controlType',
                header: 'Control Type'
              },
              {
                key: 'dataType',
                header: 'Data Type'
              },
              {
                key: 'isRequired',
                header: 'Required'
              },
              {
                key: 'variable',
                header: 'Variable'
              }
            ]}
            data={pages.flatMap((page, pageIndex) => [
              {
                id: `page-${page.id}`,
                isPage: true,
                pageIndex: pageIndex + 1,
                title: page.title,
                label: `Page ${pageIndex + 1}: ${page.title}`,
                controlType: '',
                dataType: '',
                isRequired: false,
                variable: '',
                dividerClass: 'bg-primary'
              },
              ...page.sections.flatMap((section: any, sectionIndex: any) => [
                {
                  id: `section-${section.id}`,
                  isSection: true,
                  sectionIndex: sectionIndex + 1,
                  title: section.title,
                  description: section.description,
                  label: '',
                  controlType: '',
                  dataType: '',
                  isRequired: false,
                  variable: '',
                  dividerClass: 'bg-primary/20'
                },
                ...(section.fields?.map((field: any) => ({
                  ...field,
                  isField: true
                })) || [])
              ])
            ])}
            total={pages.reduce((acc, page) => acc + 1 + page.sections.reduce((secAcc: any, section: any) => secAcc + 1 + (section.fields?.length || 0), 0), 0)}
            idField="id"
            className="border border-border rounded-sm overflow-hidden"
            emptyMessage="No fields defined in this form"
          />
        )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal(null)}
          title={`Delete ${deleteModal.type}`}
          size="xs"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the {deleteModal.type} "{deleteModal.title}"?
              {deleteModal.type === 'page' && ' This will also delete all sections and fields within this page.'}
              {deleteModal.type === 'section' && ' This will also delete all fields within this section.'}
            </p>
            <p className="text-error text-sm">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary-outline"
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteModal.onConfirm}
              >
                Delete {deleteModal.type}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const EditPageView = ({
  page,
  pageIndex,
  onUpdatePageTitle,
  onRemovePage,
  onAddSection,
  onRemoveSection,
  onUpdateSectionTitle,
  onUpdateSectionDescription,
  onAddField,
  onRemoveField,
  onUpdateField,
  controlTypes,
  dataTypes
}: any) => {
  return (
    <div className="bg-foreground rounded border border-border flex flex-col h-full">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm text-text-muted">Page {pageIndex + 1}</h3>
          <button
            onClick={() => onRemovePage(page.id)}
            className="text-error hover:text-error/80 p-1 rounded cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <Button
          onClick={() => onAddSection(page.id)}
          size="sm"
        >
          <Plus size={14} />
          Add Section
        </Button>
      </div>

      <div className="p-2 border-b">
        <Input
          value={page.title}
          onChange={(e) => onUpdatePageTitle(page.id, e.target.value)}
          placeholder="Page title"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {(!page.sections || page.sections.length === 0) ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded">
            <div className="text-text-muted text-sm mb-2">No sections in this page yet</div>
            <Button
              onClick={() => onAddSection(page.id)}
              size="sm"
            >
              <Plus size={14} />
              Add your first section
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {page.sections.map((section: any, sectionIndex: any) => (
              <div key={section.id} className="bg-surface border border-border rounded">
                <div className="p-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Section {sectionIndex + 1}</span>
                    <button
                      onClick={() => onRemoveSection(page.id, section.id)}
                      className="text-error hover:text-error/80 p-1 rounded cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Button
                    onClick={() => onAddField(page.id, section.id)}
                    size="sm"
                  >
                    <Plus size={14} />
                    Add Field
                  </Button>
                </div>

                <div className="p-2 space-y-2">
                  <Input
                    value={section.title}
                    onChange={(e) => onUpdateSectionTitle(page.id, section.id, e.target.value)}
                    placeholder="Section title"
                  />
                  <Input
                    value={section.description || ''}
                    onChange={(e) => onUpdateSectionDescription(page.id, section.id, e.target.value)}
                    placeholder="Section description (optional)"
                  />

                  {(!section.fields || section.fields.length === 0) ? (
                    <div className="text-center py-4 border-2 border-dashed border-border rounded">
                      <div className="text-text-muted text-xs mb-2">No fields in this section yet</div>
                      <Button
                        onClick={() => onAddField(page.id, section.id)}
                        size="sm"
                      >
                        <Plus size={14} />
                        Add your first field
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {section.fields.map((field: any, fieldIndex: any) => (
                        <div key={field.id} className="flex items-start gap-2 p-2 bg-foreground border border-border rounded">
                          <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-medium flex-shrink-0">
                            {fieldIndex + 1}
                          </div>
                          <div className="flex-1">
                            <FieldEditor
                              field={field}
                              controlTypes={controlTypes}
                              dataTypes={dataTypes}
                              onUpdate={(updates: any) => onUpdateField(page.id, section.id, field.id, updates)}
                            />
                          </div>
                          <button
                            onClick={() => onRemoveField(page.id, section.id, field.id)}
                            className="text-error hover:text-error/80 p-1 rounded flex-shrink-0 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FieldEditor = ({ field, controlTypes, dataTypes, onUpdate }: any) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Field Label</label>
          <Input
            value={field.label || ''}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Field label"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Variable</label>
          <Input
            value={field.variable || ''}
            onChange={(e) => onUpdate({ variable: e.target.value })}
            placeholder="Variable name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Control Type</label>
          <select
            value={field.controlType || 'TEXTBOX'}
            onChange={(e) => onUpdate({ controlType: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text-muted">
            {controlTypes.map((type: any) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Data Type</label>
          <select
            value={field.dataType || 'TEXT'}
            onChange={(e) => onUpdate({ dataType: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text-muted">
            {dataTypes.map((type: any) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={field.isRequired || false}
            onChange={(e) => onUpdate({ isRequired: e.target.checked })}
            className="rounded"
          />
          <span>Required</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={field.isReadOnly || false}
            onChange={(e) => onUpdate({ isReadOnly: e.target.checked })}
            className="rounded"
          />
          <span>Read Only</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={field.isHiddenOnDevice || false}
            onChange={(e) => onUpdate({ isHiddenOnDevice: e.target.checked })}
            className="rounded"
          />
          <span>Hidden on Device</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={field.isHiddenOnReport || false}
            onChange={(e) => onUpdate({ isHiddenOnReport: e.target.checked })}
            className="rounded"
          />
          <span>Hidden on Report</span>
        </label>
      </div>
    </div>
  );
};

export default FormDetails;
import { useState, useEffect, useMemo } from 'react';
import { Edit, Save, X, Plus, Trash2, GripVerticalIcon, ChevronDown, ChevronRight } from 'lucide-react';
import {Button, Input, PageHeader, Table, Modal } from '@/components';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

const FormDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { get, patch, post, delete: deleteRequest } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
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
        // Find the page with the lowest sequence number
        const lowestSequencePage = pagesData.reduce((min: any, page: any) =>
          page.sequence < min.sequence ? page : min, pagesData[0]);
        setSelectedPageId(lowestSequencePage.id);
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

  const updateEditMode = (editing: boolean) => {
    setIsEditing(editing);
    const newParams = new URLSearchParams(searchParams);
    if (editing) {
      newParams.set('edit', 'true');
    } else {
      newParams.delete('edit');
    }
    setSearchParams(newParams);
  };

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
            // Sort fields by sequence before saving
            const sortedFields = [...section.fields].sort((a: any, b: any) => a.sequence - b.sequence);
            for (let i = 0; i < sortedFields.length; i++) {
              const field = sortedFields[i];
              await patch(`/forms/${id}/pages/${page.id}/sections/${section.id}/fields/${field.id}`, {
                label: field.label,
                variable: field.variable,
                controlType: field.controlType,
                dataType: field.dataType,
                isRequired: field.isRequired,
                isReadOnly: field.isReadOnly,
                isHiddenOnDevice: field.isHiddenOnDevice,
                isHiddenOnReport: field.isHiddenOnReport,
                sequence: i + 1  // Ensure sequential numbering
              });
            }
          }
        }
      }

      toast.success('Form updated successfully!');
      updateEditMode(false);
      await fetchForm();
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = 'Failed to save changes';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    updateEditMode(false);
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

  const handlePageDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePageDragEnd = () => {
    setDraggedPageId(null);
    setDropTargetIndex(null);
  };

  const handleDragOverContainer = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPageId) return;

    const container = e.currentTarget as HTMLElement;
    const afterElement = getDragAfterElement(container, e.clientY);

    if (afterElement) {
      const index = parseInt(afterElement.getAttribute('data-index') || '0');
      setDropTargetIndex(index);
    } else {
      setDropTargetIndex(pages.length);
    }
  };

  const getDragAfterElement = (container: HTMLElement, y: number) => {
    const draggableElements = [...container.querySelectorAll('[data-draggable="true"]:not(.dragging)')];

    return draggableElements.reduce<{ offset: number; element: HTMLElement | null }>((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child as HTMLElement };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  };

  const handlePageDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedPageId || !id) return;

    const draggedIndex = pages.findIndex(p => p.id === draggedPageId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedPageId(null);
      setDropTargetIndex(null);
      return;
    }

    const newPages = [...pages];
    const [draggedPage] = newPages.splice(draggedIndex, 1);
    const actualDropIndex = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;
    newPages.splice(actualDropIndex, 0, draggedPage);

    const updatedPages = newPages.map((page, index) => ({
      ...page,
      sequence: index + 1
    }));

    setPages(updatedPages);
    setDraggedPageId(null);
    setDropTargetIndex(null);

    try {
      for (const page of updatedPages) {
        await patch(`/forms/${id}/pages/${page.id}`, { sequence: page.sequence });
      }
      toast.success('Page order updated successfully!');
    } catch (error) {
      console.error('Failed to update page order:', error);
      toast.error('Failed to update page order');
      // Revert on error
      await fetchForm();
    }
  };

  const updateField = (pageId: string, sectionId: string, fieldId: string | null, updates: any) => {
    setPages(pages.map(page =>
      page.id === pageId
        ? {
            ...page,
            sections: page.sections.map((section: any) =>
              section.id === sectionId
                ? {
                    ...section,
                    // If fieldId is null and updates contains fields array, replace all fields
                    fields: fieldId === null && updates.fields
                      ? updates.fields
                      : section.fields?.map((field: any) =>
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
              onClick={() => updateEditMode(true)}
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
            <div className="flex h-full gap-2">
              <div className="w-64 border border-border rounded-sm bg-foreground">
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
                <div
                  className="p-2"
                  onDragOver={handleDragOverContainer}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dropTargetIndex !== null) {
                      handlePageDrop(e, dropTargetIndex);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDropTargetIndex(null);
                    }
                  }}
                >
                  {pages.sort((a, b) => a.sequence - b.sequence).map((page, index) => (
                    <div key={page.id}>
                      <div
                        className={`h-1 transition-all duration-200 ${
                          dropTargetIndex === index
                            ? 'bg-primary opacity-60'
                            : 'bg-transparent'
                        }`}
                      />

                      <div
                        data-draggable="true"
                        data-index={index}
                        className={`w-full flex items-center text-left text-sm rounded transition-all ${
                          selectedPageId === page.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-surface text-text-muted'
                        } ${
                          draggedPageId === page.id
                            ? 'opacity-50 dragging'
                            : ''
                        }`}
                      >
                        <div
                          draggable
                          onDragStart={(e) => handlePageDragStart(e, page.id)}
                          onDragEnd={handlePageDragEnd}
                          className="cursor-move p-2 -ml-2 hover:bg-black/10"
                        >
                          <GripVerticalIcon className='text-text-muted/50' size={16} />
                        </div>
                        <button
                          onClick={() => setSelectedPageId(page.id)}
                          className="flex-1 text-left py-2 pr-2 truncate cursor-pointer"
                        >
                          {page.title}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div
                    className={`h-1 transition-all duration-200 ${
                      dropTargetIndex === pages.length
                        ? 'bg-primary opacity-60'
                        : 'bg-transparent'
                    }`}
                  />
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
                    collapsedSections={collapsedSections}
                    setCollapsedSections={setCollapsedSections}
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
            data={pages.sort((a, b) => a.sequence - b.sequence).flatMap((page, pageIndex) => [
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
              ...(page.sections || []).sort((a: any, b: any) => a.sequence - b.sequence).flatMap((section: any, sectionIndex: any) => [
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
                ...((section.fields || []).sort((a: any, b: any) => a.sequence - b.sequence).map((field: any) => ({
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
  onUpdateField,
  controlTypes,
  dataTypes,
  collapsedSections,
  setCollapsedSections
}: any) => {
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [fieldDropTargetIndex, setFieldDropTargetIndex] = useState<{ sectionId: string; index: number } | null>(null);

  const handleFieldDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDragEnd = () => {
    setDraggedFieldId(null);
    setFieldDropTargetIndex(null);
  };

  const handleFieldDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    if (!draggedFieldId) return;

    const container = e.currentTarget as HTMLElement;
    const afterElement = getDragAfterElement(container, e.clientY);
    const section = page.sections.find((s: any) => s.id === sectionId);

    if (afterElement) {
      const index = parseInt(afterElement.getAttribute('data-field-index') || '0');
      setFieldDropTargetIndex({ sectionId, index });
    } else {
      setFieldDropTargetIndex({ sectionId, index: section?.fields?.length || 0 });
    }
  };

  const getDragAfterElement = (container: HTMLElement, y: number) => {
    const draggableElements = [...container.querySelectorAll('[data-field-draggable="true"]:not(.field-dragging)')];

    return draggableElements.reduce<{ offset: number; element: HTMLElement | null }>((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child as HTMLElement };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  };

  const handleFieldDrop = async (e: React.DragEvent, sectionId: string, dropIndex: number) => {
    e.preventDefault();

    if (!draggedFieldId) return;

    const section = page.sections.find((s: any) => s.id === sectionId);
    if (!section) return;

    const draggedIndex = section.fields.findIndex((f: any) => f.id === draggedFieldId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedFieldId(null);
      setFieldDropTargetIndex(null);
      return;
    }

    const newFields = [...section.fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    const actualDropIndex = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;
    newFields.splice(actualDropIndex, 0, draggedField);

    const updatedFields = newFields.map((field, index) => ({
      ...field,
      sequence: index + 1
    }));

    // Update local state
    onUpdateField(page.id, sectionId, null, { fields: updatedFields });

    setDraggedFieldId(null);
    setFieldDropTargetIndex(null);
  };
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
                <div className={`p-2 ${!collapsedSections.has(section.id) ? 'border-b' : ''} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
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
                      className="p-1 hover:bg-black/10 rounded cursor-pointer"
                    >
                      {collapsedSections.has(section.id) ? (
                        <ChevronRight size={14} className="text-text-muted" />
                      ) : (
                        <ChevronDown size={14} className="text-text-muted" />
                      )}
                    </button>
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

                {!collapsedSections.has(section.id) && (
                  <div className="p-2 pb-1 space-y-2">
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
                    <div
                      className="space-y-0"
                      onDragOver={(e) => handleFieldDragOver(e, section.id)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (fieldDropTargetIndex?.sectionId === section.id) {
                          handleFieldDrop(e, section.id, fieldDropTargetIndex?.index || -1);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setFieldDropTargetIndex(null);
                        }
                      }}
                    >
                      {section.fields.sort((a: any, b: any) => a.sequence - b.sequence).map((field: any, fieldIndex: any) => (
                        <div key={field.id}>
                          <div
                            className={`h-1 transition-all duration-200 ${
                              fieldDropTargetIndex?.sectionId === section.id && fieldDropTargetIndex?.index === fieldIndex
                                ? 'bg-primary opacity-60'
                                : 'bg-transparent'
                            }`}
                          />
                          <div
                            data-field-draggable="true"
                            data-field-index={fieldIndex}
                            className={`p-2 bg-foreground border border-border rounded ${
                              draggedFieldId === field.id ? 'opacity-50 field-dragging' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                draggable
                                onDragStart={(e) => handleFieldDragStart(e, field.id)}
                                onDragEnd={handleFieldDragEnd}
                                className="cursor-move p-1 -ml-1 hover:bg-black/10 rounded"
                              >
                                <GripVerticalIcon className='text-text-muted/50' size={14} />
                              </div>
                              <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                                {fieldIndex + 1}
                              </div>
                            </div>
                            <FieldEditor
                              field={field}
                              controlTypes={controlTypes}
                              dataTypes={dataTypes}
                              onUpdate={(updates: any) => onUpdateField(page.id, section.id, field.id, updates)}
                            />
                          </div>
                        </div>
                      ))}
                      <div
                        className={`h-1 transition-all duration-200 ${
                          fieldDropTargetIndex?.sectionId === section.id && fieldDropTargetIndex?.index === section.fields.length
                            ? 'bg-primary opacity-60'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>
                  )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FieldEditor = ({ field, controlTypes, dataTypes }: any) => {
  const getControlTypeLabel = (value: string) => {
    const type = controlTypes.find((t: any) => t.value === value);
    return type ? type.label : value;
  };

  const getDataTypeLabel = (value: string) => {
    const type = dataTypes.find((t: any) => t.value === value);
    return type ? type.label : value;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Field Label</label>
          <div className="px-2 py-1 text-sm border border-border rounded bg-background/50 text-text">
            {field.label || '—'}
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Variable</label>
          <div className="px-2 py-1 text-sm border border-border rounded bg-background/50 text-text">
            {field.variable || '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Control Type</label>
          <div className="px-2 py-1 text-sm border border-border rounded bg-background/50 text-text">
            {getControlTypeLabel(field.controlType || 'TEXTBOX')}
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Data Type</label>
          <div className="px-2 py-1 text-sm border border-border rounded bg-background/50 text-text">
            {getDataTypeLabel(field.dataType || 'TEXT')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormDetails;
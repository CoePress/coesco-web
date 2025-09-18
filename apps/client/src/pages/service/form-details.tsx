import { useState, useEffect, useMemo } from 'react';
import { Edit, Save, X, Plus, Trash2, GripVertical } from 'lucide-react';
import {Button, Input, Card, PageHeader, Table } from '@/components';
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
      setPages(response.data.pages?.map((page: any) => ({
        ...page,
        isCollapsed: false,
        sections: page.sections?.map((section: any) => ({
          ...section,
          isCollapsed: false,
          fields: section.fields || []
        })) || []
      })) || []);
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

  const updateFormData = (updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
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

  const removePage = async (pageId: string) => {
    if (!id) return;

    const response = await deleteRequest(`/forms/${id}/pages/${pageId}`);

    if (response?.success) {
      setPages(pages.filter(page => page.id !== pageId));
      toast.success('Page removed successfully!');
    } else {
      const errorMessage = response?.error || "Failed to delete page";
      setError(errorMessage);
      toast.error(errorMessage);
    }
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

  if (error || !formData) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-error text-lg mb-4">{error || "Form not found"}</div>
        <Button onClick={() => navigate('/service/forms')}>
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      {isEditing ? (
        <div className="border-b border-border bg-surface p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="text-2xl font-bold"
                  placeholder="Form name"
                />
                <Input
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Form description (optional)"
                />
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData({ status: e.target.value })}
                  className="px-3 py-2 border rounded-md">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Actions />
            </div>
          </div>
        </div>
      ) : (
        <PageHeader
          title={formData.name}
          description={formData.description}
          actions={<Actions />}
        />
      )}

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <div className="h-full overflow-y-auto">
              {pages.map((page, pageIndex) => (
            <Card key={page.id} className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <GripVertical className="text-text-muted" size={16} />
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">
                      Page {pageIndex + 1}
                    </span>
                    <button
                      onClick={() => removePage(page.id)}
                      className="text-error hover:text-error/80 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Input
                      value={page.title}
                      onChange={(e) => updatePageTitle(page.id, e.target.value)}
                      className="text-2xl font-bold"
                      placeholder="Page title"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => addSection(page.id)}
                  size="sm"
                  className="ml-4"
                >
                  <Plus size={14} />
                  <span>Add Section</span>
                </Button>
              </div>

              <div className="space-y-4">
                {(!page.sections || page.sections.length === 0) ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <div className="text-text-muted mb-2">
                      <span className="text-lg">No sections in this page yet</span>
                    </div>
                    <Button
                      onClick={() => addSection(page.id)}
                      size="sm"
                    >
                      <Plus size={14} />
                      <span>Add your first section</span>
                    </Button>
                  </div>
                ) : (
                  page.sections.map((section: any, sectionIndex: any) => (
                    <Card key={section.id} className="bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <GripVertical className="text-text-muted" size={16} />
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                              Section {sectionIndex + 1}
                            </span>
                            <button
                              onClick={() => removeSection(page.id, section.id)}
                              className="text-error hover:text-error/80 p-1 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <Input
                              value={section.title}
                              onChange={(e) => updateSectionTitle(page.id, section.id, e.target.value)}
                              className="text-xl font-semibold"
                              placeholder="Section title"
                            />
                            <Input
                              value={section.description || ''}
                              onChange={(e) => updateSectionDescription(page.id, section.id, e.target.value)}
                              placeholder="Section description (optional)"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={() => addFieldToSection(page.id, section.id)}
                          size="sm"
                          className="ml-4"
                        >
                          <Plus size={14} />
                          <span>Add Field</span>
                        </Button>
                      </div>

                      <div className="mt-4">
                        {(!section.fields || section.fields.length === 0) ? (
                          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                            <div className="text-text-muted mb-2">
                              <span>No fields in this section yet</span>
                            </div>
                            <Button
                              onClick={() => addFieldToSection(page.id, section.id)}
                              size="sm"
                            >
                              <Plus size={14} />
                              <span>Add your first field</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {section.fields.map((field: any, fieldIndex: any) => (
                              <div key={field.id} className="flex items-center space-x-4 p-4 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors">
                                <GripVertical className="text-text-muted" size={14} />

                                <div className="flex items-center justify-center w-8 h-8 bg-foreground border border-border rounded-full text-sm font-medium text-text-muted">
                                  {fieldIndex + 1}
                                </div>

                                <div className="flex-1">
                                  <FieldEditor
                                    field={field}
                                    controlTypes={controlTypes}
                                    dataTypes={dataTypes}
                                    onUpdate={(updates: any) => updateField(page.id, section.id, field.id, updates)}
                                  />
                                </div>

                                <button
                                  onClick={() => removeField(page.id, section.id, field.id)}
                                  className="text-error hover:text-error/80 p-2 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
              ))}
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

        {isEditing && (
          <div className="flex justify-center p-4">
            <Button
              onClick={addPage}
              variant="primary-outline"
              size="md"
            >
              <Plus size={16} />
              <span>Add Page</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


const FieldEditor = ({ field, controlTypes, dataTypes, onUpdate }: any) => {
  const needsOptions = ['DROPDOWN', 'RADIO_BUTTON', 'MULTI_SELECT'].includes(field.controlType);

  return (
    <div className="space-y-4 p-4 bg-surface border border-border rounded-lg">
      {/* Field Label */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Field Label *</label>
        <Input
          value={field.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Enter field label"
          className="w-full"
        />
      </div>

      {/* Variable Name */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Variable Name *</label>
        <Input
          value={field.variable || ''}
          onChange={(e) => onUpdate({ variable: e.target.value })}
          placeholder="Enter variable name"
          className="w-full"
        />
      </div>

      {/* Control Type */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Control Type</label>
        <select
          value={field.controlType || 'TEXTBOX'}
          onChange={(e) => onUpdate({ controlType: e.target.value })}
          className="w-full px-3 py-2 border rounded-md">
          {controlTypes.map((type: any) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Type */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Data Type</label>
        <select
          value={field.dataType || 'TEXT'}
          onChange={(e) => onUpdate({ dataType: e.target.value })}
          className="w-full px-3 py-2 border rounded-md">
          {dataTypes.map((type: any) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Field Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.isRequired || false}
            onChange={(e) => onUpdate({ isRequired: e.target.checked })}
            className="rounded"
          />
          <label htmlFor={`required-${field.id}`} className="text-sm font-medium text-text">
            Required
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`readonly-${field.id}`}
            checked={field.isReadOnly || false}
            onChange={(e) => onUpdate({ isReadOnly: e.target.checked })}
            className="rounded"
          />
          <label htmlFor={`readonly-${field.id}`} className="text-sm font-medium text-text">
            Read Only
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`hiddenDevice-${field.id}`}
            checked={field.isHiddenOnDevice || false}
            onChange={(e) => onUpdate({ isHiddenOnDevice: e.target.checked })}
            className="rounded"
          />
          <label htmlFor={`hiddenDevice-${field.id}`} className="text-sm font-medium text-text">
            Hidden on Device
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`hiddenReport-${field.id}`}
            checked={field.isHiddenOnReport || false}
            onChange={(e) => onUpdate({ isHiddenOnReport: e.target.checked })}
            className="rounded"
          />
          <label htmlFor={`hiddenReport-${field.id}`} className="text-sm font-medium text-text">
            Hidden on Report
          </label>
        </div>
      </div>

      {/* Sequence */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Sequence</label>
        <Input
          type="number"
          value={field.sequence || 1}
          onChange={(e) => onUpdate({ sequence: parseInt(e.target.value) || 1 })}
          placeholder="Field sequence"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default FormDetails;
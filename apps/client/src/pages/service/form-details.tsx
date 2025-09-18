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
  const [sections, setSections] = useState<any[]>([]);

  const include = useMemo(
      () => ["sections.fields"],
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
      setSections(response.data.sections?.map((section: any) => ({
        ...section,
        isCollapsed: false,
        fields: section.fields || []
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
      
      for (const section of sections) {
        await patch(`/forms/${id}/sections/${section.id}`, { title: section.title });
        
        await patch(`/forms/${id}/sections/${section.id}`, { description: section.description });
        
        if (section.fields && section.fields.length > 0) {
          for (const field of section.fields) {
            await patch(`/forms/${id}/sections/${section.id}/fields/${field.id}`, {
              label: field.label,
              fieldType: field.fieldType,
              required: field.required,
              options: field.options,
              validationRules: field.validationRules
            });
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

  const addSection = async () => {
    if (!id) return;
    
    const maxOrderIndex = sections.length > 0 
      ? Math.max(...sections.map(s => s.orderIndex ?? 0))
      : 0;
    
    const sectionData = {
      title: 'New Section',
      description: '',
      orderIndex: maxOrderIndex + 1
    };
    
    console.log('Sending section data:', JSON.stringify(sectionData));
    const response = await post(`/forms/${id}/sections`, sectionData);
    
    if (response?.success) {
      const newSection = {
        ...response.data,
        isCollapsed: false,
        fields: []
      };
      setSections([...sections, newSection]);
      toast.success('Section added successfully!');
    } else {
      const errorMessage = response?.error || "Failed to create section";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const removeSection = async (sectionId: string) => {
    if (!id) return;
    
    const response = await deleteRequest(`/forms/${id}/sections/${sectionId}`);
    
    if (response?.success) {
      setSections(sections.filter(section => section.id !== sectionId));
      toast.success('Section removed successfully!');
    } else {
      const errorMessage = response?.error || "Failed to delete section";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const addFieldToSection = async (sectionId: string) => {
    if (!id) return;
    
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const fieldData = {
      fieldType: 'text',
      label: 'New Field',
      required: true,  // Set to true to pass validation since !false = true triggers error
      orderIndex: (section.fields?.length || 0) + 1,  // Start at 1 to ensure !0 doesn't fail
      validationRules: null,
      options: null
    };
    
    const response = await post(`/forms/${id}/sections/${sectionId}/fields`, fieldData);
    
    if (response?.success) {
      const newField = response.data;
      setSections(sections.map(section =>
        section.id === sectionId
          ? { ...section, fields: [...(section.fields || []), newField] }
          : section
      ));
      toast.success('Field added successfully!');
    } else {
      const errorMessage = response?.error || "Failed to create field";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const removeField = async (sectionId: string, fieldId: string) => {
    if (!id) return;
    
    const response = await deleteRequest(`/forms/${id}/sections/${sectionId}/fields/${fieldId}`);
    
    if (response?.success) {
      setSections(sections.map(section =>
        section.id === sectionId
          ? { ...section, fields: section.fields?.filter((field: any) => field.id !== fieldId) || [] }
          : section
      ));
      toast.success('Field removed successfully!');
    } else {
      const errorMessage = response?.error || "Failed to delete field";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, title } : section
    ));
  };

  const updateSectionDescription = (sectionId: string, description: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, description } : section
    ));
  };

  const updateField = (sectionId: string, fieldId: string, updates: any) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, fields: section.fields?.map((field: any) => 
            field.id === fieldId ? { ...field, ...updates } : field
          ) || []}
        : section
    ));
  };

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'photo', label: 'Photo Upload' },
    { value: 'signature', label: 'Signature' },
    { value: 'date', label: 'Date Picker' }
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
    <div className="w-full flex-1 flex flex-col">
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

      <div className="p-2">
        {isEditing ? (
          sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <GripVertical className="text-text-muted" size={16} />
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      Section {sectionIndex + 1}
                    </span>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="text-error hover:text-error/80 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      className="text-xl font-semibold"
                      placeholder="Section title"
                    />
                    <Input
                      value={section.description}
                      onChange={(e) => updateSectionDescription(section.id, e.target.value)}
                      placeholder="Section description (optional)"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => addFieldToSection(section.id)}
                  size="sm"
                  className="ml-4"
                >
                  <Plus size={14} />
                  <span>Add Field</span>
                </Button>
              </div>

              <div className="mt-4">
                {(!section.fields || section.fields.length === 0) ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <div className="text-text-muted mb-2">
                      <span className="text-lg">No fields in this section yet</span>
                    </div>
                    <Button
                      onClick={() => addFieldToSection(section.id)}
                      size="sm"
                    >
                      <Plus size={14} />
                      <span>Add your first field</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.fields.map((field: any, fieldIndex: any) => (
                      <div key={field.id} className="flex items-center space-x-4 p-4 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors">
                        <GripVertical className="text-text-muted" size={14} />

                        <div className="flex items-center justify-center w-8 h-8 bg-foreground border border-border rounded-full text-sm font-medium text-text-muted">
                          {fieldIndex + 1}
                        </div>

                        <div className="flex-1">
                          <FieldEditor
                            field={field}
                            fieldTypes={fieldTypes}
                            onUpdate={(updates: any) => updateField(section.id, field.id, updates)}
                          />
                        </div>

                        <button
                          onClick={() => removeField(section.id, field.id)}
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
        ) : (
          <Table
            columns={[
              {
                key: 'label',
                header: 'Field Label'
              },
              {
                key: 'fieldType',
                header: 'Type'
              },
              {
                key: 'required',
                header: 'Required'
              },
              {
                key: 'options',
                header: 'Options'
              },
              {
                key: 'validationRules',
                header: 'Validation'
              }
            ]}
            data={sections.flatMap((section, sectionIndex) => [
              {
                id: `section-${section.id}`,
                isSection: true,
                sectionIndex: sectionIndex + 1,
                title: section.title,
                description: section.description,
                label: '',
                fieldType: '',
                required: false,
                options: null,
                validationRules: null
              },
              ...(section.fields?.map((field: any) => ({
                ...field,
                isSection: false
              })) || [])
            ])}
            total={sections.reduce((acc, section) => acc + (section.fields?.length || 0) + 1, 0)}
            idField="id"
            className="border border-border rounded-sm overflow-hidden"
            emptyMessage="No fields defined in this form"
          />
        )}
        
        {isEditing && (
          <div className="flex justify-center p-4">
            <Button 
              onClick={addSection}
              variant="primary-outline"
              size="md"
            >
              <Plus size={16} />
              <span>Add Section</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


const FieldEditor = ({ field, fieldTypes, onUpdate }: any) => {
  const [options, setOptions] = useState(
    field.options && Array.isArray(field.options) 
      ? field.options.join('\n') 
      : ''
  );
  const [validationRules, setValidationRules] = useState(
    field.validationRules ? JSON.stringify(field.validationRules, null, 2) : ''
  );

  const handleOptionsChange = (value: string) => {
    setOptions(value);
    const optionsArray = value.split('\n').filter(opt => opt.trim() !== '');
    onUpdate({ options: optionsArray.length > 0 ? optionsArray : null });
  };

  const handleValidationChange = (value: string) => {
    setValidationRules(value);
    try {
      const rules = value.trim() ? JSON.parse(value) : null;
      onUpdate({ validationRules: rules });
    } catch (e) {
      // Invalid JSON, don't update
    }
  };

  const needsOptions = ['dropdown', 'checkbox'].includes(field.fieldType);

  return (
    <div className="space-y-4 p-4 bg-surface border border-border rounded-lg">
      {/* Field Label */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Field Label *</label>
        <Input 
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Enter field label"
          className="w-full"
        />
      </div>

      {/* Field Type */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Field Type</label>
        <select
          value={field.fieldType}
          onChange={(e) => onUpdate({ fieldType: e.target.value })}
          className="w-full px-3 py-2 border rounded-md">
          {fieldTypes.map((type: any) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Required */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`required-${field.id}`}
          checked={field.required || false}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="rounded"
        />
        <label htmlFor={`required-${field.id}`} className="text-sm font-medium text-text">
          Required field
        </label>
      </div>

      {/* Options (for dropdown and checkbox) */}
      {needsOptions && (
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Options (one per line)
          </label>
          <textarea
            value={options}
            onChange={(e) => handleOptionsChange(e.target.value)}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            className="w-full px-3 py-2 border rounded-md h-24 resize-none"
          />
        </div>
      )}

      {/* Validation Rules */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          Validation Rules (JSON)
        </label>
        <textarea
          value={validationRules}
          onChange={(e) => handleValidationChange(e.target.value)}
          placeholder='{"minLength": 5, "maxLength": 100}'
          className="w-full px-3 py-2 border rounded-md h-20 resize-none font-mono text-sm"
        />
        <div className="text-xs text-text-muted mt-1">
          Examples: {`{"minLength": 5}, {"pattern": "[0-9]+"}`}
        </div>
      </div>
    </div>
  );
};

export default FormDetails;
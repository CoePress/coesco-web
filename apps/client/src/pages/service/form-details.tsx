import { useState } from 'react';
import { Edit, Save, X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import {Button, Input, Card, PageHeader } from '@/components';
import { useNavigate } from 'react-router-dom';

const FormDetails = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "50e236ab-c9ca-4efd-be64-5178a3b41381",
    name: 'Safety Inspection Form',
    description: 'Daily safety inspection checklist for construction sites',
    status: 'Published'
  });

  const [sections, setSections] = useState([
    {
      id: "1",
      title: 'Basic Information',
      description: 'General inspection details',
      isCollapsed: false,
      fields: [
        { id: "1", type: 'text', label: 'Inspector Name', required: true },
        { id: "2", type: 'date', label: 'Inspection Date', required: true },
        { id: "3", type: 'dropdown', label: 'Site Location', required: true, options: ['Site A', 'Site B', 'Site C'] },
      ]
    },
    {
      id: "2",
      title: 'Safety Checks',
      description: 'Safety equipment and procedures',
      isCollapsed: false,
      fields: [
        { id: "4", type: 'checkbox', label: 'PPE Check', required: false },
        { id: "5", type: 'checkbox', label: 'First Aid Kit Available', required: true },
        { id: "6", type: 'dropdown', label: 'Safety Rating', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      ]
    },
    {
      id: "3",
      title: 'Documentation',
      description: 'Photos and additional notes',
      isCollapsed: false,
      fields: [
        { id: "7", type: 'photo', label: 'Site Photos', required: false },
        { id: "8", type: 'textarea', label: 'Additional Notes', required: false },
        { id: "9", type: 'signature', label: 'Inspector Signature', required: true },
      ]
    }
  ]);

  const navigate = useNavigate();

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const addSection = () => {
    const newSection = {
      id: Date.now().toString(),
      title: 'New Section',
      description: '',
      isCollapsed: false,
      fields: []
    };
    setSections([...sections, newSection]);
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, isCollapsed: !section.isCollapsed }
        : section
    ));
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  const addFieldToSection = (sectionId: string) => {
    const newField = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      required: false
    };
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, fields: [...section.fields, newField] }
        : section
    ));
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, fields: section.fields.filter(field => field.id !== fieldId) }
        : section
    ));
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
        ? { ...section, fields: section.fields.map(field => 
            field.id === fieldId ? { ...field, ...updates } : field
          )}
        : section
    ));
  };

  const getFieldTypeColor = (type: string) => {
    const colors = {
      text: 'bg-info/20 text-info',
      date: 'bg-success/20 text-success',
      dropdown: 'bg-primary/20 text-primary',
      checkbox: 'bg-warning/20 text-warning',
      textarea: 'bg-text/10 text-text',
      photo: 'bg-error/10 text-error',
      signature: 'bg-secondary/20 text-secondary',
    };
    return colors[type] || 'bg-surface text-text-muted';
  };

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

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title={formData.name}
        description={formData.description}
        actions={<Actions />}
      />

      <div className="space-y-4 p-4 max-w-4xl mx-auto w-full">
        {sections.map((section, sectionIndex) => (
          <Card key={section.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {isEditing && <GripVertical className="text-text-muted" size={16} />}
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                    Section {sectionIndex + 1}
                  </span>
                  {isEditing && (
                    <button 
                      onClick={() => removeSection(section.id)}
                      className="text-error hover:text-error/80 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                {isEditing ? (
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
                ) : (
                  <div className="cursor-pointer" onClick={() => toggleSectionCollapse(section.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-text mb-1">{section.title}</h3>
                        {section.description && (
                          <p className="text-text-muted">{section.description}</p>
                        )}
                      </div>
                      <button className="p-2 hover:bg-foreground rounded-lg transition-colors">
                        {section.isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {isEditing && (
                <Button 
                  onClick={() => addFieldToSection(section.id)}
                  size="sm"
                  className="ml-4"
                >
                  <Plus size={14} />
                  <span>Add Field</span>
                </Button>
              )}
            </div>

            {!section.isCollapsed && (
              <div className="p-">
                {section.fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <div className="text-text-muted mb-2">
                      <span className="text-lg">No fields in this section yet</span>
                    </div>
                    {isEditing && (
                      <Button 
                        onClick={() => addFieldToSection(section.id)}
                        size="sm"
                      >
                        <Plus size={14} />
                        <span>Add your first field</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.id} className="flex items-center space-x-4 p-4 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors">
                        {isEditing && <GripVertical className="text-text-muted" size={14} />}
                        
                        <div className="flex items-center justify-center w-8 h-8 bg-foreground border border-border rounded-full text-sm font-medium text-text-muted">
                          {fieldIndex + 1}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            {isEditing ? (
                              <Input 
                                value={field.label}
                                onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                                className="font-medium flex-1"
                              />
                            ) : (
                              <span className="font-medium text-text text-lg">{field.label}</span>
                            )}
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getFieldTypeColor(field.type)}`}>
                              {field.type}
                            </span>
                            
                            {field.required && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-error/20 text-error">
                                Required
                              </span>
                            )}
                          </div>
                          
                          {field.options && (
                            <div className="text-sm text-text-muted mt-1">
                              <span className="font-medium">Options:</span> {field.options.join(', ')}
                            </div>
                          )}
                        </div>

                        {isEditing && (
                          <button 
                            onClick={() => removeField(section.id, field.id)}
                            className="text-error hover:text-error/80 p-2 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
        
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

export default FormDetails;
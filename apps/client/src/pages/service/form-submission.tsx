import { useState } from 'react';
import { Save, X, ChevronDown, ChevronUp, Camera, PenTool, Calendar, FileText, CheckSquare, List } from 'lucide-react';
import { Button, Input, Card, PageHeader } from '@/components';
import { useNavigate } from 'react-router-dom';

const FormSubmission = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Using the same mock data structure from form-details.tsx
  const formData = {
    id: "50e236ab-c9ca-4efd-be64-5178a3b41381",
    name: 'Safety Inspection Form',
    description: 'Daily safety inspection checklist for construction sites',
    status: 'Published'
  };

  const sections = [
    {
      id: "1",
      title: 'Basic Information',
      description: 'General inspection details',
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
      fields: [
        { id: "7", type: 'photo', label: 'Site Photos', required: false },
        { id: "8", type: 'textarea', label: 'Additional Notes', required: false },
        { id: "9", type: 'signature', label: 'Inspector Signature', required: true },
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear error when field is filled
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !formValues[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Form submitted:', formValues);
      // Here you would normally send the data to your backend
      navigate('/service/forms');
    }
  };

  const handleCancel = () => {
    navigate('/service/forms');
  };

  const renderFieldInput = (field: any) => {
    const value = formValues[field.id] || '';
    const hasError = !!errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <div className="w-full">
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={hasError ? 'border-error' : ''}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      case 'date':
        return (
          <div className="w-full">
            <div className="relative">
              <Input
                type="date"
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className={`pr-10 ${hasError ? 'border-error' : ''}`}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
            </div>
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      case 'dropdown':
        return (
          <div className="w-full">
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`w-full px-4 py-2 bg-surface border ${hasError ? 'border-error' : 'border-border'} rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors`}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-5 h-5 bg-surface border border-border rounded text-primary focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-text">{field.label}</span>
            {hasError && <span className="text-error text-sm ml-2">{errors[field.id]}</span>}
          </div>
        );

      case 'textarea':
        return (
          <div className="w-full">
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={4}
              className={`w-full px-4 py-2 bg-surface border ${hasError ? 'border-error' : 'border-border'} rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none`}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      case 'photo':
        return (
          <div className="w-full">
            <div className={`border-2 border-dashed ${hasError ? 'border-error' : 'border-border'} rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer`}>
              <Camera className="mx-auto text-text-muted mb-3" size={32} />
              <p className="text-text-muted mb-2">Click to upload photos</p>
              <p className="text-xs text-text-muted">or drag and drop</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFieldChange(field.id, e.target.files)}
                className="hidden"
              />
            </div>
            {value && (
              <div className="mt-2 text-sm text-text-muted">
                {value.length} file(s) selected
              </div>
            )}
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      case 'signature':
        return (
          <div className="w-full">
            <div className={`border-2 border-dashed ${hasError ? 'border-error' : 'border-border'} rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer`}>
              <PenTool className="mx-auto text-text-muted mb-3" size={32} />
              <p className="text-text-muted mb-2">Click to add signature</p>
              <p className="text-xs text-text-muted">Draw your signature</p>
            </div>
            {value && (
              <div className="mt-2 text-sm text-success">
                ✓ Signature added
              </div>
            )}
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText size={16} />;
      case 'date': return <Calendar size={16} />;
      case 'dropdown': return <List size={16} />;
      case 'checkbox': return <CheckSquare size={16} />;
      case 'textarea': return <FileText size={16} />;
      case 'photo': return <Camera size={16} />;
      case 'signature': return <PenTool size={16} />;
      default: return null;
    }
  };

  const Actions = () => (
    <div className="flex gap-2">
      <Button onClick={handleCancel} variant="secondary-outline">
        <X size={16} />
        <span>Cancel</span>
      </Button>
      <Button onClick={handleSubmit}>
        <Save size={16} />
        <span>Submit Form</span>
      </Button>
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title={`Submit: ${formData.name}`}
        description={formData.description}
        actions={<Actions />}
      />

      <div className="space-y-4 p-4 max-w-4xl mx-auto w-full">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-text-muted mb-2">
            <span>Form Progress</span>
            <span>{Object.keys(formValues).length} / {sections.reduce((acc, s) => acc + s.fields.length, 0)} fields</span>
          </div>
          <div className="w-full bg-foreground rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(Object.keys(formValues).length / sections.reduce((acc, s) => acc + s.fields.length, 0)) * 100}%` 
              }}
            />
          </div>
        </div>

        {sections.map((section, sectionIndex) => (
          <Card key={section.id} className="overflow-hidden">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-foreground/50 transition-colors -m-6 p-6"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                  Section {sectionIndex + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-text">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-text-muted">{section.description}</p>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-foreground rounded-lg transition-colors">
                {collapsedSections[section.id] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>

            {!collapsedSections[section.id] && (
              <div className="pt-4 mt-6 border-t border-border space-y-6">
                {section.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-text-muted">{getFieldIcon(field.type)}</div>
                      <label className="text-text font-medium">
                        {field.label}
                        {field.required && <span className="text-error ml-1">*</span>}
                      </label>
                    </div>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}

        {Object.keys(errors).length > 0 && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4">
            <p className="text-error font-medium">Please fix the following errors:</p>
            <ul className="list-disc list-inside mt-2 text-error text-sm">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSubmission;
import { useState, useEffect, useMemo } from 'react';
import { Save, X, ChevronDown, ChevronUp, Camera, PenTool, Calendar, FileText, CheckSquare, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Input, Card, PageHeader, Modal } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

const FormSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, post } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
      setPages(pagesData.sort((a: any, b: any) => a.sequence - b.sequence));
    } else {
      setError(response?.error || "Failed to fetch form");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchForm();
  }, [id]);

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

    pages.forEach(page => {
      page.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.isRequired && !formValues[field.id]) {
            newErrors[field.id] = `${field.label} is required`;
          }
        });
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !id) return;

    try {
      // Create submission data structure
      const submissionData = {
        formId: id,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        data: formValues
      };

      // Post submission to API
      const response = await post(`/forms/${id}/submissions`, submissionData);

      if (response?.success) {
        toast.success('Form submitted successfully!');
        navigate('/service/forms');
      } else {
        const errorMessage = response?.error || 'Failed to submit form';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = 'Failed to submit form. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    // Check if any fields have been filled
    const hasFilledFields = Object.keys(formValues).length > 0;

    if (hasFilledFields) {
      setShowCancelModal(true);
    } else {
      navigate('/service/forms/');
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate('/service/forms/');
  };

  const getTotalFields = () => {
    return pages.reduce((total: number, page: any) => {
      return total + page.sections.reduce((pageTotal: number, section: any) => {
        return pageTotal + (section.fields?.length || 0);
      }, 0);
    }, 0);
  };

  const getCurrentPage = () => pages[currentPageIndex];

  const canGoNext = () => currentPageIndex < pages.length - 1;
  const canGoPrevious = () => currentPageIndex > 0;

  const goToNextPage = () => {
    if (canGoNext()) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (canGoPrevious()) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const renderFieldInput = (field: any) => {
    const value = formValues[field.id] || '';
    const hasError = !!errors[field.id];
    const fieldType = field.controlType;

    switch (fieldType) {
      case 'INPUT':
      case 'TEXTBOX':
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

      case 'DATE_SELECTOR':
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

      case 'DROPDOWN':
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

      case 'MULTI_SELECT':
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

      case 'TEXT_AREA':
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

      case 'CAMERA':
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

      case 'SIGNATURE_PAD':
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

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'INPUT':
      case 'TEXTBOX': return <FileText size={16} />;
      case 'DATE_SELECTOR': return <Calendar size={16} />;
      case 'DROPDOWN': return <List size={16} />;
      case 'MULTI_SELECT': return <CheckSquare size={16} />;
      case 'TEXT_AREA': return <FileText size={16} />;
      case 'CAMERA': return <Camera size={16} />;
      case 'SIGNATURE_PAD': return <PenTool size={16} />;
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
            <span>{Object.keys(formValues).length} / {getTotalFields()} fields</span>
          </div>
          <div className="w-full bg-foreground rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(Object.keys(formValues).length / getTotalFields()) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Page navigation */}
        {pages.length > 1 && (
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={goToPreviousPage}
              disabled={!canGoPrevious()}
              variant="secondary-outline"
              size="sm"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <div className="text-sm text-text-muted">
              Page {currentPageIndex + 1} of {pages.length}
            </div>
            <Button
              onClick={goToNextPage}
              disabled={!canGoNext()}
              variant="secondary-outline"
              size="sm"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {getCurrentPage() && (
          <>
            {/* Page title */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-text">{getCurrentPage().title}</h2>
            </div>

            {/* Sections */}
            {getCurrentPage().sections.map((section: any, sectionIndex: number) => (
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
                {section.fields.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-text-muted">{getFieldIcon(field.controlType)}</div>
                      <label className="text-text font-medium">
                        {field.label}
                        {field.isRequired && <span className="text-error ml-1">*</span>}
                      </label>
                    </div>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            )}
          </Card>
            ))}
          </>
        )}

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

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Form Submission"
        size="xs"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to cancel? You have unsaved changes that will be lost.
          </p>
          <p className="text-text-muted text-sm">
            {Object.keys(formValues).length} field(s) have been filled out.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary-outline"
              onClick={() => setShowCancelModal(false)}
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
            >
              Discard Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FormSubmission;
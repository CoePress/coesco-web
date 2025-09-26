import { useState, useEffect, useMemo } from 'react';
import { Save, X, Camera, PenTool, Calendar, FileText, CheckSquare, List, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button, Input, Card, PageHeader, Modal, DatePicker } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

const FormSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, post } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<GPSLocation | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);

  const include = useMemo(
    () => ["pages.sections.fields"],
    []
  );

  const storageKey = useMemo(() => `form-submission-${id}`, [id]);

  // Get user's GPS location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: GPSLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        setUserLocation(locationData);
        console.log('GPS Location obtained:', locationData);
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const saveToLocalStorage = (values: Record<string, any>) => {
    if (!id) return;
    const dataToSave = {
      formId: id,
      formValues: values,
      currentPageIndex,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  };

  const loadFromLocalStorage = () => {
    if (!id) return null;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
        return null;
      }
    }
    return null;
  };

  const clearLocalStorage = () => {
    if (!id) return;
    localStorage.removeItem(storageKey);
  };

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

      // Check for saved progress after form is loaded
      const saved = loadFromLocalStorage();
      if (saved && saved.formValues && Object.keys(saved.formValues).length > 0) {
        setSavedProgress(saved);
        setShowContinueModal(true);
      }
    } else {
      setError(response?.error || "Failed to fetch form");
    }

    setLoading(false);
  };

  useEffect(() => {
    getUserLocation();
    fetchForm();
  }, [id]);

  // Auto-save on form value changes
  useEffect(() => {
    if (getFilledFieldsCount() > 0) {
      saveToLocalStorage(formValues);
    }
  }, [formValues, currentPageIndex]);


  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => {
      const newValues = { ...prev };
      // If value is empty, remove the key entirely
      if (value === '' || value === null || value === undefined) {
        delete newValues[fieldId];
      } else {
        newValues[fieldId] = value;
      }
      // Save to local storage will happen via useEffect
      return newValues;
    });
    // Clear error when field is filled
    if (errors[fieldId] && value) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleContinueProgress = () => {
    if (savedProgress) {
      setFormValues(savedProgress.formValues || {});
      setCurrentPageIndex(savedProgress.currentPageIndex || 0);
      toast.success('Continuing from where you left off');
    }
    setShowContinueModal(false);
  };

  const handleStartNew = () => {
    clearLocalStorage();
    setFormValues({});
    setCurrentPageIndex(0);
    toast.info('Starting fresh form submission');
    setShowContinueModal(false);
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
        data: {
          ...formValues,
          _gpsLocation: userLocation || null
        }
      };

      // Post submission to API
      const response = await post(`/forms/${id}/submissions`, submissionData);

      if (response?.success) {
        // Clear local storage on successful submission
        clearLocalStorage();
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
    const hasFilledFields = getFilledFieldsCount() > 0;

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

  const getFilledFieldsCount = () => {
    return Object.entries(formValues).filter(([_, value]) => {
      // Count as filled only if value is not empty/null/undefined
      return value !== '' && value !== null && value !== undefined;
    }).length;
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

    // Special handling for GPS location field
    if (field.label === 'Current Location (GPS)') {
      return (
        <div className="w-full">
          <div className="px-3 py-1.5 min-h-[34px] flex items-center bg-surface border border-border rounded-sm text-text">
            {userLocation ? (
              <span className="font-mono">{userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</span>
            ) : (
              <span className="text-text-muted">Getting GPS location...</span>
            )}
          </div>
        </div>
      );
    }

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
            <DatePicker
              value={value}
              onChange={(date) => handleFieldChange(field.id, date)}
              placeholder={`Select ${field.label.toLowerCase()}`}
              className={hasError ? 'border-error' : ''}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      case 'DROPDOWN':
        // Handle options - could be an array directly or nested in the options object
        const dropdownOptions = Array.isArray(field.options) ? field.options : [];

        return (
          <div className="w-full">
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`w-full px-3 py-1.5 min-h-[34px] bg-surface border ${hasError ? 'border-error' : 'border-border'} rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors`}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {dropdownOptions.map((option: any, index: number) => {
                // Handle both string options and object options
                if (typeof option === 'string') {
                  return <option key={option} value={option}>{option}</option>;
                } else if (option && typeof option === 'object') {
                  return <option key={option.value || index} value={option.value}>{option.label}</option>;
                }
                return null;
              })}
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
              className={`w-full px-3 py-1.5 bg-surface border ${hasError ? 'border-error' : 'border-border'} rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none`}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[field.id]}</span>}
          </div>
        );

      case 'CAMERA':
        return (
          <div className="w-full">
            <div className={`border-2 border-dashed ${hasError ? 'border-error' : 'border-border'} rounded-sm p-8 text-center hover:border-primary/50 transition-colors cursor-pointer`}>
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
            <div className={`border-2 border-dashed ${hasError ? 'border-error' : 'border-border'} rounded-sm p-8 text-center hover:border-primary/50 transition-colors cursor-pointer`}>
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

  const getFieldIcon = (fieldType: string, field?: any) => {
    switch (fieldType) {
      case 'INPUT':
      case 'TEXTBOX':
        // Check if this is a GPS field by label
        if (field && field.label === 'Current Location (GPS)') {
          return <MapPin size={16} />;
        }
        return <FileText size={16} />;
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
            <span>{getFilledFieldsCount()} / {getTotalFields()} fields</span>
          </div>
          <div className="w-full bg-foreground rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(getFilledFieldsCount() / getTotalFields()) * 100}%`
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
          <Card key={section.id} className="">
            <div className="space-y-6">
                {section.fields.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-text-muted">{getFieldIcon(field.controlType, field)}</div>
                      <label className="text-text font-medium">
                        {field.label}
                        {field.isRequired && <span className="text-error ml-1">*</span>}
                      </label>
                    </div>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
          </Card>
            ))}
          </>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="bg-error/10 border border-error/20 rounded-sm p-4">
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
            Are you sure you want to cancel? Your progress has been saved and you can continue later.
          </p>
          <p className="text-text-muted text-sm">
            {getFilledFieldsCount()} field(s) have been filled out.
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
              Leave Form
            </Button>
          </div>
        </div>
      </Modal>

      {/* Continue Progress Modal */}
      <Modal
        isOpen={showContinueModal}
        onClose={() => {}}
        title="Continue Previous Submission?"
        size="xs"
      >
        <div className="space-y-4">
          <p>
            You have a saved form submission in progress. Would you like to continue where you left off?
          </p>
          {savedProgress && (
            <div className="text-text-muted text-sm space-y-1">
              <p>{Object.keys(savedProgress.formValues || {}).length} field(s) already filled</p>
              <p>Last saved: {new Date(savedProgress.savedAt).toLocaleString()}</p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary-outline"
              onClick={handleStartNew}
            >
              Start New
            </Button>
            <Button
              onClick={handleContinueProgress}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FormSubmission;
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
  const [conditionalRules, setConditionalRules] = useState<any[]>([]);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const [disabledElements, setDisabledElements] = useState<Set<string>>(new Set());
  const [requiredFields, setRequiredFields] = useState<Set<string>>(new Set());

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
    console.log('fetchForm called with id:', id);
    if (!id) {
      console.log('No ID, returning early');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('Fetching form and rules for ID:', id);

    // Fetch form data first
    const formResponse = await get(`/forms/${id}`, { include });
    console.log('Form response:', formResponse);

    // Then fetch conditional rules
    console.log('Now fetching conditional rules...');
    const rulesResponse = await get(`/forms/${id}/conditional-rules`);
    console.log('Rules response:', rulesResponse);

    if (formResponse?.success && formResponse.data) {
      setFormData(formResponse.data);
      const pagesData = formResponse.data.pages?.map((page: any) => ({
        ...page,
        sections: page.sections?.map((section: any) => ({
          ...section,
          fields: section.fields || []
        })) || []
      })) || [];
      setPages(pagesData.sort((a: any, b: any) => a.sequence - b.sequence));

      // Set initial required fields based on form definition
      const initialRequired = new Set<string>();
      pagesData.forEach((page: any) => {
        page.sections.forEach((section: any) => {
          section.fields.forEach((field: any) => {
            if (field.isRequired) {
              initialRequired.add(field.id);
            }
          });
        });
      });
      setRequiredFields(initialRequired);

      // Check for saved progress after form is loaded
      const saved = loadFromLocalStorage();
      if (saved && saved.formValues && Object.keys(saved.formValues).length > 0) {
        setSavedProgress(saved);
        setShowContinueModal(true);
      }
    } else {
      setError(formResponse?.error || "Failed to fetch form");
    }

    // Set conditional rules if available
    if (rulesResponse?.success && rulesResponse.data) {
      // The backend returns either an array directly or wrapped in items
      const rules = Array.isArray(rulesResponse.data) ? rulesResponse.data : (rulesResponse.data.items || []);
      setConditionalRules(rules);
      console.log('Loaded conditional rules:', rules);
    }

    setLoading(false);
  };

  // Evaluate conditional rules whenever form values change
  const evaluateConditionalRules = () => {
    const newHidden = new Set<string>();
    const newDisabled = new Set<string>();
    const newRequired = new Set<string>();

    // Start with initially required fields
    pages.forEach((page: any) => {
      page.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.isRequired) {
            newRequired.add(field.id);
          }
        });
      });
    });

    // Initially hide all pages/sections/fields that have SHOW rules
    conditionalRules.forEach((rule: any) => {
      if (!rule.isActive) return;
      if (rule.action === 'SHOW') {
        // Initially hide elements that need to be shown conditionally
        newHidden.add(rule.targetId);
      }
    });

    // Apply conditional rules based on form values
    conditionalRules.forEach((rule: any) => {
      if (!rule.isActive) return;

      const conditions = Array.isArray(rule.conditions) ? rule.conditions :
                        (rule.conditions ? [rule.conditions] : []);

      // Evaluate conditions based on operator (AND/OR)
      let conditionsMet = false;
      if (rule.operator === 'OR') {
        conditionsMet = conditions.some((condition: any) =>
          evaluateCondition(condition, formValues)
        );
      } else {
        // Default to AND
        conditionsMet = conditions.every((condition: any) =>
          evaluateCondition(condition, formValues)
        );
      }

      if (conditionsMet) {
        // Apply the action
        switch (rule.action) {
          case 'SHOW':
            // Remove from hidden (show the element)
            newHidden.delete(rule.targetId);
            break;
          case 'HIDE':
            newHidden.add(rule.targetId);
            break;
          case 'ENABLE':
            newDisabled.delete(rule.targetId);
            break;
          case 'DISABLE':
            newDisabled.add(rule.targetId);
            break;
          case 'REQUIRE':
            newRequired.add(rule.targetId);
            break;
          case 'OPTIONAL':
            newRequired.delete(rule.targetId);
            break;
        }
      }
    });

    // Handle cascading dependencies - if "2nd Customer" is not "yes",
    // then "Third Customer" field's value should be ignored
    if (formValues["2nd Customer"] !== "yes") {
      // Find and hide any rules that depend on "Third Customer"
      conditionalRules.forEach((rule: any) => {
        const conditions = Array.isArray(rule.conditions) ? rule.conditions :
                          (rule.conditions ? [rule.conditions] : []);

        // Check if this rule depends on "Third Customer"
        const dependsOnThirdCustomer = conditions.some((condition: any) =>
          condition.fieldVariable === "Third Customer"
        );

        if (dependsOnThirdCustomer && rule.action === 'SHOW') {
          // Force hide elements that depend on Third Customer when 2nd Customer is not yes
          newHidden.add(rule.targetId);
        }
      });
    }

    console.log('Hidden elements:', Array.from(newHidden));
    console.log('Current form values:', formValues);

    setHiddenElements(newHidden);
    setDisabledElements(newDisabled);
    setRequiredFields(newRequired);
  };

  const evaluateCondition = (condition: any, values: Record<string, any>) => {
    // The condition uses fieldVariable from the API
    const fieldVariable = condition.fieldVariable || condition.field;
    const fieldValue = values[fieldVariable];
    const operator = condition.operator;
    const value = condition.value;

    console.log('Evaluating condition:', { fieldVariable, fieldValue, operator, value });

    switch (operator) {
      case 'equals':
      case '=':
        return fieldValue === value;
      case 'not_equals':
      case '!=':
        return fieldValue !== value;
      case 'contains':
        return fieldValue && String(fieldValue).includes(value);
      case 'not_contains':
        return !fieldValue || !String(fieldValue).includes(value);
      case 'empty':
        return !fieldValue || fieldValue === '';
      case 'not_empty':
        return fieldValue && fieldValue !== '';
      case 'greater_than':
      case '>':
        return Number(fieldValue) > Number(value);
      case 'less_than':
      case '<':
        return Number(fieldValue) < Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  };

  useEffect(() => {
    console.log('useEffect triggered with id:', id);
    getUserLocation();
    console.log('About to call fetchForm...');
    fetchForm();
    console.log('fetchForm call completed');
  }, [id]);

  // Evaluate rules when form values or rules change
  useEffect(() => {
    if (conditionalRules.length > 0) {
      evaluateConditionalRules();
    }
  }, [formValues, conditionalRules]);

  // Auto-save on form value changes
  useEffect(() => {
    if (getFilledFieldsCount() > 0) {
      saveToLocalStorage(formValues);
    }
  }, [formValues, currentPageIndex]);


  const handleFieldChange = (field: any, value: any) => {
    // Use the field's variable name as the key
    const fieldKey = field.variable || field.id;

    setFormValues(prev => {
      const newValues = { ...prev };
      // If value is empty, remove the key entirely
      if (value === '' || value === null || value === undefined) {
        delete newValues[fieldKey];
      } else {
        newValues[fieldKey] = value;
      }
      console.log('Form values updated:', newValues);
      // Save to local storage will happen via useEffect
      return newValues;
    });
    // Clear error when field is filled
    if (errors[fieldKey] && value) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
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
      // Skip hidden pages
      if (hiddenElements.has(page.id)) return;

      page.sections.forEach((section: any) => {
        // Skip hidden sections
        if (hiddenElements.has(section.id)) return;

        section.fields.forEach((field: any) => {
          // Skip hidden fields
          if (hiddenElements.has(field.id)) return;

          // Check if field is required (either originally or by conditional rule)
          if (requiredFields.has(field.id) && !formValues[field.id]) {
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
      // Skip hidden pages
      if (hiddenElements.has(page.id)) return total;

      return total + page.sections.reduce((pageTotal: number, section: any) => {
        // Skip hidden sections
        if (hiddenElements.has(section.id)) return pageTotal;

        // Count only non-hidden fields
        const visibleFields = section.fields?.filter((field: any) =>
          !hiddenElements.has(field.variable || field.id)
        ) || [];

        return pageTotal + visibleFields.length;
      }, 0);
    }, 0);
  };

  const getFilledFieldsCount = () => {
    return Object.entries(formValues).filter(([_, value]) => {
      // Count as filled only if value is not empty/null/undefined
      return value !== '' && value !== null && value !== undefined;
    }).length;
  };

  // Get only visible pages
  const getVisiblePages = () => {
    return pages.filter((page: any) => !hiddenElements.has(page.id));
  };

  const getCurrentPage = () => {
    const visiblePages = getVisiblePages();
    return visiblePages[currentPageIndex];
  };

  const canGoNext = () => {
    const visiblePages = getVisiblePages();
    return currentPageIndex < visiblePages.length - 1;
  };

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
    const fieldKey = field.variable || field.id;
    const value = formValues[fieldKey] || '';
    const hasError = !!errors[fieldKey];
    const fieldType = field.controlType;
    const isDisabled = disabledElements.has(fieldKey) || field.isReadOnly;

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
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={hasError ? 'border-error' : ''}
              disabled={isDisabled}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
          </div>
        );

      case 'DATE_SELECTOR':
        return (
          <div className="w-full">
            <DatePicker
              value={value}
              onChange={(date) => handleFieldChange(field, date)}
              placeholder={`Select ${field.label.toLowerCase()}`}
              className={hasError ? 'border-error' : ''}
              disabled={isDisabled}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
          </div>
        );

      case 'DROPDOWN':
        // Handle options - could be an array directly or nested in the options object
        const dropdownOptions = Array.isArray(field.options) ? field.options : [];

        return (
          <div className="w-full">
            <select
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`w-full px-3 py-1.5 min-h-[34px] bg-surface border ${hasError ? 'border-error' : 'border-border'} rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isDisabled}
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
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
          </div>
        );

      case 'MULTI_SELECT':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              className="w-5 h-5 bg-surface border border-border rounded text-primary focus:ring-2 focus:ring-primary/50"
              disabled={isDisabled}
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
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={4}
              className={`w-full px-3 py-1.5 bg-surface border ${hasError ? 'border-error' : 'border-border'} rounded-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isDisabled}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
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
                onChange={(e) => handleFieldChange(field, e.target.files)}
                className="hidden"
              />
            </div>
            {value && (
              <div className="mt-2 text-sm text-text-muted">
                {value.length} file(s) selected
              </div>
            )}
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
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
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
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
        {getVisiblePages().length > 1 && (
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
              Page {currentPageIndex + 1} of {getVisiblePages().length}
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
            {getCurrentPage().sections
              .filter((section: any) => !hiddenElements.has(section.id))
              .map((section: any) => (
                <Card key={section.id} className="">
                  <div className="space-y-6">
                    {section.fields
                      .filter((field: any) => !hiddenElements.has(field.id))
                      .map((field: any) => (
                        <div key={field.id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="text-text-muted">{getFieldIcon(field.controlType, field)}</div>
                            <label className="text-text font-medium">
                              {field.label}
                              {requiredFields.has(field.id) && <span className="text-error ml-1">*</span>}
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
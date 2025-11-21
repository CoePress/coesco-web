import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Save, X, Camera, PenTool, Calendar, FileText, CheckSquare, List, ChevronLeft, ChevronRight, MapPin, Wand2, Cloud, CloudOff, Clock } from 'lucide-react';
import { Button, Input, Card, PageHeader, Modal, DatePicker, TimePicker, SignaturePad, CameraUpload, SketchPad } from '@/components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { __dev__ } from '@/config/env';
import { FormSubmissionStatus } from '@coesco/types';

interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

const FormSubmit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { get, post, patch } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const isAdminContext = location.pathname.startsWith('/admin');
  const isSalesContext = location.pathname.startsWith('/sales');
  const basePath = isAdminContext ? '/admin/forms' : isSalesContext ? '/sales/forms' : '/service/forms';

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
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const include = useMemo(
    () => ["pages.sections.fields"],
    []
  );

  const storageKey = useMemo(() => `form-submission-${id}`, [id]);

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

  const autoSaveDraft = useCallback(async () => {
    if (!id) return;

    const visibleFieldVariables = new Set<string>();

    pages.forEach((page: any) => {
      if (hiddenElements.has(page.id)) return;
      page.sections.forEach((section: any) => {
        if (hiddenElements.has(section.id)) return;
        section.fields.forEach((field: any) => {
          if (hiddenElements.has(field.id)) return;
          const fieldKey = field.variable || field.id;
          visibleFieldVariables.add(fieldKey);
        });
      });
    });

    const filledFields = Object.entries(formValues).filter(([fieldKey, value]) => {
      return visibleFieldVariables.has(fieldKey) &&
             value !== '' && value !== null && value !== undefined;
    });

    if (filledFields.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const filteredFormValues = Object.fromEntries(filledFields);

      const submissionData = {
        formId: id,
        status: FormSubmissionStatus.DRAFT,
        answers: {
          ...filteredFormValues,
          _gpsLocation: userLocation || null
        }
      };

      let response;
      if (draftSubmissionId) {
        response = await patch(`/forms/${id}/submissions/${draftSubmissionId}`, submissionData);
      } else {
        response = await post(`/forms/${id}/submissions`, submissionData);
        if (response?.success && response.data?.id) {
          setDraftSubmissionId(response.data.id);
        }
      }

      if (response?.success) {
        setLastSaved(new Date());
        setSaveError(null);
      } else {
        setSaveError(response?.error || 'Failed to auto-save');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveError('Failed to auto-save draft');
    } finally {
      setIsSaving(false);
    }
  }, [id, formValues, pages, hiddenElements, userLocation, draftSubmissionId, post, patch]);

  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveDraft();
    }, 3000);
  }, [autoSaveDraft]);

  const autoFillForm = () => {
    if (!__dev__) return;

    const testData: Record<string, any> = {};

    testData['2nd Customer'] = 'no';
    testData['Third Customer'] = 'no';
    testData['In House'] = 'no';

    pages.forEach((page: any) => {
      if (page.label === 'Customer Information 2' ||
          page.label === 'Customer Information 3' ||
          page.label === 'Did you visit a third customer?') {
        return;
      }

      page.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          const fieldKey = field.variable || field.id;

          if (testData[fieldKey] !== undefined) return;

          switch (field.controlType) {
            case 'DROPDOWN':
              const options = Array.isArray(field.options) ? field.options : [];
              if (options.length > 0) {
                const firstOption = options[0];
                if (typeof firstOption === 'string') {
                  testData[fieldKey] = firstOption;
                } else if (firstOption && typeof firstOption === 'object') {
                  if (fieldKey === '2nd Customer' || fieldKey === 'Third Customer' || fieldKey === 'In House') {
                    const noOption = options.find((opt: any) => opt.value === 'no');
                    testData[fieldKey] = noOption ? noOption.value : firstOption.value;
                  } else {
                    testData[fieldKey] = firstOption.value;
                  }
                }
              }
              break;

            case 'DATE_SELECTOR':
              testData[fieldKey] = new Date().toISOString().split('T')[0];
              break;

            case 'TIME_SELECTOR':
              if (field.label.toLowerCase().includes('start')) {
                testData[fieldKey] = '08:00';
              } else if (field.label.toLowerCase().includes('end')) {
                testData[fieldKey] = '17:00';
              } else {
                testData[fieldKey] = '12:00';
              }
              break;

            case 'TEXTBOX':
            case 'INPUT':
              if (field.variable === 'Tech Name' || field.label === 'Technician Name') {
                const techOptions = Array.isArray(field.options) ? field.options : [];
                if (techOptions.length > 0) {
                  const firstTech = techOptions[0];
                  testData[fieldKey] = typeof firstTech === 'object' ? firstTech.value : 'Test Technician';
                } else {
                  testData[fieldKey] = 'Test Technician';
                }
              } else if (field.label.includes('Customer Name') || field.variable.includes('Company Name')) {
                testData[fieldKey] = 'Test Company Inc.';
              } else if (field.label.includes('Service Job Number') || field.variable.includes('Service Number')) {
                testData[fieldKey] = 'SVC-' + Math.floor(Math.random() * 10000);
              } else if (field.label.includes('Machine Serial') || field.variable.includes('Machine Number')) {
                testData[fieldKey] = 'MSN-' + Math.floor(Math.random() * 100000);
              } else if (field.label.includes('Customer Contact')) {
                testData[fieldKey] = 'John Doe';
              } else if (field.label.includes('Customer Email')) {
                testData[fieldKey] = 'test@example.com';
              } else if (field.label.includes('Customer Phone')) {
                testData[fieldKey] = '555-0100';
              } else if (field.label.includes('Type Customer Name')) {
                testData[fieldKey] = 'John Doe';
              } else if (field.label.includes('Current Location') && !field.label.includes('GPS')) {
                testData[fieldKey] = '123 Test Street, Test City, TC 12345';
              } else if (field.label.includes('Daily Summary')) {
                testData[fieldKey] = 'Completed routine maintenance and system checks. All systems operational.';
              } else {
                testData[fieldKey] = 'Test ' + field.label;
              }
              break;

            case 'TEXT_AREA':
              if (field.label.includes('Report') || field.variable === 'Remarks') {
                testData[fieldKey] = 'Performed scheduled maintenance. Checked all systems and components. Everything is working properly. No issues found.';
              } else {
                testData[fieldKey] = 'Test notes for ' + field.label;
              }
              break;

            case 'STAMP':
              break;

            case 'SIGNATURE_PAD':
              // Generate a simple test signature as base64 data URL
              testData[fieldKey] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
              break;

            case 'CAMERA':
              // Will be handled by CameraUpload component
              break;

            case 'SKETCH_PAD':
              // Will be handled by SketchPad component
              break;

            default:
              testData[fieldKey] = 'Test ' + field.label;
          }
        });
      });
    });

    setFormValues(testData);
    toast.success('Form auto-filled with test data');
  };

  const fetchForm = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);

    const formResponse = await get(`/forms/${id}`, { include });
    const rulesResponse = await get(`/forms/${id}/conditional-rules`);

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

      const saved = loadFromLocalStorage();
      if (saved && saved.formValues && Object.keys(saved.formValues).length > 0) {
        setSavedProgress(saved);
        setShowContinueModal(true);
      }
    } else {
      setError(formResponse?.error || "Failed to fetch form");
    }

    if (rulesResponse?.success && rulesResponse.data) {
      const rules = Array.isArray(rulesResponse.data) ? rulesResponse.data : (rulesResponse.data.items || []);
      setConditionalRules(rules);
    }

    setLoading(false);
  };

  const evaluateConditionalRules = () => {
    const newHidden = new Set<string>();
    const newDisabled = new Set<string>();
    const newRequired = new Set<string>();

    pages.forEach((page: any) => {
      page.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.isRequired) {
            newRequired.add(field.id);
          }
        });
      });
    });

    conditionalRules.forEach((rule: any) => {
      if (!rule.isActive) return;
      if (rule.action === 'SHOW') {
        newHidden.add(rule.targetId);
      }
    });

    conditionalRules.forEach((rule: any) => {
      if (!rule.isActive) return;

      const conditions = Array.isArray(rule.conditions) ? rule.conditions :
                        (rule.conditions ? [rule.conditions] : []);

      let conditionsMet = false;
      if (rule.operator === 'OR') {
        conditionsMet = conditions.some((condition: any) =>
          evaluateCondition(condition, formValues)
        );
      } else {
        conditionsMet = conditions.every((condition: any) =>
          evaluateCondition(condition, formValues)
        );
      }

      if (conditionsMet) {
        switch (rule.action) {
          case 'SHOW':
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

    if (formValues["2nd Customer"] !== "yes") {
      conditionalRules.forEach((rule: any) => {
        const conditions = Array.isArray(rule.conditions) ? rule.conditions :
                          (rule.conditions ? [rule.conditions] : []);

        const dependsOnThirdCustomer = conditions.some((condition: any) =>
          condition.fieldVariable === "Third Customer"
        );

        if (dependsOnThirdCustomer && rule.action === 'SHOW') {
          newHidden.add(rule.targetId);
        }
      });
    }

    setHiddenElements(newHidden);
    setDisabledElements(newDisabled);
    setRequiredFields(newRequired);
  };

  const evaluateCondition = (condition: any, values: Record<string, any>) => {
    const fieldVariable = condition.fieldVariable || condition.field;
    const fieldValue = values[fieldVariable];
    const operator = condition.operator;
    const value = condition.value;

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
    getUserLocation();
    fetchForm();
  }, [id]);

  useEffect(() => {
    if (conditionalRules.length > 0) {
      evaluateConditionalRules();
    }
  }, [formValues, conditionalRules]);

  useEffect(() => {
    if (getFilledFieldsCount() > 0) {
      saveToLocalStorage(formValues);
      debouncedAutoSave();
    }
  }, [formValues, currentPageIndex]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);


  const handleFieldChange = (field: any, value: any) => {
    const fieldKey = field.variable || field.id;

    setFormValues(prev => {
      const newValues = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete newValues[fieldKey];
      } else {
        newValues[fieldKey] = value;
      }
      return newValues;
    });
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

    // Only validate currently visible pages
    const visiblePages = getVisiblePages();

    visiblePages.forEach(page => {
      page.sections.forEach((section: any) => {
        if (hiddenElements.has(section.id)) return;

        section.fields.forEach((field: any) => {
          if (hiddenElements.has(field.id)) return;

          const fieldKey = field.variable || field.id;

          // Only validate required fields that are currently visible and active
          if (requiredFields.has(field.id) && !formValues[fieldKey]) {
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
      const visibleFieldVariables = new Set<string>();

      pages.forEach((page: any) => {
        if (hiddenElements.has(page.id)) return;
        page.sections.forEach((section: any) => {
          if (hiddenElements.has(section.id)) return;
          section.fields.forEach((field: any) => {
            if (hiddenElements.has(field.id)) return;
            const fieldKey = field.variable || field.id;
            visibleFieldVariables.add(fieldKey);
          });
        });
      });

      const filteredFormValues = Object.fromEntries(
        Object.entries(formValues).filter(([fieldKey]) =>
          visibleFieldVariables.has(fieldKey)
        )
      );

      const submissionData = {
        formId: id,
        status: FormSubmissionStatus.SUBMITTED,
        answers: {
          ...filteredFormValues,
          _gpsLocation: userLocation || null
        }
      };

      let response;
      if (draftSubmissionId) {
        response = await patch(`/forms/${id}/submissions/${draftSubmissionId}`, submissionData);
      } else {
        response = await post(`/forms/${id}/submissions`, submissionData);
      }

      if (response?.success) {
        clearLocalStorage();
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        toast.success('Form submitted successfully!');
        navigate(`${basePath}/${id}`);
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
    const hasFilledFields = getFilledFieldsCount() > 0;

    if (hasFilledFields) {
      setShowCancelModal(true);
    } else {
      navigate(`${basePath}/${id}`);
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate(`${basePath}/${id}`);
  };

  const getTotalFields = () => {
    return pages.reduce((total: number, page: any) => {
      if (hiddenElements.has(page.id)) return total;

      return total + page.sections.reduce((pageTotal: number, section: any) => {
        if (hiddenElements.has(section.id)) return pageTotal;

        const visibleFields = section.fields?.filter((field: any) =>
          !hiddenElements.has(field.variable || field.id)
        ) || [];

        return pageTotal + visibleFields.length;
      }, 0);
    }, 0);
  };

  const getFilledFieldsCount = () => {
    const visibleFieldVariables = new Set<string>();

    pages.forEach((page: any) => {
      if (hiddenElements.has(page.id)) return;

      page.sections.forEach((section: any) => {
        if (hiddenElements.has(section.id)) return;

        section.fields.forEach((field: any) => {
          if (hiddenElements.has(field.id)) return;

          const fieldKey = field.variable || field.id;
          visibleFieldVariables.add(fieldKey);
        });
      });
    });

    return Object.entries(formValues).filter(([fieldKey, value]) => {
      return visibleFieldVariables.has(fieldKey) &&
             value !== '' && value !== null && value !== undefined;
    }).length;
  };

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

      case 'TIME_SELECTOR':
        return (
          <div className="w-full">
            <TimePicker
              value={value}
              onChange={(time) => handleFieldChange(field, time)}
              placeholder={`Select ${field.label.toLowerCase()}`}
              className={hasError ? 'border-error' : ''}
              disabled={isDisabled}
            />
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
          </div>
        );

      case 'DROPDOWN':
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
          <div className="w-full space-y-2">
            <CameraUpload
              formId={id || ''}
              value={value || []}
              onChange={(files) => handleFieldChange(field, files)}
              disabled={isDisabled}
              className={hasError ? 'border-error' : ''}
            />
            {value && Array.isArray(value) && value.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                {value.map((file: any, index: number) => (
                  <div key={file.id || index} className="border border-border rounded overflow-hidden group relative">
                    <img
                      src={file.url}
                      alt={file.originalName || `Image ${index + 1}`}
                      className="w-full h-32 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => window.open(file.url, '_blank')}
                      title={file.originalName || 'Click to view full size'}
                    />
                    {file.originalName && (
                      <div className="p-1 bg-surface text-xs text-text-muted truncate">
                        {file.originalName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
          </div>
        );

      case 'SIGNATURE_PAD':
        return (
          <div className="w-full space-y-2">
            {value && typeof value === 'string' && value.startsWith('data:image/') ? (
              <div className="space-y-2">
                <div className="border border-border rounded p-2 bg-white inline-block">
                  <img
                    src={value}
                    alt="Signature"
                    className="max-w-[400px] max-h-[200px] object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary-outline"
                  size="sm"
                  onClick={() => handleFieldChange(field, '')}
                  disabled={isDisabled}
                >
                  Clear Signature
                </Button>
              </div>
            ) : (
              <SignaturePad
                value={value}
                onChange={(signature) => handleFieldChange(field, signature)}
                disabled={isDisabled}
                className={hasError ? 'border-error' : ''}
              />
            )}
            {hasError && <span className="text-error text-sm mt-1">{errors[fieldKey]}</span>}
          </div>
        );

      case 'SKETCH_PAD':
        return (
          <div className="w-full space-y-2">
            {value && typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('http')) ? (
              <div className="space-y-2">
                <div className="border border-border rounded p-2 bg-white inline-block">
                  <img
                    src={value}
                    alt="Sketch"
                    className="max-w-[600px] max-h-[400px] object-contain cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => window.open(value, '_blank')}
                    title="Click to view full size"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary-outline"
                  size="sm"
                  onClick={() => handleFieldChange(field, '')}
                  disabled={isDisabled}
                >
                  Clear Sketch
                </Button>
              </div>
            ) : (
              <SketchPad
                formId={id || ''}
                value={value}
                onChange={(sketchUrl) => handleFieldChange(field, sketchUrl)}
                disabled={isDisabled}
                className={hasError ? 'border-error' : ''}
              />
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
        if (field && field.label === 'Current Location (GPS)') {
          return <MapPin size={16} />;
        }
        return <FileText size={16} />;
      case 'DATE_SELECTOR': return <Calendar size={16} />;
      case 'TIME_SELECTOR': return <Clock size={16} />;
      case 'DROPDOWN': return <List size={16} />;
      case 'MULTI_SELECT': return <CheckSquare size={16} />;
      case 'TEXT_AREA': return <FileText size={16} />;
      case 'CAMERA': return <Camera size={16} />;
      case 'SIGNATURE_PAD': return <PenTool size={16} />;
      default: return null;
    }
  };

  const Actions = () => (
    <div className="flex gap-2 items-center">
      {lastSaved && !isSaving && (
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Cloud size={14} className="text-success" />
          <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
        </div>
      )}
      {isSaving && (
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Cloud size={14} className="animate-pulse" />
          <span>Saving...</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-1 text-xs text-error">
          <CloudOff size={14} />
          <span>Save failed</span>
        </div>
      )}
      {__dev__ && (
        <Button onClick={autoFillForm} variant="secondary">
          <Wand2 size={16} />
          <span>Auto-fill</span>
        </Button>
      )}
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
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-text">{getCurrentPage().title}</h2>
            </div>

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

export default FormSubmit;
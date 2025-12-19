import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Loader2,
  FileText,
  Calendar,
  List,
  CheckSquare,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";

interface Field {
  id: string;
  label: string;
  variable: string;
  controlType: string;
  dataType: string;
  isRequired: boolean;
  isReadOnly?: boolean;
  sequence: number;
  options?: { value: string; label: string }[] | string[];
}

interface Section {
  id: string;
  title: string;
  description?: string;
  sequence: number;
  fields: Field[];
}

interface Page {
  id: string;
  title: string;
  sequence: number;
  sections: Section[];
}

interface Form {
  id: string;
  name: string;
  description?: string;
  status: string;
  pages: Page[];
}

interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface ConditionalRule {
  id: string;
  isActive: boolean;
  action: "SHOW" | "HIDE" | "ENABLE" | "DISABLE" | "REQUIRE" | "OPTIONAL";
  targetId: string;
  operator: "AND" | "OR";
  conditions: {
    fieldVariable: string;
    operator: string;
    value: string;
  }[];
}

const FormSubmit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { get, post, isLoading: isSubmitting } = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{
    formValues: Record<string, unknown>;
    currentPageIndex: number;
    savedAt: string;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<GPSLocation | null>(null);
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>([]);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const [requiredFields, setRequiredFields] = useState<Set<string>>(new Set());

  const storageKey = useMemo(() => `form-submission-${id}`, [id]);

  const getUserLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const saveToLocalStorage = (values: Record<string, unknown>) => {
    if (!id) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        formId: id,
        formValues: values,
        currentPageIndex,
        savedAt: new Date().toISOString(),
      })
    );
  };

  const loadFromLocalStorage = () => {
    if (!id) return null;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };

  const clearLocalStorage = () => {
    if (id) localStorage.removeItem(storageKey);
  };

  const fetchForm = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const formResult = await get(
        `/forms/${id}?include=${JSON.stringify(["pages.sections.fields"])}`
      );
      const rulesResult = await get(`/forms/${id}/conditional-rules`);

      if (formResult.data?.success && formResult.data.data) {
        const formData = formResult.data.data as Form;
        setForm(formData);

        const pagesData =
          formData.pages?.map((page) => ({
            ...page,
            sections:
              page.sections?.map((section) => ({
                ...section,
                fields: section.fields || [],
              })) || [],
          })) || [];

        setPages(pagesData.sort((a, b) => a.sequence - b.sequence));

        const initialRequired = new Set<string>();
        pagesData.forEach((page) => {
          page.sections.forEach((section) => {
            section.fields.forEach((field) => {
              if (field.isRequired) {
                initialRequired.add(field.id);
              }
            });
          });
        });
        setRequiredFields(initialRequired);

        const saved = loadFromLocalStorage();
        if (saved?.formValues && Object.keys(saved.formValues).length > 0) {
          setSavedProgress(saved);
          setShowContinueModal(true);
        }
      } else {
        setError("Failed to fetch form");
      }

      if (rulesResult.data?.success && rulesResult.data.data) {
        const rules = Array.isArray(rulesResult.data.data)
          ? rulesResult.data.data
          : rulesResult.data.data.items || [];
        setConditionalRules(rules);
      }
    } catch (err) {
      setError("Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const evaluateCondition = (
    condition: { fieldVariable: string; operator: string; value: string },
    values: Record<string, unknown>
  ) => {
    const fieldValue = values[condition.fieldVariable];
    const { operator, value } = condition;

    switch (operator) {
      case "equals":
      case "=":
        return fieldValue === value;
      case "not_equals":
      case "!=":
        return fieldValue !== value;
      case "contains":
        return fieldValue && String(fieldValue).includes(value);
      case "empty":
        return !fieldValue || fieldValue === "";
      case "not_empty":
        return fieldValue && fieldValue !== "";
      default:
        return false;
    }
  };

  const evaluateConditionalRules = () => {
    const newHidden = new Set<string>();
    const newRequired = new Set<string>();

    pages.forEach((page) => {
      page.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.isRequired) {
            newRequired.add(field.id);
          }
        });
      });
    });

    conditionalRules.forEach((rule) => {
      if (!rule.isActive) return;
      if (rule.action === "SHOW") {
        newHidden.add(rule.targetId);
      }
    });

    conditionalRules.forEach((rule) => {
      if (!rule.isActive) return;

      const conditions = Array.isArray(rule.conditions)
        ? rule.conditions
        : rule.conditions
        ? [rule.conditions]
        : [];

      let conditionsMet = false;
      if (rule.operator === "OR") {
        conditionsMet = conditions.some((condition) =>
          evaluateCondition(condition, formValues)
        );
      } else {
        conditionsMet = conditions.every((condition) =>
          evaluateCondition(condition, formValues)
        );
      }

      if (conditionsMet) {
        switch (rule.action) {
          case "SHOW":
            newHidden.delete(rule.targetId);
            break;
          case "HIDE":
            newHidden.add(rule.targetId);
            break;
          case "REQUIRE":
            newRequired.add(rule.targetId);
            break;
          case "OPTIONAL":
            newRequired.delete(rule.targetId);
            break;
        }
      }
    });

    setHiddenElements(newHidden);
    setRequiredFields(newRequired);
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
    }
  }, [formValues, currentPageIndex]);

  const handleFieldChange = (field: Field, value: unknown) => {
    const fieldKey = field.variable || field.id;

    setFormValues((prev) => {
      const newValues = { ...prev };
      if (value === "" || value === null || value === undefined) {
        delete newValues[fieldKey];
      } else {
        newValues[fieldKey] = value;
      }
      return newValues;
    });

    if (errors[fieldKey] && value) {
      setErrors((prev) => {
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
    }
    setShowContinueModal(false);
  };

  const handleStartNew = () => {
    clearLocalStorage();
    setFormValues({});
    setCurrentPageIndex(0);
    setShowContinueModal(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const visiblePages = getVisiblePages();

    visiblePages.forEach((page) => {
      page.sections.forEach((section) => {
        if (hiddenElements.has(section.id)) return;

        section.fields.forEach((field) => {
          if (hiddenElements.has(field.id)) return;

          const fieldKey = field.variable || field.id;

          if (requiredFields.has(field.id) && !formValues[fieldKey]) {
            newErrors[fieldKey] = `${field.label} is required`;
          }
        });
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !id) return;

    const visibleFieldVariables = new Set<string>();

    pages.forEach((page) => {
      if (hiddenElements.has(page.id)) return;
      page.sections.forEach((section) => {
        if (hiddenElements.has(section.id)) return;
        section.fields.forEach((field) => {
          if (hiddenElements.has(field.id)) return;
          visibleFieldVariables.add(field.variable || field.id);
        });
      });
    });

    const filteredFormValues = Object.fromEntries(
      Object.entries(formValues).filter(([key]) => visibleFieldVariables.has(key))
    );

    const result = await post(`/forms/${id}/submissions`, {
      formId: id,
      status: "SUBMITTED",
      answers: {
        ...filteredFormValues,
        _gpsLocation: userLocation || null,
      },
    });

    if (result.data?.success) {
      clearLocalStorage();
      navigate(`/forms/${id}/submissions`);
    } else {
      setError(result.error || "Failed to submit form");
    }
  };

  const handleCancel = () => {
    if (getFilledFieldsCount() > 0) {
      setShowCancelModal(true);
    } else {
      navigate(`/forms/${id}`);
    }
  };

  const getVisiblePages = () => pages.filter((page) => !hiddenElements.has(page.id));

  const getCurrentPage = () => getVisiblePages()[currentPageIndex];

  const canGoNext = () => currentPageIndex < getVisiblePages().length - 1;

  const canGoPrevious = () => currentPageIndex > 0;

  const getTotalFields = () => {
    return pages.reduce((total, page) => {
      if (hiddenElements.has(page.id)) return total;
      return (
        total +
        page.sections.reduce((pageTotal, section) => {
          if (hiddenElements.has(section.id)) return pageTotal;
          const visibleFields =
            section.fields?.filter((field) => !hiddenElements.has(field.id)) || [];
          return pageTotal + visibleFields.length;
        }, 0)
      );
    }, 0);
  };

  const getFilledFieldsCount = () => {
    const visibleFieldVariables = new Set<string>();

    pages.forEach((page) => {
      if (hiddenElements.has(page.id)) return;
      page.sections.forEach((section) => {
        if (hiddenElements.has(section.id)) return;
        section.fields.forEach((field) => {
          if (hiddenElements.has(field.id)) return;
          visibleFieldVariables.add(field.variable || field.id);
        });
      });
    });

    return Object.entries(formValues).filter(
      ([key, value]) =>
        visibleFieldVariables.has(key) &&
        value !== "" &&
        value !== null &&
        value !== undefined
    ).length;
  };

  const getFieldIcon = (controlType: string, field?: Field) => {
    if (field?.label === "Current Location (GPS)") {
      return <MapPin className="size-4" />;
    }
    switch (controlType) {
      case "DATE_SELECTOR":
        return <Calendar className="size-4" />;
      case "DROPDOWN":
        return <List className="size-4" />;
      case "MULTI_SELECT":
        return <CheckSquare className="size-4" />;
      default:
        return <FileText className="size-4" />;
    }
  };

  const renderFieldInput = (field: Field) => {
    const fieldKey = field.variable || field.id;
    const value = formValues[fieldKey] ?? "";
    const hasError = !!errors[fieldKey];
    const isDisabled = field.isReadOnly;

    if (field.label === "Current Location (GPS)") {
      return (
        <div className="px-3 py-2 min-h-[40px] flex items-center bg-muted/30 border rounded-md text-sm">
          {userLocation ? (
            <span className="font-mono">
              {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
            </span>
          ) : (
            <span className="text-muted-foreground">Getting GPS location...</span>
          )}
        </div>
      );
    }

    switch (field.controlType) {
      case "INPUT":
      case "TEXTBOX":
        return (
          <div>
            <Input
              value={String(value)}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={hasError ? "border-destructive" : ""}
              disabled={isDisabled}
            />
            {hasError && (
              <span className="text-destructive text-sm mt-1">{errors[fieldKey]}</span>
            )}
          </div>
        );

      case "DATE_SELECTOR":
        return (
          <div>
            <Input
              type="date"
              value={String(value)}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={hasError ? "border-destructive" : ""}
              disabled={isDisabled}
            />
            {hasError && (
              <span className="text-destructive text-sm mt-1">{errors[fieldKey]}</span>
            )}
          </div>
        );

      case "DROPDOWN":
        const options = Array.isArray(field.options) ? field.options : [];
        return (
          <div>
            <select
              value={String(value)}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                hasError ? "border-destructive" : "border-input"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isDisabled}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {options.map((option, index) => {
                if (typeof option === "string") {
                  return (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  );
                }
                return (
                  <option key={option.value || index} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
            {hasError && (
              <span className="text-destructive text-sm mt-1">{errors[fieldKey]}</span>
            )}
          </div>
        );

      case "TEXT_AREA":
        return (
          <div>
            <textarea
              value={String(value)}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={4}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none ${
                hasError ? "border-destructive" : "border-input"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isDisabled}
            />
            {hasError && (
              <span className="text-destructive text-sm mt-1">{errors[fieldKey]}</span>
            )}
          </div>
        );

      case "MULTI_SELECT":
        return (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              className="w-5 h-5 rounded border-input"
              disabled={isDisabled}
            />
            <span>{field.label}</span>
            {hasError && (
              <span className="text-destructive text-sm ml-2">{errors[fieldKey]}</span>
            )}
          </div>
        );

      default:
        return (
          <div>
            <Input
              value={String(value)}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={hasError ? "border-destructive" : ""}
              disabled={isDisabled}
            />
            {hasError && (
              <span className="text-destructive text-sm mt-1">{errors[fieldKey]}</span>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Form not found"}</p>
        <Button onClick={() => navigate("/forms")}>Back to Forms</Button>
      </div>
    );
  }

  const currentPage = getCurrentPage();
  const totalFields = getTotalFields();
  const filledFields = getFilledFieldsCount();
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Submit: {form.name}</h1>
            <p className="text-sm text-muted-foreground">{form.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Submit Form
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Form Progress</span>
              <span>
                {filledFields} / {totalFields} fields
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Page Navigation */}
          {getVisiblePages().length > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
                disabled={!canGoPrevious()}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPageIndex + 1} of {getVisiblePages().length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
                disabled={!canGoNext()}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}

          {/* Current Page */}
          {currentPage && (
            <>
              <h2 className="text-lg font-semibold">{currentPage.title}</h2>

              {currentPage.sections
                .filter((section) => !hiddenElements.has(section.id))
                .map((section) => (
                  <div
                    key={section.id}
                    className="rounded-lg border bg-card p-4 space-y-4"
                  >
                    {section.title && (
                      <h3 className="font-medium">{section.title}</h3>
                    )}
                    {section.description && (
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    )}

                    {section.fields
                      .filter((field) => !hiddenElements.has(field.id))
                      .map((field) => (
                        <div key={field.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {getFieldIcon(field.controlType, field)}
                            </span>
                            <label className="font-medium">
                              {field.label}
                              {requiredFields.has(field.id) && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </label>
                          </div>
                          {renderFieldInput(field)}
                        </div>
                      ))}
                  </div>
                ))}
            </>
          )}

          {/* Errors Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="font-medium text-destructive">
                Please fix the following errors:
              </p>
              <ul className="list-disc list-inside mt-2 text-destructive text-sm">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Form Submission</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p>
              Are you sure you want to cancel? Your progress has been saved and you
              can continue later.
            </p>
            <p className="text-sm text-muted-foreground">
              {filledFields} field(s) have been filled out.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => navigate(`/forms/${id}`)}
            >
              Leave Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Continue Progress Modal */}
      <Dialog open={showContinueModal} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Continue Previous Submission?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p>
              You have a saved form submission in progress. Would you like to
              continue where you left off?
            </p>
            {savedProgress && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {Object.keys(savedProgress.formValues || {}).length} field(s)
                  already filled
                </p>
                <p>
                  Last saved: {new Date(savedProgress.savedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleStartNew}>
              Start New
            </Button>
            <Button onClick={handleContinueProgress}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormSubmit;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Calendar,
  List,
  CheckSquare,
  MapPin,
  Printer,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";

interface Field {
  id: string;
  label: string;
  variable: string;
  controlType: string;
  dataType: string;
  isRequired: boolean;
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

interface FormSubmissionData {
  id: string;
  formId: string;
  status: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  form?: {
    id: string;
    name: string;
    description?: string;
    pages: Page[];
  };
}

interface ConditionalRule {
  id: string;
  isActive: boolean;
  action: "SHOW" | "HIDE";
  targetId: string;
  operator: "AND" | "OR";
  conditions: {
    fieldVariable: string;
    operator: string;
    value: string;
  }[];
}

const FormSubmissionDetails = () => {
  const { id: formId, submissionId } = useParams<{
    id: string;
    submissionId: string;
  }>();
  const navigate = useNavigate();
  const { get } = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<FormSubmissionData | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>([]);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());

  const fetchSubmission = async () => {
    if (!formId || !submissionId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await get(
        `/forms/${formId}/submissions/${submissionId}?include=${JSON.stringify([
          "form.pages.sections.fields",
        ])}`
      );

      if (result.data?.success && result.data.data) {
        const submissionData = result.data.data as FormSubmissionData;
        setSubmission(submissionData);

        if (submissionData.form) {
          const pagesData =
            submissionData.form.pages?.map((page) => ({
              ...page,
              sections:
                page.sections?.map((section) => ({
                  ...section,
                  fields: section.fields || [],
                })) || [],
            })) || [];
          setPages(pagesData.sort((a, b) => a.sequence - b.sequence));

          const rulesResult = await get(
            `/forms/${submissionData.formId}/conditional-rules`
          );
          if (rulesResult.data?.success && rulesResult.data.data) {
            const rules = Array.isArray(rulesResult.data.data)
              ? rulesResult.data.data
              : rulesResult.data.data.items || [];
            setConditionalRules(rules);
          }
        }
      } else {
        setError("Failed to fetch submission");
      }
    } catch (err) {
      setError("Failed to load submission");
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
    if (!submission) return;

    const newHidden = new Set<string>();
    const values = submission.answers;

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
          evaluateCondition(condition, values)
        );
      } else {
        conditionsMet = conditions.every((condition) =>
          evaluateCondition(condition, values)
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
        }
      }
    });

    setHiddenElements(newHidden);
  };

  useEffect(() => {
    fetchSubmission();
  }, [formId, submissionId]);

  useEffect(() => {
    if (submission && conditionalRules.length > 0) {
      evaluateConditionalRules();
    }
  }, [submission?.answers, conditionalRules]);

  const getVisiblePages = () =>
    pages.filter((page) => !hiddenElements.has(page.id));

  const getCurrentPage = () => getVisiblePages()[currentPageIndex];

  const canGoNext = () => currentPageIndex < getVisiblePages().length - 1;

  const canGoPrevious = () => currentPageIndex > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    console.log("Export functionality coming soon");
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

  const renderFieldValue = (field: Field) => {
    const fieldKey = field.variable || field.id;
    const value = submission?.answers[fieldKey];

    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">No response</span>;
    }

    if (
      field.label === "Current Location (GPS)" &&
      submission?.answers._gpsLocation
    ) {
      const gps = submission.answers._gpsLocation as {
        latitude: number;
        longitude: number;
        accuracy?: number;
      };
      return (
        <div className="font-mono text-sm">
          {gps.latitude?.toFixed(6)}, {gps.longitude?.toFixed(6)}
          {gps.accuracy && (
            <span className="text-muted-foreground ml-2">
              ({gps.accuracy.toFixed(0)}m)
            </span>
          )}
        </div>
      );
    }

    switch (field.controlType) {
      case "SIGNATURE_PAD":
        if (typeof value === "string" && value.startsWith("data:image/")) {
          return (
            <div className="border rounded p-2 bg-white inline-block">
              <img
                src={value}
                alt="Signature"
                className="max-w-[400px] max-h-[200px] object-contain"
              />
            </div>
          );
        }
        return <span>{String(value)}</span>;

      case "CAMERA":
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <span className="text-muted-foreground italic">No images</span>;
        }
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
            {(value as { id?: string; url: string; originalName?: string }[]).map(
              (file, index) => (
                <div
                  key={file.id || index}
                  className="border rounded overflow-hidden"
                >
                  <img
                    src={file.url}
                    alt={file.originalName || `Image ${index + 1}`}
                    className="w-full h-32 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => window.open(file.url, "_blank")}
                    title={file.originalName}
                  />
                  {file.originalName && (
                    <div className="p-1 bg-muted text-xs text-muted-foreground truncate">
                      {file.originalName}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        );

      case "MULTI_SELECT":
        return <span>{value ? "Yes" : "No"}</span>;

      case "TEXT_AREA":
        return <div className="whitespace-pre-wrap">{String(value)}</div>;

      case "DATE_SELECTOR":
        return <span>{new Date(String(value)).toLocaleDateString()}</span>;

      case "DROPDOWN":
        if (
          field.options &&
          typeof value === "string" &&
          value.match(/^[a-f0-9-]{36}$/)
        ) {
          const option = field.options.find((opt) =>
            typeof opt === "object" ? opt.value === value : opt === value
          );
          if (typeof option === "object") {
            return <span>{option.label}</span>;
          }
        }
        return <span>{String(value)}</span>;

      case "SKETCH_PAD":
        if (typeof value === "string" && value.startsWith("/api/")) {
          return (
            <div className="border rounded p-2 bg-white inline-block">
              <img
                src={value}
                alt="Sketch"
                className="max-w-[400px] max-h-[300px] object-contain cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => window.open(value, "_blank")}
                title="Click to view full size"
              />
            </div>
          );
        }
        return <span className="text-primary">Sketch saved</span>;

      default:
        return <span>{String(value)}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Submission not found"}</p>
        <Button onClick={() => navigate(`/forms/${formId}/submissions`)}>
          Back to Submissions
        </Button>
      </div>
    );
  }

  const currentPage = getCurrentPage();

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b px-4 py-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/forms/${formId}/submissions`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {submission.form?.name || "Form Submission"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Status: {submission.status} &bull; Submitted:{" "}
              {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="size-4" />
              Print
            </Button>
            <Button onClick={handleExport}>
              <Download className="size-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 print:p-0">
        <div className="max-w-3xl mx-auto space-y-6 print:max-w-full">
          {/* Page Navigation */}
          {getVisiblePages().length > 1 && (
            <div className="flex items-center justify-between print:hidden">
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

          {/* Current Page View (Screen) */}
          <div className="print:hidden">
            {currentPage && (
              <>
                <h2 className="text-lg font-semibold mb-4">{currentPage.title}</h2>

                {currentPage.sections
                  .filter((section) => !hiddenElements.has(section.id))
                  .map((section) => (
                    <div
                      key={section.id}
                      className="rounded-lg border bg-card p-4 mb-4"
                    >
                      {section.title && (
                        <h3 className="font-medium mb-4">{section.title}</h3>
                      )}
                      <div className="space-y-4">
                        {section.fields
                          .filter((field) => !hiddenElements.has(field.id))
                          .map((field) => {
                            const hasValue =
                              submission.answers[field.variable || field.id];
                            if (
                              !hasValue &&
                              field.controlType !== "MULTI_SELECT"
                            )
                              return null;

                            return (
                              <div
                                key={field.id}
                                className="border-b border-border/50 last:border-0 pb-3 last:pb-0"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="text-muted-foreground mt-0.5">
                                    {getFieldIcon(field.controlType, field)}
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-muted-foreground text-sm font-medium block mb-1">
                                      {field.label}
                                    </label>
                                    {renderFieldValue(field)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Print View (All Pages) */}
          <div className="hidden print:block">
            {getVisiblePages().map((page) => (
              <div key={page.id} className="break-before-page">
                <h2 className="text-xl font-semibold mb-4">{page.title}</h2>
                {page.sections
                  .filter((section) => !hiddenElements.has(section.id))
                  .map((section) => (
                    <div key={section.id} className="mb-6">
                      {section.title && (
                        <h3 className="text-lg font-medium mb-3">
                          {section.title}
                        </h3>
                      )}
                      <div className="space-y-3">
                        {section.fields
                          .filter((field) => !hiddenElements.has(field.id))
                          .map((field) => {
                            const hasValue =
                              submission.answers[field.variable || field.id];
                            if (
                              !hasValue &&
                              field.controlType !== "MULTI_SELECT"
                            )
                              return null;

                            return (
                              <div
                                key={field.id}
                                className="border-b border-gray-200 pb-2"
                              >
                                <label className="text-gray-600 text-sm font-medium block mb-1">
                                  {field.label}
                                </label>
                                <div className="text-black">
                                  {renderFieldValue(field)}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSubmissionDetails;

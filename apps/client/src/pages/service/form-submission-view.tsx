import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, FileText, CheckSquare, List, ChevronLeft, ChevronRight, MapPin, Camera, PenTool, Download, Printer } from 'lucide-react';
import { Button, Card, PageHeader } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

interface FormSubmissionData {
  id: string;
  formId: string;
  status: string;
  answers: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  form?: {
    name: string;
    description?: string;
    pages: any[];
  };
}

const FormSubmissionView = () => {
  const { id, formId } = useParams();
  const navigate = useNavigate();
  const { get } = useApi<IApiResponse<FormSubmissionData>>();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<FormSubmissionData | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [conditionalRules, setConditionalRules] = useState<any[]>([]);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  useEffect(() => {
    if (submission && conditionalRules.length > 0) {
      evaluateConditionalRules();
    }
  }, [submission?.answers, conditionalRules]);

  const fetchSubmission = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await get(`/forms/${formId}/submissions/${id}`, {
        include: ['form.pages.sections.fields']
      });

      if (response?.success && response.data) {
        setSubmission(response.data);

        if (response.data.form) {
          const pagesData = response.data.form.pages?.map((page: any) => ({
            ...page,
            sections: page.sections?.map((section: any) => ({
              ...section,
              fields: section.fields || []
            })) || []
          })) || [];
          setPages(pagesData.sort((a: any, b: any) => a.sequence - b.sequence));

          const rulesResponse = await get(`/forms/${response.data.formId}/conditional-rules`) as IApiResponse<any>;
          if (rulesResponse?.success && rulesResponse.data) {
            const rules = Array.isArray(rulesResponse.data) ? rulesResponse.data : (rulesResponse.data.items || []);
            setConditionalRules(rules);
          }
        }
      } else {
        setError(response?.error || "Failed to fetch submission");
      }
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError('Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const evaluateConditionalRules = () => {
    if (!submission) return;

    const newHidden = new Set<string>();
    const values = submission.answers;

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
          evaluateCondition(condition, values)
        );
      } else {
        conditionsMet = conditions.every((condition: any) =>
          evaluateCondition(condition, values)
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
        }
      }
    });

    if (values["2nd Customer"] !== "yes") {
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

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderFieldValue = (field: any) => {
    const fieldKey = field.variable || field.id;
    const value = submission?.answers[fieldKey];

    if (value === undefined || value === null || value === '') {
      return <span className="text-text-muted italic">No response</span>;
    }

    if (field.label === 'Current Location (GPS)' && submission?.answers._gpsLocation) {
      const gps = submission.answers._gpsLocation;
      return (
        <div className="font-mono text-sm">
          {gps.latitude?.toFixed(6)}, {gps.longitude?.toFixed(6)}
          {gps.accuracy && <span className="text-text-muted ml-2">(±{gps.accuracy.toFixed(0)}m)</span>}
        </div>
      );
    }

    switch (field.controlType) {
      case 'SIGNATURE_PAD':
        if (!value) return <span className="text-text-muted italic">No signature</span>;
        if (value === 'SIGNATURE_PLACEHOLDER') {
          return <span className="text-success">✓ Signature captured</span>;
        }
        if (value.startsWith('data:image/')) {
          return (
            <div className="border border-border rounded p-2 bg-white inline-block">
              <img
                src={value}
                alt="Signature"
                className="max-w-[200px] max-h-[100px] object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          );
        }
        return <span className="text-text">{value}</span>;

      case 'CAMERA':
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <span className="text-text-muted italic">No images</span>;
        }
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
            {value.map((file: any, index: number) => (
              <div key={file.id || index} className="border border-border rounded overflow-hidden">
                <img
                  src={file.url}
                  alt={file.originalName || `Image ${index + 1}`}
                  className="w-full h-32 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => window.open(file.url, '_blank')}
                  title={file.originalName}
                />
                {file.originalName && (
                  <div className="p-1 bg-surface text-xs text-text-muted truncate">
                    {file.originalName}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'MULTI_SELECT':
        return <span className="text-text">{value ? 'Yes' : 'No'}</span>;

      case 'TEXT_AREA':
        return (
          <div className="whitespace-pre-wrap text-text">
            {value}
          </div>
        );

      case 'DATE_SELECTOR':
        return <span className="text-text">{new Date(value).toLocaleDateString()}</span>;

      case 'DROPDOWN':
        // If the value is a UUID, try to find the label from options
        if (field.options && typeof value === 'string' && value.match(/^[a-f0-9-]{36}$/)) {
          const option = field.options.find((opt: any) => opt.value === value);
          return <span className="text-text">{option?.label || value}</span>;
        }
        return <span className="text-text">{value}</span>;

      case 'SKETCH_PAD':
        if (!value) return <span className="text-text-muted italic">No sketch</span>;
        if (typeof value === 'string' && value.startsWith('/api/')) {
          return (
            <div className="border border-border rounded p-2 bg-white inline-block">
              <img
                src={value}
                alt="Sketch"
                className="max-w-[400px] max-h-[300px] object-contain cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => window.open(value, '_blank')}
                title="Click to view full size"
              />
            </div>
          );
        }
        return <span className="text-success">✓ Sketch saved</span>;

      default:
        return <span className="text-text">{value}</span>;
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
      case 'DROPDOWN': return <List size={16} />;
      case 'MULTI_SELECT': return <CheckSquare size={16} />;
      case 'TEXT_AREA': return <FileText size={16} />;
      case 'CAMERA': return <Camera size={16} />;
      case 'SIGNATURE_PAD': return <PenTool size={16} />;
      case 'SKETCH_PAD': return <PenTool size={16} />;
      default: return null;
    }
  };

  const Actions = () => (
    <div className="flex gap-2">
      <Button onClick={() => navigate(`/service/forms/${formId}/submissions`)} variant="secondary-outline">
        <ArrowLeft size={16} />
        <span>Back</span>
      </Button>
      <Button onClick={handlePrint} variant="secondary">
        <Printer size={16} />
        <span>Print</span>
      </Button>
      <Button onClick={handleExport}>
        <Download size={16} />
        <span>Export PDF</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg">Loading submission...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-error text-lg mb-4">{error || "Submission not found"}</div>
        <Button onClick={() => navigate(`/service/forms/${formId}/submissions`)}>
          Back to Submissions
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title={submission.form?.name || 'Form Submission'}
        description={`Status: ${submission.status} • Submitted: ${new Date(submission.createdAt).toLocaleString()}`}
        actions={<Actions />}
      />

      <div className="space-y-4 p-4 max-w-4xl mx-auto w-full print:max-w-full">
        {getVisiblePages().length > 1 && (
          <div className="flex items-center justify-between mb-4 print:hidden">
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

        <div className="print:hidden">
          {getCurrentPage() && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-text">{getCurrentPage().title}</h2>
              </div>

              {getCurrentPage().sections
                .filter((section: any) => !hiddenElements.has(section.id))
                .map((section: any) => (
                  <Card key={section.id} className="mb-4">
                    {section.title && (
                      <h3 className="text-lg font-medium text-text mb-4">{section.title}</h3>
                    )}
                    <div className="space-y-4">
                      {section.fields
                        .filter((field: any) => !hiddenElements.has(field.id))
                        .map((field: any) => {
                          const hasValue = submission.answers[field.variable || field.id];
                          if (!hasValue && field.controlType !== 'MULTI_SELECT') return null;

                          return (
                            <div key={field.id} className="border-b border-border/50 last:border-0 pb-3 last:pb-0">
                              <div className="flex items-start gap-2">
                                <div className="text-text-muted mt-0.5">{getFieldIcon(field.controlType, field)}</div>
                                <div className="flex-1">
                                  <label className="text-text-muted text-sm font-medium block mb-1">
                                    {field.label}
                                  </label>
                                  {renderFieldValue(field)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                ))}
            </>
          )}
        </div>

        <div className="hidden print:block">
          {getVisiblePages().map((page: any) => (
            <div key={page.id} className="break-before-page">
              <h2 className="text-xl font-semibold text-text mb-4">{page.title}</h2>
              {page.sections
                .filter((section: any) => !hiddenElements.has(section.id))
                .map((section: any) => (
                  <div key={section.id} className="mb-6">
                    {section.title && (
                      <h3 className="text-lg font-medium text-text mb-3">{section.title}</h3>
                    )}
                    <div className="space-y-3">
                      {section.fields
                        .filter((field: any) => !hiddenElements.has(field.id))
                        .map((field: any) => {
                          const hasValue = submission.answers[field.variable || field.id];
                          if (!hasValue && field.controlType !== 'MULTI_SELECT') return null;

                          return (
                            <div key={field.id} className="border-b border-gray-200 pb-2">
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
  );
};

export default FormSubmissionView;
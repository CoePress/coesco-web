import { useState, useEffect } from "react";
import { ToggleSwitch, Button, Modal, StatusBadge } from "@/components";
import Textarea from "@/components/ui/text-area";
import ScreenshotAnnotator from "@/components/ui/screenshot-annotator";
import { Trash2, History } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import { format } from "date-fns";

type BugReport = {
  id: string;
  title: string;
  description: string;
  userEmail: string | null;
  userName: string | null;
  url: string | null;
  userAgent: string | null;
  issueKey: string | null;
  issueUrl: string | null;
  status: "SUBMITTED" | "IN_JIRA" | "FAILED";
  createdAt: string;
  createdById: string | null;
};

type BugReportFormProps = {
  screenshot?: string | null;
  formData: {
    description: string;
    annotatedScreenshot: string | null;
    includeScreenshot: boolean;
  };
  onFormDataChange: (data: any) => void;
};

const BugReportForm = ({ screenshot, formData, onFormDataChange }: BugReportFormProps) => {
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedBugReport, setSelectedBugReport] = useState<BugReport | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { get, response: bugHistory, loading: historyLoading } = useApi<IApiResponse<BugReport[]>>();

  useEffect(() => {
    if (isHistoryModalOpen) {
      get("/system/bugs/my-reports");
    }
  }, [isHistoryModalOpen]);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text">Description</label>
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => setIsHistoryModalOpen(true)}
          type="button">
          <History size={14} />
          <span className="ml-1">History</span>
        </Button>
      </div>
      <Textarea
        id="bug-description"
        value={formData.description}
        onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
        placeholder="Detailed description of the bug, including steps to reproduce"
        rows={4}
        autoComplete="off"
        required
      />

      {screenshot && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <ToggleSwitch
              checked={formData.includeScreenshot}
              onChange={(checked) => onFormDataChange({ ...formData, includeScreenshot: checked })}
              label="Include Screenshot"
              id="include-screenshot"
            />
            {formData.includeScreenshot && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">
                  Click and drag to highlight bugs
                </span>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={() => {
                    setClearTrigger(prev => prev + 1);
                    onFormDataChange({ ...formData, annotatedScreenshot: null });
                  }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
          {formData.includeScreenshot && (
            <ScreenshotAnnotator
              screenshot={screenshot}
              onAnnotatedScreenshot={(screenshot) => onFormDataChange({ ...formData, annotatedScreenshot: screenshot })}
              clearTrigger={clearTrigger}
            />
          )}
        </div>
      )}

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="My Bug Reports"
        size="lg">
        <div className="space-y-2">
          {historyLoading ? (
            <div className="text-center text-text-muted py-8">Loading...</div>
          ) : bugHistory?.data && bugHistory.data.length > 0 ? (
            bugHistory.data.map((bug) => (
              <div
                key={bug.id}
                className="border border-border rounded-lg p-4 hover:bg-surface cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedBugReport(bug);
                  setIsDetailsModalOpen(true);
                }}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-medium text-text">{bug.title}</h3>
                  <StatusBadge
                    label={bug.status}
                    variant={
                      bug.status === "IN_JIRA"
                        ? "success"
                        : bug.status === "FAILED"
                        ? "error"
                        : "default"
                    }
                  />
                </div>
                <p className="text-sm text-text-muted line-clamp-2 mb-2">
                  {bug.description}
                </p>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{format(new Date(bug.createdAt), "MM/dd/yyyy hh:mm a")}</span>
                  {bug.issueKey && (
                    <a
                      href={bug.issueUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}>
                      {bug.issueKey}
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-text-muted py-8">
              No bug reports found
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedBugReport(null);
        }}
        title="Bug Report Details"
        size="lg">
        {selectedBugReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {format(new Date(selectedBugReport.createdAt), "MM/dd/yyyy hh:mm:ss a")}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Status</label>
                <StatusBadge
                  label={selectedBugReport.status}
                  variant={
                    selectedBugReport.status === "IN_JIRA"
                      ? "success"
                      : selectedBugReport.status === "FAILED"
                      ? "error"
                      : "default"
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-text-muted mb-2 block">Title</label>
                <div className="text-sm font-medium">{selectedBugReport.title}</div>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-text-muted mb-2 block">Description</label>
                <div className="text-sm bg-surface border border-border rounded p-3 whitespace-pre-wrap">
                  {selectedBugReport.description}
                </div>
              </div>
              {selectedBugReport.url && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Page URL</label>
                  <div className="text-sm font-mono bg-surface border border-border rounded p-2 break-all">
                    {selectedBugReport.url}
                  </div>
                </div>
              )}
              {selectedBugReport.issueKey && selectedBugReport.issueUrl && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Jira Issue</label>
                  <div className="text-sm">
                    <a
                      href={selectedBugReport.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline">
                      {selectedBugReport.issueKey}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BugReportForm;
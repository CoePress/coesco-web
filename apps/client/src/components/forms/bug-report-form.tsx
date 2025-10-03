import { useState } from "react";
import { Button, Modal, ToggleSwitch } from "@/components";
import ScreenshotAnnotator from "@/components/ui/screenshot-annotator";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

type BugReportFormProps = {
  onCancel: () => void;
  screenshot?: string | null;
  isOpen: boolean;
};

const BugReportForm = ({ onCancel, screenshot, isOpen }: BugReportFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [annotatedScreenshot, setAnnotatedScreenshot] = useState<string | null>(null);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { post, loading } = useApi();
  const { addToast } = useToast();

  const handleSubmit = async () => {
    const result = await post("/email/bug-report", {
      title: title.trim(),
      description: description.trim(),
      screenshot: includeScreenshot ? (annotatedScreenshot || screenshot) : null,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    if (result) {
      addToast({
        title: "Bug report submitted",
        message: "Thank you for reporting this issue!",
        variant: "success",
      });
      onCancel();
    } else {
      addToast({
        title: "Failed to submit bug report",
        message: "Please try again later",
        variant: "error",
      });
    }
  };

  if (showConfirmation) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onCancel}
        title="Confirm Bug Report"
        size="xs"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setShowConfirmation(false)}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}>
              {loading ? "Submitting..." : "Confirm"}
            </Button>
          </div>
        }>
        <p className="text-sm text-text">
          Are you sure you want to submit this bug report?
        </p>

        <div className="bg-surface border border-border rounded p-3 space-y-2 text-sm">
          <div>
            <span className="text-text-muted block mb-1">Title:</span>
            <span className="font-medium text-text">{title}</span>
          </div>
          <div>
            <span className="text-text-muted block mb-1">Description:</span>
            <span className="font-medium text-text whitespace-pre-wrap">{description}</span>
          </div>
          {includeScreenshot && (annotatedScreenshot || screenshot) && (
            <div>
              <span className="text-text-muted block mb-1">Screenshot:</span>
              <span className="text-text">Attached</span>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Report Bug"
      size="md"
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary-outline"
            onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={!title.trim() || !description.trim()}>
            Submit Report
          </Button>
        </div>
      }>
      <div className="flex flex-col gap-2">
        <label htmlFor="bug-title" className="text-sm font-medium text-text">
          Title *
        </label>
        <input
          id="bug-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the issue"
          className="px-3 py-2 border border-border rounded bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          autoComplete="off"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="bug-description" className="text-sm font-medium text-text">
          Description *
        </label>
        <textarea
          id="bug-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the bug, including steps to reproduce"
          rows={4}
          className="px-3 py-2 border border-border rounded bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
          autoComplete="off"
          required
        />
      </div>

      {screenshot && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <ToggleSwitch
              checked={includeScreenshot}
              onChange={setIncludeScreenshot}
              label="Include Screenshot"
              id="include-screenshot"
            />
            {includeScreenshot && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">
                  Click and drag to highlight bugs
                </span>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={() => {
                    setClearTrigger(prev => prev + 1);
                    setAnnotatedScreenshot(null);
                  }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
          {includeScreenshot && (
            <ScreenshotAnnotator
              screenshot={screenshot}
              onAnnotatedScreenshot={setAnnotatedScreenshot}
              clearTrigger={clearTrigger}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default BugReportForm;
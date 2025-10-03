import { useState } from "react";
import { ToggleSwitch, Button } from "@/components";
import ScreenshotAnnotator from "@/components/ui/screenshot-annotator";
import { Trash2 } from "lucide-react";

type BugReportFormProps = {
  screenshot?: string | null;
  formData: {
    title: string;
    description: string;
    annotatedScreenshot: string | null;
    includeScreenshot: boolean;
  };
  onFormDataChange: (data: any) => void;
};

const BugReportForm = ({ screenshot, formData, onFormDataChange }: BugReportFormProps) => {
  const [clearTrigger, setClearTrigger] = useState(0);

  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="bug-title" className="text-sm font-medium text-text">
          Title *
        </label>
        <input
          id="bug-title"
          type="text"
          value={formData.title}
          onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
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
          value={formData.description}
          onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
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
    </>
  );
};

export default BugReportForm;
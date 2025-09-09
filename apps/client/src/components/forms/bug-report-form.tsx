import { useState } from "react";
import { Button } from "@/components";
import ScreenshotAnnotator from "@/components/ui/screenshot-annotator";

type BugReportFormProps = {
  onSubmit: (data: { title: string; description: string; email?: string }) => void;
  onCancel: () => void;
  screenshot?: string | null;
};

const BugReportForm = ({ onSubmit, onCancel, screenshot }: BugReportFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [annotatedScreenshot, setAnnotatedScreenshot] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    onSubmit({
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          rows={6}
          className="px-3 py-2 border border-border rounded bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
          required
        />
      </div>

      {screenshot && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text">
            Screenshot (Click and drag to highlight bugs)
          </label>
          <ScreenshotAnnotator 
            screenshot={screenshot}
            onAnnotatedScreenshot={setAnnotatedScreenshot}
          />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="secondary-outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!title.trim() || !description.trim()}
        >
          Submit Report
        </Button>
      </div>
    </form>
  );
};

export default BugReportForm;
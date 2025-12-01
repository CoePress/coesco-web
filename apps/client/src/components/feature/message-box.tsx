import { FileIcon, MicIcon, MicOff, XIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface MessageBoxProps {
  placeholder?: string;
  onSend: (payload: { message: string; files: File[]; audio?: Blob }) => void;
  disabled?: boolean;
  maxRows?: number;
  accept?: string;
}

export default function MessageBox({
  placeholder = "Send a message..",
  onSend,
  disabled = false,
  maxRows = 8,
  accept,
}: MessageBoxProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const autosize = useCallback(() => {
    const ta = taRef.current;
    if (!ta)
      return;
    ta.style.height = "0px";
    const lineHeight = Number.parseInt(window.getComputedStyle(ta).lineHeight || "20", 10);
    const maxHeight = lineHeight * maxRows;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, [maxRows]);

  useEffect(() => {
    autosize();
  }, [message, autosize]);

  useEffect(() => {
    if (!disabled) {
      taRef.current?.focus();
    }
  }, [disabled]);

  const doSend = useCallback(
    (audio?: Blob) => {
      const trimmed = message.trim();
      if (!trimmed && files.length === 0 && !audio)
        return;
      onSend({ message: trimmed, files, audio });
      setMessage("");
      setFiles([]);
      setTimeout(() => {
        taRef.current?.focus();
      }, 0);
    },
    [message, files, onSend],
  );

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    if (arr.length === 0)
      return;
    setFiles((prev) => {
      const names = new Set(prev.map(f => f.name + f.size));
      const deduped = arr.filter(f => !names.has(f.name + f.size));
      return [...prev, ...deduped];
    });
  };

  const removeFileAt = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (!boxRef.current?.contains(document.activeElement))
        return;
      const items = e.clipboardData?.items;
      if (!items)
        return;
      const pastedFiles: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f)
            pastedFiles.push(f);
        }
      }
      if (pastedFiles.length) {
        e.preventDefault();
        addFiles(pastedFiles);
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target)
      setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length)
      addFiles(e.dataTransfer.files);
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    setRecError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0)
          audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        doSend(blob);
      };
      mr.start();
      setRecording(true);
    }
    catch (err: any) {
      setRecError(err?.message || "Microphone access failed");
      setRecording(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  return (
    <div ref={boxRef} className="w-full">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={f.name + i}
              className="group inline-flex items-center gap-2 rounded border bg-background px-2 py-1 text-xs"
              title={f.name}
            >
              <span className="truncate max-w-[16rem]">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFileAt(i)}
                aria-label={`Remove ${f.name}`}
                className="rounded-full text-text-muted hover:text-red-500/50 cursor-pointer"
              >
                <XIcon size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative w-full rounded-md border bg-background/50 flex items-center p-1 shadow-sm",
          isDragging ? "ring-2 ring-indigo-400 ring-offset-1" : "",
        ].join(" ")}
      >
        <textarea
          ref={taRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isDragging ? "Drop files to attach…" : placeholder}
          rows={1}
          disabled={disabled}
          className="block w-full resize-none flex-1 outline-none placeholder-text-muted text-sm px-1"
          aria-label="Message input"
        />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={disabled}
            title="Attach files"
            aria-label="Attach files"
            onClick={() => fileInputRef.current?.click()}
            className={[
              "p-2 rounded-md focus:outline-none cursor-pointer hover:bg-surface text-text-muted",
            ].join(" ")}
          >
            <FileIcon size={16} />
          </button>

          <button
            type="button"
            disabled={disabled}
            title={recording ? "Stop recording" : "Record voice"}
            aria-label={recording ? "Stop recording" : "Record voice"}
            onClick={toggleRecording}
            className={[
              "p-2 rounded-md focus:outline-none cursor-pointer hover:bg-surface",
              recording ? "text-red-500" : "text-text-muted",
            ].join(" ")}
          >
            {recording
              ? (
                  <MicOff size={16} />
                )
              : (
                  <MicIcon size={16} />
                )}
          </button>

          <button
            type="button"
            disabled={disabled || (!message.trim() && files.length === 0)}
            onClick={() => doSend()}
            className="p-2 cursor-pointer rounded-md bg-primary/90 text-white hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Send message"
            title="Send"
          >
            {disabled
              ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )
              : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m5 12 14-7-4 14-3-5-7-2z" />
                  </svg>
                )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={e => e.target.files && addFiles(e.target.files)}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {recError && (
        <p className="mt-2 text-xs text-red-600">
          {recError}
        </p>
      )}
    </div>
  );
}

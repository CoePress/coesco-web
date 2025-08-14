import React, { useCallback, useEffect, useRef, useState } from 'react';

type MessageBoxProps = {
  placeholder?: string;
  onSend: (payload: { text: string; files: File[]; audio?: Blob }) => void;
  disabled?: boolean;
  maxRows?: number; // for auto-resize constraint
  accept?: string;  // file input accept filter, e.g. "image/*,.pdf"
};

export default function MessageBox({
  placeholder = 'Send a message...',
  onSend,
  disabled = false,
  maxRows = 8,
  accept,
}: MessageBoxProps) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Refs
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // ---------- Auto-resize textarea ----------
  const autosize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    const lineHeight = parseInt(window.getComputedStyle(ta).lineHeight || '20', 10);
    const maxHeight = lineHeight * maxRows;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  }, [maxRows]);

  useEffect(() => {
    autosize();
  }, [text, autosize]);

  // ---------- Send ----------
  const doSend = useCallback(
    (audio?: Blob) => {
      const trimmed = text.trim();
      if (!trimmed && files.length === 0 && !audio) return;
      onSend({ text: trimmed, files, audio });
      setText('');
      setFiles([]);
    },
    [text, files, onSend]
  );

  // ---------- File helpers ----------
  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    if (arr.length === 0) return;
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      const deduped = arr.filter((f) => !names.has(f.name + f.size));
      return [...prev, ...deduped];
    });
  };

  const removeFileAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Paste files (images/docs) directly
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (!boxRef.current?.contains(document.activeElement)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) pastedFiles.push(f);
        }
      }
      if (pastedFiles.length) {
        e.preventDefault();
        addFiles(pastedFiles);
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, []);

  // Drag & drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  // ---------- Voice recording ----------
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
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Immediately send text+files+audio. Adjust if you want a review step.
        doSend(blob);
      };
      mr.start();
      setRecording(true);
    } catch (err: any) {
      setRecError(err?.message || 'Microphone access failed');
      setRecording(false);
    }
  };

  // ---------- Keyboard: Enter to send; Shift+Enter for newline ----------
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  return (
    <div ref={boxRef} className="w-full">
      {/* File chips (when selected) */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={f.name + i}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs"
              title={f.name}
            >
              <span className="truncate max-w-[16rem]">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFileAt(i)}
                aria-label={`Remove ${f.name}`}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input container (Cursor-like) */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'relative w-full rounded-2xl border bg-white',
          'border-slate-300 focus-within:border-slate-400',
          'shadow-sm',
          isDragging ? 'ring-2 ring-indigo-400 ring-offset-1' : '',
        ].join(' ')}
      >
        {/* Textarea */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isDragging ? 'Drop files to attach…' : placeholder}
            rows={1}
            disabled={disabled}
            className="block w-full resize-none bg-transparent outline-none placeholder-slate-400 text-sm sm:text-base"
            aria-label="Message input"
          />
        </div>

        {/* Right controls */}
        <div className="absolute right-2 sm:right-3 bottom-2.5 sm:bottom-3 flex items-center gap-1.5">
          {/* Attach */}
          <button
            type="button"
            disabled={disabled}
            title="Attach files"
            aria-label="Attach files"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 15V6a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3v12a4 4 0 0 0 8 0V7" />
            </svg>
          </button>

          {/* Voice */}
          <button
            type="button"
            disabled={disabled}
            title={recording ? 'Stop recording' : 'Record voice'}
            aria-label={recording ? 'Stop recording' : 'Record voice'}
            onClick={toggleRecording}
            className={[
              'p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
              recording ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-100',
            ].join(' ')}
          >
            {/* Mic icon */}
            {recording ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z" />
                <path strokeWidth="2" strokeLinecap="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v2M8 21h8" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z" />
                <path strokeWidth="2" strokeLinecap="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v2M8 21h8" />
              </svg>
            )}
          </button>

          {/* Send */}
          <button
            type="button"
            disabled={disabled || (!text.trim() && files.length === 0)}
            onClick={() => doSend()}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Send message"
            title="Send"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m5 12 14-7-4 14-3-5-7-2z" />
            </svg>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Recording error (if any) */}
      {recError && (
        <p className="mt-2 text-xs text-red-600">
          {recError}
        </p>
      )}
    </div>
  );
}

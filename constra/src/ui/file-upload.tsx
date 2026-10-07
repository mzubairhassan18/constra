"use client";

import { useCallback, useRef, useState } from "react";

export interface PickedFile {
  name: string;
  size: number;
  type: string;
  previewUrl: string | null;
}

function toPicked(f: File): PickedFile {
  return {
    name: f.name,
    size: f.size,
    type: f.type,
    previewUrl: f.type.startsWith("image/")
      ? URL.createObjectURL(f)
      : null,
  };
}

export function FileUpload({
  name,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  multiple = true,
  hint = "Drag & drop files here, or click to browse. Images show a live preview.",
}: {
  name: string;
  accept?: string;
  multiple?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);

  const add = useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list);
      const picked = arr.map(toPicked);
      setFiles((prev) => (multiple ? [...prev, ...picked] : picked));
      // Mirror into the hidden input so the server action receives real Files.
      const dt = new DataTransfer();
      const existing = inputRef.current?.files;
      if (multiple && existing) {
        for (const f of Array.from(existing)) dt.items.add(f);
      }
      for (const f of arr) dt.items.add(f);
      if (inputRef.current) inputRef.current.files = dt.files;
    },
    [multiple],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) add(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <span className="text-2xl" aria-hidden>
          📎
        </span>
        <p className="text-sm font-semibold">Drop files or click to choose</p>
        <p className="text-xs text-slate-500">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) add(e.target.files);
          }}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="constra-card overflow-hidden p-2"
            >
              {f.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.previewUrl}
                  alt={f.name}
                  className="h-24 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-2xl dark:bg-slate-800">
                  📄
                </div>
              )}
              <p className="mt-1 truncate text-xs font-medium" title={f.name}>
                {f.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {(f.size / 1024).toFixed(1)} KB
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

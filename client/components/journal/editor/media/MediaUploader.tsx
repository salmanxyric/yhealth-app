"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSize } from "./media-validators";
import { api } from "@/lib/api-client";

export type UploadStatus = "idle" | "uploading" | "complete" | "error";

interface UploadState {
  status: UploadStatus;
  progress: number;
  url?: string;
  error?: string;
}

interface MediaUploaderProps {
  accept: string;
  maxSize: number;
  onUpload: (url: string, file: File) => void;
  onError?: (error: string) => void;
  validate?: (file: File) => { valid: boolean; error?: string };
  children?: React.ReactNode;
  className?: string;
}

export function MediaUploader({
  accept,
  maxSize,
  onUpload,
  onError,
  validate,
  children,
  className,
}: MediaUploaderProps) {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (validate) {
        const result = validate(file);
        if (!result.valid) {
          onError?.(result.error ?? "Validation failed");
          setState({ status: "error", progress: 0, error: result.error });
          return;
        }
      }

      if (file.size > maxSize) {
        const msg = `File too large: ${formatSize(file.size)}. Maximum: ${formatSize(maxSize)}`;
        onError?.(msg);
        setState({ status: "error", progress: 0, error: msg });
        return;
      }

      setState({ status: "uploading", progress: 0 });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post<{ publicUrl?: string; url: string }>(
          "/upload/file",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (response.success && response.data) {
          const url = response.data.publicUrl || response.data.url;
          setState({ status: "complete", progress: 100, url });
          onUpload(url, file);
        } else {
          throw new Error("Upload failed");
        }
      } catch {
        setState({ status: "error", progress: 0, error: "Upload failed. Try again." });
        onError?.("Upload failed");
      }
    },
    [validate, maxSize, onUpload, onError]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [upload]
  );

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {children ? (
        <div onClick={() => inputRef.current?.click()} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/70 hover:border-white/20 transition-all text-sm"
        >
          {state.status === "uploading" ? (
            <div className="w-4 h-4 border-2 border-white/10 border-t-purple-500/50 rounded-full animate-spin" />
          ) : state.status === "complete" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : state.status === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>
            {state.status === "uploading"
              ? "Uploading..."
              : state.status === "complete"
                ? "Uploaded"
                : state.status === "error"
                  ? "Retry"
                  : "Choose file"}
          </span>
        </button>
      )}

      {state.status === "error" && state.error && (
        <p className="text-red-400/70 text-xs mt-1">{state.error}</p>
      )}
    </div>
  );
}

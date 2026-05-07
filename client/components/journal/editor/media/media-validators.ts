export interface MediaValidation {
  valid: boolean;
  error?: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const AUDIO_TYPES = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/mpeg"];
const FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/json",
];

const LIMITS = {
  image: { maxSize: 10 * 1024 * 1024, maxDimension: 4000 },
  video: { maxSize: 50 * 1024 * 1024, maxDuration: 30 * 60 },
  audio: { maxSize: 20 * 1024 * 1024, maxDuration: 10 * 60 },
  file: { maxSize: 25 * 1024 * 1024 },
  totalAttachments: 20,
  totalSize: 100 * 1024 * 1024,
} as const;

export function validateImage(file: File): MediaValidation {
  if (!IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported image format: ${file.type}. Use JPG, PNG, GIF, WebP, or SVG.` };
  }
  if (file.size > LIMITS.image.maxSize) {
    return { valid: false, error: `Image too large: ${formatSize(file.size)}. Maximum is 10MB.` };
  }
  return { valid: true };
}

export function validateVideo(file: File): MediaValidation {
  if (!VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported video format: ${file.type}. Use MP4 or WebM.` };
  }
  if (file.size > LIMITS.video.maxSize) {
    return { valid: false, error: `Video too large: ${formatSize(file.size)}. Maximum is 50MB.` };
  }
  return { valid: true };
}

export function validateAudio(file: File): MediaValidation {
  if (!AUDIO_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported audio format: ${file.type}. Use WebM, MP4, or MP3.` };
  }
  if (file.size > LIMITS.audio.maxSize) {
    return { valid: false, error: `Audio too large: ${formatSize(file.size)}. Maximum is 20MB.` };
  }
  return { valid: true };
}

export function validateFile(file: File): MediaValidation {
  if (!FILE_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Use PDF, DOCX, TXT, CSV, or JSON.` };
  }
  if (file.size > LIMITS.file.maxSize) {
    return { valid: false, error: `File too large: ${formatSize(file.size)}. Maximum is 25MB.` };
  }
  return { valid: true };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { LIMITS };

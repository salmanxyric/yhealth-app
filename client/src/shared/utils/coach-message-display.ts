const TOOL_ARTIFACT_PATTERNS = [
  /"type"\s*:\s*"(?:functionCall|functionResponse|tool_call|tool_result)"/i,
  /"functionCall"\s*:/i,
  /"functionResponse"\s*:/i,
  /"tool_calls"\s*:/i,
  /"additional_kwargs"\s*:/i,
  /"function"\s*:\s*\{\s*"name"\s*:/i,
];

function isToolArtifactLike(value: string): boolean {
  const text = value.trim();
  if (!text) return false;

  const startsLikeJson = text.startsWith("{") || text.startsWith("[");
  if (!startsLikeJson) return false;

  if (TOOL_ARTIFACT_PATTERNS.some((pattern) => pattern.test(text))) return true;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object") return false;
    const candidate = parsed as Record<string, unknown>;
    const type = String(candidate.type || "");
    return ["functionCall", "functionResponse", "tool_call", "tool_result"].includes(type);
  } catch {
    return false;
  }
}

export function isMCQAnswerMessage(value?: string | null): boolean {
  if (!value) return false;
  return value.trimStart().startsWith("[MCQ Answer]");
}

export function cleanCoachDisplayText(value?: string | null): string {
  if (!value) return "";

  const original = value.trim();
  if (!original || isToolArtifactLike(original) || original === "[object Object]") return "";

  return original
    .replace(/<!--CHECKIN:[\s\S]*?-->/g, "")
    .replace(/<!--ARTIFACT:[\s\S]*?-->/g, "")
    .split(/\r?\n/)
    .filter((line) => !isToolArtifactLike(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripMarkdownForPreview(value?: string | null): string {
  if (!value) return "";
  const cleaned = cleanCoachDisplayText(value);
  return cleaned
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function getConversationDisplayTitle(params: {
  title?: string | null;
  lastMessagePreview?: string | null;
  messageCount?: number;
}): string {
  const title = stripMarkdownForPreview(params.title);
  if (title) return title;

  const preview = stripMarkdownForPreview(params.lastMessagePreview);
  if (preview) return preview;

  return params.messageCount && params.messageCount > 0
    ? `Chat (${params.messageCount})`
    : "New Chat";
}

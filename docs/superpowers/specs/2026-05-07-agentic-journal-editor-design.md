# Agentic Journal Editor — Design Spec

**Date:** 2026-05-07
**Status:** Approved
**Scope:** Replace plain textarea in `DistractionFreeEditor` with a premium, AI-powered rich text editor for yHealth journaling.

---

## Overview

The existing `DistractionFreeEditor.tsx` uses a plain `<textarea>` for journal entries. This spec defines the upgrade to a full rich text editor with multimedia blocks, a drawing canvas, voice/dictation support, and a three-layer agentic AI system — all wrapped in the existing Observatory dark theme.

**Architecture decision:** Extend the existing TipTap v2 installation (already in the project with `RichTextEditor.tsx`) rather than introducing a new editor framework. Custom TipTap extensions for each block type. No rip-and-replace.

---

## 1. Editor Architecture & Layout

The `DistractionFreeEditor` stays full-screen with the Observatory dark theme (deep space radial gradients, Cinzel/Nunito fonts, purple accents). The plain `<textarea>` is replaced by a TipTap editor instance.

### Layout Structure

```
TOP BAR
  Left:  [Auto-save badge] [Date picker] [MODE TAG]
  Right: [SAVE REFLECTION] [X close]

EDITOR AREA (max-w-3xl, centered)
  - TipTap rich content editor
  - Floating bubble toolbar on text selection
  - Slash menu on "/" keystroke
  - Ghost text AI completions
  - AI suggestion cards inline

AI PILL (floating, bottom-right)
  - Resting: small glowing pill "✦ AI"
  - Expanded: coaching panel with chat, insights, quick actions

STATUS BAR
  Left:  [Words] [Chars] [Completeness ██░░ 65%]
  Right: [Timer] [CTRL+ENTER TO SAVE]
```

### Key Decisions

- Editor area is `max-w-3xl` centered, matching current layout.
- No permanent toolbar — floating toolbar only on text selection.
- Slash menu is the primary insertion method for blocks and AI commands.
- AI pill floats bottom-right, expands into coaching panel on click or `Ctrl+J`.
- Status bar adds a live completeness score alongside existing word/char/timer.

---

## 2. Rich Text Formatting & Block Types

### Inline Formatting (Floating Bubble Toolbar)

| Format | Shortcut | TipTap Extension |
|--------|----------|-------------------|
| Bold | Ctrl+B | StarterKit |
| Italic | Ctrl+I | StarterKit |
| Underline | Ctrl+U | Underline |
| Strikethrough | Ctrl+Shift+X | StarterKit |
| Code inline | Ctrl+E | StarterKit |
| Highlight | Ctrl+Shift+H | Highlight |
| Link | Ctrl+K | Link |
| Text color | Toolbar picker | Color / TextStyle |
| Text alignment | Toolbar dropdown | TextAlign |
| AI actions | Toolbar menu | Custom (rewrite, expand, summarize) |

### Block Types (Slash Menu)

| Category | Blocks |
|----------|--------|
| **Text** | Paragraph, Heading 1-3, Blockquote, Callout |
| **Lists** | Bullet list, Numbered list, Task/checklist |
| **Code** | Code block with syntax highlighting (Lowlight) |
| **Media** | Image upload, Video embed, File attachment |
| **Audio** | Record audio clip, Voice-to-text dictation |
| **Canvas** | Drawing canvas block |
| **Dividers** | Horizontal rule, Page break |
| **AI** | Continue writing, Rewrite, Expand, Summarize, Generate prompt, CBT reframe |

### Slash Menu UX

- Fuzzy search: typing `/img` matches "Image upload"
- Categorized sections with icons
- Keyboard navigation (arrow keys + Enter)
- Recently used items pinned at top
- Built using TipTap's `Suggestion` plugin with a custom React `NodeViewRenderer`

---

## 3. Multimedia Blocks

Each media type is a custom TipTap `Node` extension rendered as a React `NodeViewRenderer`.

### Image Block

- **Upload methods:** drag & drop, paste clipboard, device file picker, URL input
- **Display:** inline preview with resize handles (aspect ratio locked), caption field, alt text
- **Toolbar:** resize, align (left/center/right), delete
- **Formats:** JPG, PNG, GIF, WebP, SVG
- **Max size:** 10MB with upload progress indicator
- **Storage:** uploaded to server API, URL stored in TipTap JSON content

### Audio Block

- **Record:** inline via MediaRecorder API (reuse existing `useVoiceRecorder.ts` hook)
- **Display:** playback bar with waveform visualization, duration display
- **Actions:** Transcribe (inserts editable text below), Download, Delete
- **Format:** WebM/Opus
- **Max duration:** 10 minutes per clip
- **Multiple blocks** allowed throughout entry

### Video Embed Block

- **Insert:** paste URL for auto-embed (YouTube, Vimeo, Loom) or upload file
- **Display:** responsive embed with configurable aspect ratio
- **Upload formats:** MP4, WebM
- **Max upload size:** 50MB
- **Toolbar:** resize, delete

### File Attachment Block

- **Display:** metadata card with file icon, name, size, upload date
- **Actions:** Preview (PDF first-page thumbnail), Download, Delete
- **Formats:** PDF, DOCX, TXT, CSV, JSON
- **Max size:** 25MB per file

### Upload Validation (All Media)

| Check | Rule |
|-------|------|
| File type | Whitelist per block type |
| File size | Per-type limits (image 10MB, video 50MB, file 25MB) |
| Dimensions | Images warned if >4000px either side |
| Duration | Audio max 10min, video max 30min |
| Total per entry | Max 20 media attachments |
| Upload state | Progress bar, retry on failure, cancel support |

---

## 4. Drawing Canvas

Opens as a full-screen overlay modal when `/drawing` is used. Built with **Fabric.js**.

### Tools

| Tool | Capability |
|------|-----------|
| Pen/Brush | Freehand drawing, width 1-20px, pressure sensitivity if available |
| Shapes | Rectangle, Circle, Ellipse, Triangle, Arrow, Line, Star |
| Text | Click to place, editable, font size/color/weight |
| Image | Import image onto canvas for annotation |
| Eraser | Object eraser (full strokes) + pixel eraser mode |
| Select | Click/drag select, multi-select, move, resize, rotate |
| Hand | Pan around canvas without selecting |

### Layers

- Reorderable by drag
- Toggle visibility per layer
- Lock layers to prevent accidental edits
- Add / delete layers

### Color System

- Preset palette matching Observatory theme (purples, blues, teals, warm accents)
- Full HSL color picker
- Eyedropper tool
- Recent colors row
- Opacity slider (0-100%)

### Canvas Features

- Infinite canvas with pan, zoom, pinch-zoom
- Grid dots background matching Observatory theme
- Keyboard: `Ctrl+Z` undo, `Ctrl+Shift+Z` redo, `Delete` remove selected, `Ctrl+A` select all

### Save Behavior

- "Save" exports canvas as PNG + stores Fabric.js JSON (for re-editing)
- Inserted into editor as a drawing block with preview thumbnail
- "Edit Drawing" reopens Fabric.js canvas with full state restored from JSON
- Block toolbar: Edit Drawing, Download PNG, Delete

---

## 5. Voice & Dictation

### Inline Audio Blocks

Covered in Section 3. Short voice notes embedded between text blocks with record, playback, and transcribe capabilities.

### Dedicated Dictation Mode

Activated via `/dictate` slash command or status bar toggle.

**Behavior:**
- Uses Web Speech API (`SpeechRecognition`) for real-time streaming
- Fallback to server-side Whisper API if browser doesn't support it
- Interim results shown as ghost text (lighter opacity), finalized on sentence boundaries
- Punctuation auto-inserted via speech patterns (pause = period, rising tone = question mark)
- Language: English default, configurable

**Dictation UI:**
- Floating pill at bottom-center with live waveform, elapsed time, Pause/Stop buttons
- Status bar shows "DICTATING" state with microphone icon
- Previously written content stays above — new text streams below at cursor

**Voice Commands During Dictation:**

| Say | Action |
|-----|--------|
| "New paragraph" | Insert paragraph break |
| "New line" | Insert line break |
| "Heading [text]" | Create H2 with spoken text |
| "Bullet point" | Start a bullet list item |
| "Delete that" | Remove last sentence |
| "Stop dictation" | End dictation mode |

**Post-Dictation Flow:**
1. Full audio saved as single attachment on the entry
2. Transcribed text is fully editable with all rich formatting tools
3. AI pill auto-suggests "Clean up transcript?" — fixes filler words, grammar, repetition
4. Emotion analysis runs on audio (reuses existing `VoiceEmotionAnalysis` type)

**Technical Integration:**
- Reuses existing `useVoiceRecorder.ts` hook for MediaRecorder
- Existing `VoiceJournalSession.tsx` logic refactored into TipTap editor context
- Transcription status tracked via existing `transcriptionStatus` field on `JournalEntry`

---

## 6. Agentic AI System — Command-Center Hybrid

Three AI layers that work together without cluttering the writing space.

### Layer 1: Ghost Text (Inline Completions)

- Triggers after 2 seconds of typing pause at end of sentence
- Context-aware: current entry + recent journal history + active mood from check-ins
- Styled as faded text (30% opacity), Observatory purple tint
- `Tab` accepts, `Esc` dismisses, keep typing ignores
- Rate-limited: max 1 suggestion per 10 seconds
- Togglable via status bar — user can disable per session

### Layer 2: Slash AI Commands

Accessible via `/ai` prefix in slash menu:

| Command | Action |
|---------|--------|
| `/ai continue` | Generate next paragraph based on context |
| `/ai rewrite` | Rewrite selected text (tone: softer, clearer, deeper) |
| `/ai expand` | Elaborate on selected text |
| `/ai summarize` | Condense selected text |
| `/ai reframe` | CBT cognitive reframe of negative thought |
| `/ai prompt` | Generate follow-up prompt based on what's written |
| `/ai gratitude` | Transform complaint into gratitude perspective |
| `/ai metaphor` | Offer metaphor for the emotion/situation described |
| `/ai letter` | Rewrite as compassionate letter to self |

**AI Output Card:**
- Appears as bordered card below cursor
- Actions: Insert, Regenerate, Edit before inserting, Dismiss
- Inserted text styled normally (no AI watermark)
- All AI generations logged for coaching layer reference

### Layer 3: Floating AI Pill

**Resting state:** Small glowing pill bottom-right with "✦ AI" label.

**Expanded state** (click or `Ctrl+J`):

| Feature | Behavior |
|---------|----------|
| Pattern detection | Analyzes word frequency, sentiment shifts, recurring themes in real-time |
| Past connections | Surfaces related entries from history (semantic search via embeddings) |
| Time-aware prompts | Morning: energizing. Evening: reflective. Late night: gentle wind-down |
| Mood tracking | Reads current check-in data, adjusts tone accordingly |
| Chat input | Free-text questions to AI about entry or journaling |
| Quick actions | Context-dependent one-click buttons (Reframe, Suggest prompt, Go deeper) |
| Coaching nudges | Proactive toasts (max 1 per 3 minutes), subtle, dismissable |

**Coaching Nudge Toasts:**
- Appear top-right, auto-dismiss after 8 seconds
- Max 1 nudge per 3 minutes
- Categories: encouragement, insight, suggestion, pattern
- User can mute nudges for the session via pill menu

### AI Backend

- All AI calls through server API (e.g., `/v1/ai/coach/journal`)
- Context payload: current entry text, journaling mode, recent entries summary, check-in mood, time of day
- Streaming responses for longer generations (SSE)
- Graceful degradation: if AI unavailable, editor works fully without it — ghost text and nudges simply don't appear

---

## 7. Validation & Auto-Save

### Auto-Save Triggers

| Trigger | Action |
|---------|--------|
| Every 30 seconds | Silent save as `draft` status |
| On media upload complete | Immediate save |
| On canvas save | Immediate save |
| On dictation stop | Immediate save |
| `Ctrl+Enter` | Final save — runs full validation |
| Tab close / navigate away | Emergency save via `beforeunload` |
| Focus lost (blur) | Save after 5 second delay |

### Auto-Save Status Indicator (Top Bar)

```
● SAVING...  →  ✓ SAVED 3s ago  →  ○ UNSAVED CHANGES  →  ⚠ SAVE FAILED [Retry]
```
- Animated transitions between states
- "SAVE FAILED" shows retry button + stores to localStorage as fallback
- Conflict detection: if entry modified server-side since last fetch, shows merge prompt

### Validation on Final Save

**Blockers** (prevent save):

| Check | Rule |
|-------|------|
| Empty entry | Cannot save completely empty entry |
| Media upload status | All uploads must be complete or failed (not in-progress) |
| File size total | Total attachments under 100MB per entry |

**Warnings** (prompt user, allow save):

| Check | Rule |
|-------|------|
| Minimum words | Per mode — Quick: 20, Deep Dive: 50, Gratitude: 30 |
| Canvas unsaved | Prompt to save or discard pending canvas edits |
| Audio transcription | Pending transcriptions flagged — save proceeds but marks status |

**AI Suggestions** (optional, non-blocking):

| Check | Behavior |
|-------|----------|
| Content quality | Detects unfinished thoughts, abrupt endings, unexplored threads |
| Sentiment shift | "Your tone shifted from positive to anxious — want to reflect on that?" |
| Prompt relevance | How well the entry addressed the journaling prompt |
| Closing reflection | Suggests adding a takeaway, lesson, or gratitude line |

### Completeness Score (Live in Status Bar)

**Formula:**
- Word count vs mode target: 40%
- Depth (sentence variety, vocabulary range): 20%
- Prompt relevance (topic coverage): 15%
- Structure (uses headings, lists, varied blocks): 10%
- Media richness (includes non-text content): 10%
- Reflection (contains introspective language): 5%

**Display:**
- Live percentage bar in status bar, updates as user types
- Color coded: red (<30%), amber (30-60%), green (>60%)
- Click opens mini breakdown tooltip
- Full validation review card shown on `Ctrl+Enter` with all checks listed

---

## 8. Data Model Changes

The existing `JournalEntry` type needs these additions:

```typescript
interface JournalEntry {
  // ... existing fields ...

  // Rich content (replaces plain entryText for new entries)
  contentJson?: TipTapJSON;         // TipTap document JSON
  contentHtml?: string;             // Rendered HTML (for display without TipTap)
  entryText: string;                // Plain text fallback (extracted from contentJson)

  // Media attachments
  attachments?: JournalAttachment[];

  // Drawing data
  drawings?: JournalDrawing[];

  // AI interactions
  aiInteractions?: AIInteraction[];

  // Validation
  completenessScore?: number;       // 0-100
  validationResult?: ValidationResult;

  // Draft status
  isDraft?: boolean;
  lastAutoSavedAt?: string;
}

interface JournalAttachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;              // audio/video
  width?: number;                   // image/video
  height?: number;                  // image/video
  caption?: string;
  altText?: string;
  transcription?: string;           // audio
  transcriptionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
}

interface JournalDrawing {
  id: string;
  fabricJson: string;               // Fabric.js canvas state JSON
  previewUrl: string;               // Rendered PNG URL
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

interface AIInteraction {
  id: string;
  type: 'completion' | 'rewrite' | 'expand' | 'summarize' | 'reframe' | 'prompt' | 'coaching';
  input: string;
  output: string;
  accepted: boolean;
  timestamp: string;
}

interface ValidationResult {
  completenessScore: number;
  wordCount: number;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  status: 'pass' | 'warn' | 'block' | 'suggestion';
  message: string;
}
```

### Backward Compatibility

- Existing entries with plain `entryText` continue to work — editor detects absence of `contentJson` and renders as plain text paragraph
- New entries always save both `contentJson` (TipTap JSON) and `entryText` (plain text extraction) for backward compatibility and search indexing
- Migration: no database migration needed for existing entries — new fields are optional

---

## 9. New Dependencies

| Package | Purpose | Size Impact |
|---------|---------|-------------|
| `@tiptap/extension-underline` | Underline formatting | ~2KB |
| `@tiptap/extension-highlight` | Text highlighting | ~3KB |
| `@tiptap/extension-text-align` | Text alignment | ~3KB |
| `@tiptap/extension-color` | Text color | ~2KB |
| `@tiptap/extension-text-style` | Text style base | ~2KB |
| `@tiptap/extension-task-list` | Checklist blocks | ~4KB |
| `@tiptap/extension-task-item` | Checklist items | ~3KB |
| `@tiptap/extension-placeholder` | Placeholder text | ~2KB |
| `@tiptap/suggestion` | Slash menu engine | ~5KB |
| `fabric` | Drawing canvas | ~300KB (lazy loaded) |
| `tippy.js` | Tooltip/popover for menus | ~7KB |

**Already installed (no new cost):** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-table`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-character-count`

**Lazy loading strategy:**
- Fabric.js loaded only when `/drawing` slash command is used (dynamic import)
- Video embed loaded only when video URL is pasted
- AI features loaded on first AI interaction

---

## 10. Component Architecture

```
DistractionFreeEditor/
├── DistractionFreeEditor.tsx           # Main shell (theme, layout, top/status bars)
├── AgenticEditor.tsx                   # TipTap editor instance + configuration
├── hooks/
│   ├── useAgenticEditor.ts             # TipTap editor setup, extensions, config
│   ├── useAutoSave.ts                  # Auto-save logic with debounce
│   ├── useValidation.ts               # Entry validation + completeness scoring
│   ├── useGhostText.ts                # AI inline completion logic
│   ├── useDictation.ts                # Speech-to-text streaming
│   └── useDrawingCanvas.ts            # Fabric.js canvas management
├── extensions/
│   ├── SlashMenu/
│   │   ├── slash-menu.ts               # TipTap Suggestion extension
│   │   ├── SlashMenuList.tsx           # React renderer for menu items
│   │   └── menu-items.ts              # All slash command definitions
│   ├── AudioBlock/
│   │   ├── audio-block.ts              # TipTap Node extension
│   │   └── AudioBlockView.tsx          # React NodeView (record, play, transcribe)
│   ├── DrawingBlock/
│   │   ├── drawing-block.ts            # TipTap Node extension
│   │   └── DrawingBlockView.tsx        # React NodeView (preview + edit trigger)
│   ├── VideoBlock/
│   │   ├── video-block.ts              # TipTap Node extension
│   │   └── VideoBlockView.tsx          # React NodeView (embed + upload)
│   ├── FileBlock/
│   │   ├── file-block.ts               # TipTap Node extension
│   │   └── FileBlockView.tsx           # React NodeView (metadata card)
│   ├── AIBlock/
│   │   ├── ai-suggestion.ts            # TipTap extension for AI output cards
│   │   └── AISuggestionView.tsx        # React NodeView (insert/regenerate/dismiss)
│   └── CalloutBlock/
│       ├── callout-block.ts            # TipTap Node extension
│       └── CalloutBlockView.tsx        # React NodeView
├── toolbar/
│   ├── BubbleToolbar.tsx               # Floating toolbar on text selection
│   └── toolbar-items.ts               # Toolbar button definitions
├── ai/
│   ├── AIPill.tsx                      # Floating AI pill + expanded panel
│   ├── AICoachPanel.tsx                # Coaching panel content (insights, chat, actions)
│   ├── GhostText.tsx                   # Ghost text overlay renderer
│   ├── CoachingNudge.tsx               # Toast notification component
│   └── ai-commands.ts                 # AI slash command handlers
├── canvas/
│   ├── DrawingCanvasModal.tsx          # Full-screen Fabric.js overlay
│   ├── CanvasToolbar.tsx               # Drawing tools bar
│   ├── LayersPanel.tsx                 # Layer management sidebar
│   └── ColorPicker.tsx                 # Observatory-themed color picker
├── dictation/
│   ├── DictationOverlay.tsx            # Dictation mode floating pill UI
│   └── DictationControls.tsx           # Pause/Stop/Waveform
├── validation/
│   ├── ValidationReview.tsx            # Final save validation modal
│   ├── CompletenessBar.tsx             # Status bar completeness indicator
│   └── validation-rules.ts            # All validation rule definitions
└── media/
    ├── MediaUploader.tsx               # Shared upload logic (progress, retry, cancel)
    ├── ImageUploadDialog.tsx           # Device/URL image picker
    └── media-validators.ts            # File type, size, dimension checks
```

---

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Final save (with validation) |
| `Escape` | Close editor (with unsaved changes prompt) |
| `Ctrl+J` | Toggle AI pill panel |
| `Ctrl+K` | Insert link |
| `Ctrl+B/I/U` | Bold / Italic / Underline |
| `Ctrl+Shift+X` | Strikethrough |
| `Ctrl+Shift+H` | Highlight |
| `Ctrl+E` | Inline code |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `/` | Open slash menu |
| `Tab` | Accept ghost text completion |
| `Esc` (in slash menu) | Close slash menu |

---

## 12. Theme Integration

All new components use the existing Observatory design system:

- **Background:** Deep space radial gradient (`#0e0a22` → `#070516` → `#02020a`)
- **Text:** `text-white` primary, `text-white/60` secondary
- **Accents:** Mode-specific purple/blue/teal from existing mode color map
- **Fonts:** Cinzel for display headings, Nunito for body text
- **Borders:** `border-white/10` for subtle separators
- **Glassmorphism:** `bg-white/5 backdrop-blur-sm` for floating elements (toolbar, AI pill, menus)
- **Animations:** Framer Motion for entry/exit, opacity transitions for ghost text
- **Glow effects:** Subtle box-shadow glow on active elements matching mode accent color

# yHealth Spacing & Layout System

> Consistent spacing, touch-friendly targets, and accessible layout patterns.

---

## Spacing Philosophy

### Design Principles

1. **4px Base Unit**: All spacing derives from a 4px base for mathematical consistency.
2. **Touch-Friendly**: Minimum 44×44px touch targets for accessibility (ages 25-55).
3. **Breathing Room**: Generous whitespace reduces cognitive load.
4. **Consistent Rhythm**: Predictable spacing creates visual harmony.
5. **Mobile-First**: Design for mobile, enhance for larger screens.

---

## Spacing Scale

### Core Scale (4px Base)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `space-0` | 0px | `p-0`, `m-0` | Reset, no spacing |
| `space-0.5` | 2px | `p-0.5`, `m-0.5` | Micro adjustments |
| `space-1` | 4px | `p-1`, `m-1` | Tight spacing, icon gaps |
| `space-1.5` | 6px | `p-1.5`, `m-1.5` | Small gaps |
| `space-2` | 8px | `p-2`, `m-2` | Compact spacing |
| `space-2.5` | 10px | `p-2.5`, `m-2.5` | Between compact and standard |
| `space-3` | 12px | `p-3`, `m-3` | Related elements |
| `space-3.5` | 14px | `p-3.5`, `m-3.5` | Slightly larger gaps |
| `space-4` | 16px | `p-4`, `m-4` | **Standard padding** |
| `space-5` | 20px | `p-5`, `m-5` | Card padding |
| `space-6` | 24px | `p-6`, `m-6` | Section gaps |
| `space-7` | 28px | `p-7`, `m-7` | Larger gaps |
| `space-8` | 32px | `p-8`, `m-8` | Major sections |
| `space-9` | 36px | `p-9`, `m-9` | Large gaps |
| `space-10` | 40px | `p-10`, `m-10` | Page margins |
| `space-11` | 44px | `p-11`, `m-11` | Touch target size |
| `space-12` | 48px | `p-12`, `m-12` | Large gaps |
| `space-14` | 56px | `p-14`, `m-14` | Section breaks |
| `space-16` | 64px | `p-16`, `m-16` | Hero spacing |
| `space-20` | 80px | `p-20`, `m-20` | Extra large |
| `space-24` | 96px | `p-24`, `m-24` | Maximum spacing |

### CSS Custom Properties
```css
:root {
  --space-0: 0;
  --space-0-5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1-5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2-5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3-5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-11: 2.75rem;    /* 44px */
  --space-12: 3rem;       /* 48px */
  --space-14: 3.5rem;     /* 56px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
}
```

---

## Component Spacing

### Cards

| Element | Spacing | Tailwind |
|---------|---------|----------|
| Card padding | 20px | `p-5` |
| Card padding (compact) | 16px | `p-4` |
| Card gap (in grid) | 16px | `gap-4` |
| Internal element gap | 12px | `gap-3` |
| Card border radius | 12px | `rounded-lg` |

```html
<div class="p-5 rounded-lg bg-card">
  <h3 class="text-lg font-semibold">Card Title</h3>
  <p class="mt-3 text-muted-foreground">Card content</p>
</div>
```

### Buttons

| Size | Padding | Height | Tailwind |
|------|---------|--------|----------|
| Small | 8px 12px | 32px | `px-3 py-2 h-8` |
| Medium | 12px 16px | 40px | `px-4 py-3 h-10` |
| Large | 16px 24px | 48px | `px-6 py-4 h-12` |

### Input Fields

| Element | Value | Tailwind |
|---------|-------|----------|
| Padding | 12px 16px | `px-4 py-3` |
| Height | 44px | `h-11` |
| Gap between inputs | 16px | `gap-4` |
| Label margin bottom | 8px | `mb-2` |

### Lists

| Element | Value | Tailwind |
|---------|-------|----------|
| List item padding | 16px | `p-4` |
| List item gap | 0 (dividers) | `divide-y` |
| Icon to text gap | 12px | `gap-3` |

---

## Touch Targets

### WCAG 2.2 Compliance

| Level | Minimum Size | Notes |
|-------|--------------|-------|
| AA (Required) | 24×24px | Minimum compliant |
| AAA (Recommended) | 44×44px | Optimal for all users |
| yHealth Standard | **44×44px** | For ages 25-55 accessibility |

### Touch Target Guidelines

| Element | Minimum | Recommended | Tailwind |
|---------|---------|-------------|----------|
| Primary buttons | 44×44px | 48×48px | `min-h-11 min-w-11` |
| Secondary buttons | 40×40px | 44×44px | `min-h-10 min-w-10` |
| Icon buttons | 44×44px | 44×44px | `h-11 w-11` |
| List items | 44px height | 48px+ | `min-h-11` |
| Toggles/Switches | 44×24px | 48×24px | `h-6 w-12` |
| Checkboxes | 24×24px | 24×24px + padding | `h-6 w-6` |

### Touch Target Spacing

| Element | Spacing | Tailwind |
|---------|---------|----------|
| Between buttons | 12px min | `gap-3` |
| Between icons | 8px min | `gap-2` |
| Button clusters | 16px | `gap-4` |

```html
<!-- Accessible button with proper touch target -->
<button class="min-h-11 min-w-11 px-4 py-3 rounded-md">
  Submit
</button>

<!-- Icon button with touch target -->
<button class="h-11 w-11 flex items-center justify-center rounded-full">
  <Icon class="h-5 w-5" />
</button>
```

---

## Border Radius

### Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `radius-none` | 0px | `rounded-none` | Sharp edges |
| `radius-sm` | 4px | `rounded-sm` | Badges, tags |
| `radius-md` | 8px | `rounded-md` | Buttons, inputs |
| `radius-lg` | 12px | `rounded-lg` | Cards |
| `radius-xl` | 16px | `rounded-xl` | Modals, sheets |
| `radius-2xl` | 20px | `rounded-2xl` | Large containers |
| `radius-full` | 9999px | `rounded-full` | Pills, avatars, circular buttons |

### Usage by Component

| Component | Border Radius | Tailwind |
|-----------|---------------|----------|
| Buttons | 8px | `rounded-md` |
| Input fields | 8px | `rounded-md` |
| Cards | 12px | `rounded-lg` |
| Modals | 16px | `rounded-xl` |
| Bottom sheets | 16px (top only) | `rounded-t-xl` |
| Avatars | Full | `rounded-full` |
| Badges | 4px | `rounded-sm` |
| Pills | Full | `rounded-full` |
| Progress rings | Full | `rounded-full` |

### CSS Custom Properties
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.25rem;   /* 20px */
  --radius-full: 9999px;
}
```

---

## Layout Patterns

### Page Structure

```
┌──────────────────────────────────────────────┐
│  Status Bar (system)                         │
├──────────────────────────────────────────────┤
│  Header: h-14 (56px), px-4                   │
├──────────────────────────────────────────────┤
│                                              │
│  Content Area: px-4, py-6                    │
│  (scrollable)                                │
│                                              │
│                                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  Tab Bar: h-16 (64px) + safe area            │
└──────────────────────────────────────────────┘
```

### Page Margins

| Breakpoint | Horizontal Padding | Tailwind |
|------------|-------------------|----------|
| Mobile (<640px) | 16px | `px-4` |
| Tablet (640-1024px) | 24px | `sm:px-6` |
| Desktop (>1024px) | 32px | `lg:px-8` |

### Safe Areas
Always account for device safe areas (notches, home indicators):

```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

.top-header {
  padding-top: env(safe-area-inset-top);
}
```

---

## Grid System

### Dashboard Grid

```css
/* 2-column grid for metric cards */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px; /* gap-4 */
}

/* Full-width card */
.dashboard-grid .full-width {
  grid-column: span 2;
}
```

```html
<div class="grid grid-cols-2 gap-4 px-4">
  <div class="card">Fitness</div>
  <div class="card">Nutrition</div>
  <div class="card col-span-2">AI Coach Insights</div>
  <div class="card">Wellbeing</div>
  <div class="card">Sleep</div>
</div>
```

### Responsive Grid

| Breakpoint | Columns | Gap | Tailwind |
|------------|---------|-----|----------|
| Mobile | 2 | 16px | `grid-cols-2 gap-4` |
| Tablet | 3 | 20px | `sm:grid-cols-3 sm:gap-5` |
| Desktop | 4 | 24px | `lg:grid-cols-4 lg:gap-6` |

---

## Vertical Rhythm

### Section Spacing

| Between Elements | Spacing | Tailwind |
|------------------|---------|----------|
| Same-level items | 8-12px | `gap-2` or `gap-3` |
| Related sections | 16-24px | `gap-4` or `gap-6` |
| Major sections | 32-48px | `gap-8` or `gap-12` |
| Page sections | 48-64px | `gap-12` or `gap-16` |

### Content Flow Example

```html
<main class="px-4 py-6">
  <!-- Hero section -->
  <section class="mb-8">
    <h1>Good morning</h1>
    <p class="mt-2">Your daily summary</p>
  </section>

  <!-- Metrics grid -->
  <section class="mb-8">
    <h2 class="mb-4">Today's Progress</h2>
    <div class="grid grid-cols-2 gap-4">
      <!-- cards -->
    </div>
  </section>

  <!-- Insights -->
  <section class="mb-8">
    <h2 class="mb-4">Coach Insights</h2>
    <div class="space-y-4">
      <!-- insight cards -->
    </div>
  </section>
</main>
```

---

## Component Dimensions

### Fixed Heights

| Component | Height | Tailwind |
|-----------|--------|----------|
| Header | 56px | `h-14` |
| Tab bar | 64px | `h-16` |
| Bottom sheet handle | 20px | `h-5` |
| Search bar | 44px | `h-11` |
| Compact metric card | 80px | `h-20` |
| Standard metric card | 120px | `h-30` |
| Large metric card | 160px | `h-40` |

### Icon Sizes

| Size | Value | Tailwind | Usage |
|------|-------|----------|-------|
| XS | 12px | `h-3 w-3` | Inline indicators |
| SM | 16px | `h-4 w-4` | Secondary icons |
| MD | 20px | `h-5 w-5` | Default icons |
| LG | 24px | `h-6 w-6` | Navigation icons |
| XL | 32px | `h-8 w-8` | Featured icons |
| 2XL | 40px | `h-10 w-10` | Large display |
| 3XL | 48px | `h-12 w-12` | Hero icons |

### Avatar Sizes

| Size | Value | Tailwind | Usage |
|------|-------|----------|-------|
| XS | 24px | `h-6 w-6` | Compact lists |
| SM | 32px | `h-8 w-8` | Standard lists |
| MD | 40px | `h-10 w-10` | Default |
| LG | 48px | `h-12 w-12` | Profile headers |
| XL | 64px | `h-16 w-16` | Profile pages |
| 2XL | 96px | `h-24 w-24` | Settings/onboarding |

---

## Z-Index Scale

### Layering System

| Token | Value | Usage |
|-------|-------|-------|
| `z-0` | 0 | Base content |
| `z-10` | 10 | Elevated cards |
| `z-20` | 20 | Sticky headers |
| `z-30` | 30 | Fixed elements |
| `z-40` | 40 | Overlays |
| `z-50` | 50 | Modal backdrops |
| `z-60` | 60 | Modals, sheets |
| `z-70` | 70 | Popovers, dropdowns |
| `z-80` | 80 | Tooltips |
| `z-90` | 90 | Toast notifications |
| `z-100` | 100 | Critical alerts |

### CSS Custom Properties
```css
:root {
  --z-base: 0;
  --z-elevated: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-overlay: 40;
  --z-modal-backdrop: 50;
  --z-modal: 60;
  --z-popover: 70;
  --z-tooltip: 80;
  --z-toast: 90;
  --z-critical: 100;
}
```

---

## Responsive Breakpoints

### Breakpoint Scale

| Token | Value | Tailwind Prefix | Description |
|-------|-------|-----------------|-------------|
| `sm` | 640px | `sm:` | Large phones, small tablets |
| `md` | 768px | `md:` | Tablets |
| `lg` | 1024px | `lg:` | Small laptops |
| `xl` | 1280px | `xl:` | Desktops |
| `2xl` | 1536px | `2xl:` | Large screens |

### Mobile-First Approach

```css
/* Base styles (mobile) */
.card {
  padding: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .card {
    padding: 20px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .card {
    padding: 24px;
  }
}
```

Tailwind equivalent:
```html
<div class="p-4 md:p-5 lg:p-6">
  <!-- Card content -->
</div>
```

---

## Usage Examples

### Dashboard Layout
```html
<div class="min-h-screen bg-background">
  <!-- Header -->
  <header class="sticky top-0 z-20 h-14 bg-background border-b border-border px-4 flex items-center">
    <h1 class="text-lg font-semibold">yHealth</h1>
  </header>

  <!-- Main content -->
  <main class="px-4 py-6 pb-20">
    <!-- Greeting -->
    <section class="mb-6">
      <h2 class="text-2xl font-bold">Good morning</h2>
      <p class="text-muted-foreground mt-1">Here's your daily summary</p>
    </section>

    <!-- Metrics grid -->
    <section class="mb-8">
      <div class="grid grid-cols-2 gap-4">
        <div class="p-5 rounded-lg bg-card min-h-[120px]">
          <!-- Fitness card -->
        </div>
        <div class="p-5 rounded-lg bg-card min-h-[120px]">
          <!-- Nutrition card -->
        </div>
        <div class="p-5 rounded-lg bg-card min-h-[120px] col-span-2">
          <!-- AI Coach card -->
        </div>
      </div>
    </section>
  </main>

  <!-- Tab bar -->
  <nav class="fixed bottom-0 left-0 right-0 z-30 h-16 bg-card border-t border-border px-4 pb-safe">
    <div class="flex justify-around items-center h-full">
      <button class="min-h-11 min-w-11 flex flex-col items-center justify-center">
        <Icon class="h-6 w-6" />
        <span class="text-xs mt-1">Home</span>
      </button>
      <!-- More tabs -->
    </div>
  </nav>
</div>
```

---

*yHealth Spacing & Layout System v1.0 | 4px base unit, 44px touch targets*

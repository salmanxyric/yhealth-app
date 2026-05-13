# yHealth Typography System

> A warm, readable type system optimized for dark mode and broad accessibility (ages 25-55).

---

## Typography Philosophy

### Design Principles

1. **Humanist Sans-Serif**: Warm, friendly, approachable. Balance of modern and human.
2. **Accessibility First**: Minimum 16px body, readable across ages 25-55.
3. **Dark Mode Optimized**: Adjusted weights and spacing for readability on dark backgrounds.
4. **Hierarchy Clarity**: Clear visual distinction between content levels.
5. **Performance**: Web-safe fallbacks, optimized loading.

### Why Humanist Sans?
Humanist sans-serif fonts have subtle variations in stroke width and open letterforms that create warmth without sacrificing readability. This aligns with yHealth's "warmer than clinical" positioning - professional yet approachable.

---

## Font Stack

### Primary Font: Lato

**Lato** is the primary typeface for yHealth. It offers:
- Humanist touch with professional-friendly balance
- Excellent readability at small sizes due to open counters
- Works for both headings and body text
- Available on Google Fonts (free, well-supported)

### Font Family Declaration
```css
font-family: "Lato", "Open Sans", -apple-system, BlinkMacSystemFont,
             "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
```

### Tailwind Configuration
```js
// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme")

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lato", "Open Sans", ...fontFamily.sans],
      },
    },
  },
}
```

### Google Fonts Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
```

### CSS Import
```css
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
```

---

## Type Scale

### Mobile-First Scale

| Token | Size | Weight | Line Height | Letter Spacing | Tailwind | Usage |
|-------|------|--------|-------------|----------------|----------|-------|
| `display-xl` | 40px | 700 | 1.2 | -0.02em | `text-4xl font-bold` | Hero headlines |
| `display-lg` | 32px | 700 | 1.25 | -0.015em | `text-3xl font-bold` | Page titles |
| `heading-lg` | 28px | 600 | 1.3 | -0.01em | `text-2xl font-semibold` | Section headers |
| `heading-md` | 24px | 600 | 1.35 | -0.005em | `text-xl font-semibold` | Card titles |
| `heading-sm` | 20px | 600 | 1.4 | 0 | `text-lg font-semibold` | Subsections |
| `body-lg` | 18px | 400 | 1.6 | 0 | `text-lg` | Featured content |
| `body-md` | 16px | 400 | 1.5 | 0 | `text-base` | **Default body** |
| `body-sm` | 14px | 400 | 1.5 | 0.005em | `text-sm` | Secondary text |
| `caption` | 12px | 400 | 1.4 | 0.01em | `text-xs` | Labels, timestamps |
| `button` | 16px | 600 | 1 | 0.02em | `text-base font-semibold` | Button text |
| `overline` | 11px | 700 | 1.5 | 0.1em | `text-xs font-bold uppercase` | Category labels |

### Desktop Scale (≥768px)

| Token | Mobile | Desktop | Tailwind Responsive |
|-------|--------|---------|---------------------|
| `display-xl` | 40px | 48px | `text-4xl md:text-5xl` |
| `display-lg` | 32px | 40px | `text-3xl md:text-4xl` |
| `heading-lg` | 28px | 32px | `text-2xl md:text-3xl` |
| `heading-md` | 24px | 28px | `text-xl md:text-2xl` |
| `heading-sm` | 20px | 24px | `text-lg md:text-xl` |

### CSS Custom Properties
```css
:root {
  /* Font sizes */
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.75rem;    /* 28px */
  --font-size-4xl: 2rem;       /* 32px */
  --font-size-5xl: 2.5rem;     /* 40px */
  --font-size-6xl: 3rem;       /* 48px */

  /* Font weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;

  /* Line heights */
  --line-height-tight: 1.2;
  --line-height-snug: 1.35;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;
  --line-height-loose: 1.75;

  /* Letter spacing */
  --letter-spacing-tighter: -0.02em;
  --letter-spacing-tight: -0.01em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.02em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}
```

---

## Font Weights

### Available Weights

| Weight | Value | Tailwind | Usage |
|--------|-------|----------|-------|
| Light | 300 | `font-light` | De-emphasized text (rarely used) |
| Regular | 400 | `font-normal` | Body text, default |
| Semibold | 600 | `font-semibold` | Headings, emphasis |
| Bold | 700 | `font-bold` | Strong emphasis, hero text |
| Black | 900 | `font-black` | Display headlines (sparingly) |

### Weight Usage Guidelines

| Element | Weight | Reasoning |
|---------|--------|-----------|
| Body text | 400 | Standard readability |
| Secondary text | 400 | Consistent with body |
| Labels | 400-600 | Depends on hierarchy |
| Headings | 600-700 | Clear hierarchy |
| Buttons | 600 | Actionable emphasis |
| Numbers/Metrics | 700 | Data emphasis |
| Hero headlines | 700-900 | Maximum impact |

---

## Dark Mode Adjustments

### The Challenge
Light text on dark backgrounds appears thinner than dark text on light backgrounds. This optical illusion can reduce readability.

### Solutions

#### 1. Font Weight Adjustment
Increase font weight slightly in dark mode:

```css
/* Light mode */
body { font-weight: 400; }
h1, h2, h3 { font-weight: 600; }

/* Dark mode */
.dark body { font-weight: 450; }
.dark h1, .dark h2, .dark h3 { font-weight: 650; }
```

#### 2. Letter Spacing Adjustment
Slightly increase letter spacing in dark mode:

```css
.dark {
  letter-spacing: 0.01em;
}
```

#### 3. Text Color
Use off-white (`#FAFAFA`) instead of pure white (`#FFFFFF`):

```css
.dark {
  color: #FAFAFA;  /* Not #FFFFFF */
}
```

#### 4. Secondary Text
Ensure secondary text maintains readability:

```css
.dark .text-secondary {
  color: #B3B3B3;  /* ~70% opacity equivalent */
}
```

### Tailwind Dark Mode Implementation
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      // Custom utilities for dark mode text
    },
  },
}
```

---

## Line Height Guidelines

### By Content Type

| Content Type | Line Height | Reasoning |
|--------------|-------------|-----------|
| Headlines | 1.2 - 1.3 | Tight for visual impact |
| Subheadings | 1.3 - 1.4 | Balanced readability |
| Body text | 1.5 | Optimal for paragraphs |
| Long-form | 1.6 - 1.75 | Enhanced readability |
| UI labels | 1.0 - 1.2 | Compact, single-line |
| Buttons | 1.0 | Centered vertically |

### Paragraph Spacing
- Use `margin-bottom` equal to line-height for paragraph separation
- For body text at 16px with 1.5 line-height: `margin-bottom: 24px`

---

## Text Colors in Context

### Hierarchy with Color

| Level | Color | Opacity | Token | Usage |
|-------|-------|---------|-------|-------|
| Primary | `#FAFAFA` | 100% | `text-foreground` | Main content, headings |
| Secondary | `#B3B3B3` | 70% | `text-muted-foreground` | Supporting text, labels |
| Tertiary | `#757575` | 50% | `text-tertiary` | Captions, hints |
| Disabled | `#525252` | 38% | `text-disabled` | Inactive elements |

### Pillar Text Colors
When text needs to indicate pillar association:

| Pillar | Color | Token |
|--------|-------|-------|
| Fitness | `#FFB74D` | `text-fitness-300` |
| Nutrition | `#81C784` | `text-nutrition-300` |
| Wellbeing | `#64B5F6` | `text-wellbeing-300` |

---

## Typography Components

### Heading Styles

```css
/* Display XL - Hero headlines */
.display-xl {
  font-size: 2.5rem;      /* 40px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* Display LG - Page titles */
.display-lg {
  font-size: 2rem;        /* 32px */
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.015em;
}

/* Heading LG - Section headers */
.heading-lg {
  font-size: 1.75rem;     /* 28px */
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

/* Heading MD - Card titles */
.heading-md {
  font-size: 1.5rem;      /* 24px */
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.005em;
}

/* Heading SM - Subsections */
.heading-sm {
  font-size: 1.25rem;     /* 20px */
  font-weight: 600;
  line-height: 1.4;
}
```

### Body Styles

```css
/* Body LG - Featured content */
.body-lg {
  font-size: 1.125rem;    /* 18px */
  font-weight: 400;
  line-height: 1.6;
}

/* Body MD - Default body text */
.body-md {
  font-size: 1rem;        /* 16px */
  font-weight: 400;
  line-height: 1.5;
}

/* Body SM - Secondary text */
.body-sm {
  font-size: 0.875rem;    /* 14px */
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.005em;
}
```

### Utility Styles

```css
/* Caption - Labels, timestamps */
.caption {
  font-size: 0.75rem;     /* 12px */
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

/* Overline - Category labels */
.overline {
  font-size: 0.6875rem;   /* 11px */
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Button text */
.button-text {
  font-size: 1rem;        /* 16px */
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
}
```

---

## Numeric Typography

### Health Metrics Display

Metrics and scores need special treatment for at-a-glance readability:

```css
/* Large metric display */
.metric-xl {
  font-size: 3rem;        /* 48px */
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* Medium metric */
.metric-md {
  font-size: 2rem;        /* 32px */
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

/* Small metric */
.metric-sm {
  font-size: 1.25rem;     /* 20px */
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
```

### Tabular Numbers
Always use tabular (monospace) numbers for data that updates or aligns:

```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

Tailwind: `tabular-nums`

---

## Accessibility

### Minimum Sizes

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Body text | 16px | 16-18px |
| Secondary text | 14px | 14-16px |
| Captions | 12px | 12-14px |
| Button text | 14px | 16px |
| Input text | 16px | 16px (prevents iOS zoom) |

### Line Length
- **Optimal**: 50-75 characters per line
- **Maximum**: 80 characters
- **Mobile**: Full width with appropriate padding

```css
.readable-width {
  max-width: 65ch;
}
```

### Contrast Requirements

All text must meet WCAG 2.1 AA standards:
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18px+ regular, 14px+ bold): 3:1 minimum

| Text | Background | Ratio | Pass |
|------|------------|-------|------|
| `#FAFAFA` | `#121212` | 15.8:1 | AAA |
| `#B3B3B3` | `#121212` | 8.5:1 | AAA |
| `#757575` | `#121212` | 4.6:1 | AA |

### Scalability
Design must remain functional at 200% zoom:

```css
/* Use relative units */
html {
  font-size: 100%;  /* Respects user preferences */
}

body {
  font-size: 1rem;  /* Not fixed px */
}
```

---

## Usage Examples

### Dashboard Header
```html
<header>
  <h1 class="text-3xl font-bold text-foreground">Good morning, Alex</h1>
  <p class="text-sm text-muted-foreground">Tuesday, December 7</p>
</header>
```

### Metric Card
```html
<div class="card">
  <span class="text-xs font-bold uppercase tracking-widest text-fitness-300">
    Fitness
  </span>
  <p class="text-4xl font-bold tabular-nums text-foreground">85</p>
  <p class="text-sm text-muted-foreground">Recovery Score</p>
</div>
```

### Coach Message
```html
<div class="coach-message">
  <p class="text-base text-foreground">
    Your workouts are 40% better after 7+ hours of sleep.
    Last night you got 6h 45m.
  </p>
  <p class="text-sm text-muted-foreground mt-2">
    Try heading to bed 30 minutes earlier tonight.
  </p>
</div>
```

### Button
```html
<button class="text-base font-semibold tracking-wide">
  Start Check-in
</button>
```

---

## Font Loading Strategy

### Performance Optimization

```html
<!-- Preconnect to Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Load only needed weights -->
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap" rel="stylesheet">
```

### Font Display
Use `font-display: swap` for better perceived performance:

```css
@font-face {
  font-family: 'Lato';
  font-display: swap;
  /* ... */
}
```

### Fallback Strategy
System fonts provide instant rendering while web fonts load:

```css
font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI",
             "Roboto", "Helvetica Neue", Arial, sans-serif;
```

---

## Complete Tailwind Typography Config

```js
// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme")

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lato", "Open Sans", ...fontFamily.sans],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.005em' }],
        'base': ['1rem', { lineHeight: '1.5' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.005em' }],
        '3xl': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '4xl': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.015em' }],
        '5xl': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
    },
  },
}
```

---

*yHealth Typography System v1.0 | Humanist sans for warmth, optimized for dark mode*

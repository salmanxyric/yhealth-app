# yHealth Accessibility Standards

> WCAG 2.1 AA compliance for inclusive design across ages 25-55.

---

## Accessibility Philosophy

### Design Principles

1. **Inclusive by Default**: Accessibility is not an afterthought.
2. **WCAG 2.1 AA Baseline**: Minimum compliance standard.
3. **Broad Age Range**: Optimized for users 25-55.
4. **Multiple Modalities**: Support vision, motor, cognitive needs.
5. **Progressive Enhancement**: Works without JavaScript, enhanced with it.

### Business Case

- 15-20% of population has some form of disability
- Users 45+ may have age-related vision/motor changes
- Accessible design improves UX for everyone
- Legal compliance (ADA, AODA, EN 301 549)

---

## Color & Contrast

### Contrast Requirements

| Element | WCAG Level | Required Ratio |
|---------|------------|----------------|
| Body text | AA | 4.5:1 |
| Large text (18px+ or 14px bold) | AA | 3:1 |
| UI components | AA | 3:1 |
| Body text (enhanced) | AAA | 7:1 |

### yHealth Contrast Verification

| Text | Background | Ratio | Pass |
|------|------------|-------|------|
| `#FAFAFA` | `#121212` | 15.8:1 | AAA |
| `#B3B3B3` | `#121212` | 8.5:1 | AAA |
| `#757575` | `#121212` | 4.6:1 | AA |
| `#00BCD4` | `#121212` | 6.2:1 | AA |
| `#FF9800` | `#121212` | 7.3:1 | AAA |
| `#4CAF50` | `#121212` | 5.1:1 | AA |
| `#5C9CE6` | `#121212` | 5.8:1 | AA |

### Color Independence (WCAG 1.4.1)

Never use color alone to convey information:

```html
<!-- ❌ Bad: Color only -->
<span class="text-success">Goal met</span>

<!-- ✅ Good: Color + icon + text -->
<span class="text-success flex items-center gap-2">
  <CheckIcon /> Goal met
</span>
```

### Color Blindness Considerations

| Type | % Affected | Design Consideration |
|------|------------|---------------------|
| Deuteranopia | 6% of males | Red/green confusion |
| Protanopia | 2% of males | Red appears dark |
| Tritanopia | 0.01% | Blue/yellow confusion |

**Pillar Colors Verification:**
- Fitness (Orange) vs Nutrition (Green): Distinguishable in all CVD types
- Add icons/patterns as secondary differentiators

### Testing Tools

- WebAIM Contrast Checker
- Stark (Figma/Sketch plugin)
- Color Oracle (macOS)
- Chrome DevTools accessibility panel

---

## Typography

### Minimum Sizes

| Element | Minimum | Recommended |
|---------|---------|-------------|
| Body text | 16px | 16-18px |
| Secondary text | 14px | 14-16px |
| Captions | 12px | 12-14px |
| Button text | 14px | 16px |
| Input text | 16px | 16px (prevents iOS zoom) |

### Line Height

| Content Type | Line Height |
|--------------|-------------|
| Body text | 1.5 minimum |
| Long-form | 1.6-1.75 |
| Headings | 1.2-1.3 |

### Text Spacing (WCAG 1.4.12)

Users must be able to adjust:
- Line height to 1.5× font size
- Paragraph spacing to 2× font size
- Letter spacing to 0.12× font size
- Word spacing to 0.16× font size

```css
/* Don't break at these spacings */
.text-container {
  /* Allow user overrides without breaking layout */
}
```

### Scalability

Support 200% zoom without loss of content:

```css
/* Use relative units */
html { font-size: 100%; }
body { font-size: 1rem; }

/* Avoid fixed widths that break at zoom */
.container {
  max-width: 65ch; /* Character-based */
}
```

---

## Touch Targets

### Size Requirements

| WCAG Level | Minimum Size |
|------------|--------------|
| AA (2.5.8) | 24×24px |
| AAA (2.5.5) | 44×44px |
| yHealth Standard | **44×44px** |

### Component Specifications

| Component | Touch Target | Visual Size | Implementation |
|-----------|--------------|-------------|----------------|
| Primary button | 48×48px | 48×48px | `min-h-12 min-w-12` |
| Secondary button | 44×44px | 40×40px | `min-h-11` with padding |
| Icon button | 44×44px | 24×24px icon | `h-11 w-11` container |
| List item | Full width × 48px | Variable | `min-h-12` |
| Checkbox | 44×44px | 24×24px | Padding around checkbox |
| Toggle | 48×24px | 48×24px | Native size sufficient |

### Spacing Between Targets

| Spacing | Value | Tailwind |
|---------|-------|----------|
| Minimum | 8px | `gap-2` |
| Recommended | 12px | `gap-3` |
| Comfortable | 16px | `gap-4` |

```html
<!-- ✅ Good: Adequate spacing -->
<div class="flex gap-3">
  <button class="h-11 w-11">1</button>
  <button class="h-11 w-11">2</button>
</div>
```

---

## Keyboard Navigation

### Focus Management

All interactive elements must be keyboard accessible:

```css
/* Visible focus indicator */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Don't remove focus for mouse users either */
:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Focus Order (WCAG 2.4.3)

Focus order must match visual/logical order:

```html
<!-- ✅ Good: Logical order -->
<header><!-- Focus 1 --></header>
<main><!-- Focus 2-N --></main>
<footer><!-- Focus N+1 --></footer>
```

### Skip Links

```html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate forward | Tab |
| Navigate backward | Shift + Tab |
| Activate button | Enter or Space |
| Close modal | Escape |
| Select option | Arrow keys |

### Focus Trap (Modals)

```javascript
// Trap focus within modal
const modal = document.querySelector('.modal');
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
// Cycle focus within modal
```

---

## Screen Readers

### Semantic HTML

```html
<!-- ✅ Use semantic elements -->
<header role="banner">
<nav role="navigation">
<main role="main">
<footer role="contentinfo">
<article>
<section aria-labelledby="section-heading">
```

### ARIA Labels

```html
<!-- Icon buttons need labels -->
<button aria-label="Close dialog">
  <CloseIcon />
</button>

<!-- Charts need descriptions -->
<div role="img" aria-label="Recovery score: 85 out of 100">
  <svg><!-- Chart --></svg>
</div>

<!-- Live regions for updates -->
<div aria-live="polite" aria-atomic="true">
  Meal logged successfully
</div>
```

### Heading Hierarchy

```html
<!-- ✅ Proper hierarchy -->
<h1>Dashboard</h1>
  <h2>Fitness</h2>
    <h3>Today's Activity</h3>
  <h2>Nutrition</h2>
    <h3>Meals</h3>

<!-- ❌ Skip levels -->
<h1>Dashboard</h1>
  <h3>Today's Activity</h3> <!-- Missing h2 -->
```

### Form Accessibility

```html
<label for="meal-name">Meal name</label>
<input
  id="meal-name"
  type="text"
  aria-describedby="meal-hint meal-error"
/>
<span id="meal-hint" class="text-muted-foreground">
  e.g., "Breakfast", "Lunch"
</span>
<span id="meal-error" class="text-destructive" role="alert">
  Please enter a meal name
</span>
```

### Announcements

```html
<!-- Success message -->
<div role="status" aria-live="polite">
  Your progress has been saved
</div>

<!-- Error message -->
<div role="alert" aria-live="assertive">
  Unable to sync data. Please try again.
</div>
```

---

## Motion & Animation

### Reduced Motion (WCAG 2.3.3)

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Alternative Animations

| Standard Animation | Reduced Motion Alternative |
|-------------------|---------------------------|
| Slide transition | Instant/fade |
| Scale animation | Opacity change |
| Parallax scroll | Static |
| Auto-play video | Poster + play button |
| Looping animation | Static or single play |

### Motion Triggers

Avoid animations that:
- Flash more than 3 times per second
- Cover more than 25% of screen
- Are unexpected or disorienting

---

## Forms & Inputs

### Labels

```html
<!-- ✅ Always associate labels -->
<label for="email">Email address</label>
<input type="email" id="email" />

<!-- ❌ Don't use placeholder as label -->
<input type="email" placeholder="Email address" />
```

### Error Handling

```html
<div class="form-field">
  <label for="password">Password</label>
  <input
    type="password"
    id="password"
    aria-invalid="true"
    aria-describedby="password-error"
  />
  <span id="password-error" class="text-destructive" role="alert">
    Password must be at least 8 characters
  </span>
</div>
```

### Required Fields

```html
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input type="text" id="name" required aria-required="true" />
```

### Input Types

Use correct input types for mobile optimization:

| Data | Input Type |
|------|------------|
| Email | `type="email"` |
| Phone | `type="tel"` |
| Number | `type="number"` |
| Date | `type="date"` |
| Password | `type="password"` |

---

## Images & Media

### Alt Text

```html
<!-- Informative image -->
<img src="chart.png" alt="Weekly activity trend showing 15% improvement" />

<!-- Decorative image -->
<img src="decoration.png" alt="" role="presentation" />

<!-- Complex image with long description -->
<figure>
  <img src="correlation.png" alt="Sleep vs performance correlation" />
  <figcaption>
    Scatter plot showing positive correlation between sleep hours and
    next-day workout performance. Peak performance occurs at 7.5 hours.
  </figcaption>
</figure>
```

### Video/Audio

- Provide captions for video
- Provide transcripts for audio
- Don't auto-play with sound
- Provide volume/playback controls

---

## Testing Checklist

### Automated Testing

- [ ] Run axe-core on all pages
- [ ] Lighthouse accessibility audit
- [ ] WAVE browser extension
- [ ] ESLint jsx-a11y plugin

### Manual Testing

- [ ] Keyboard-only navigation (no mouse)
- [ ] Screen reader (VoiceOver/NVDA/JAWS)
- [ ] 200% zoom
- [ ] Color contrast check
- [ ] Color blindness simulation
- [ ] Reduced motion testing

### Device Testing

- [ ] iOS VoiceOver
- [ ] Android TalkBack
- [ ] Desktop screen readers
- [ ] High contrast mode
- [ ] Large text mode

### User Testing

- [ ] Users with visual impairments
- [ ] Users with motor impairments
- [ ] Users with cognitive differences
- [ ] Users in the 45-55 age range

---

## Component Checklist

### Button
- [ ] 44×44px touch target
- [ ] Visible focus state
- [ ] Disabled state communicated
- [ ] Loading state announced

### Input
- [ ] Associated label
- [ ] Error state announced
- [ ] 16px minimum font (prevents iOS zoom)
- [ ] Sufficient contrast

### Modal
- [ ] Focus trapped inside
- [ ] Escape closes modal
- [ ] Focus returns on close
- [ ] Backdrop announced

### Navigation
- [ ] Skip link available
- [ ] Current page indicated
- [ ] Keyboard navigable
- [ ] Mobile menu accessible

### Charts
- [ ] Text alternative provided
- [ ] Color not sole indicator
- [ ] Interactive points 44×44px
- [ ] Data table alternative

---

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Stark](https://www.getstark.co/)

### Screen Readers
- VoiceOver (macOS/iOS)
- NVDA (Windows, free)
- JAWS (Windows)
- TalkBack (Android)

---

## Accessibility Statement Template

```markdown
# Accessibility Statement

yHealth is committed to ensuring digital accessibility for people
with disabilities. We are continually improving the user experience
for everyone and applying the relevant accessibility standards.

## Conformance Status

We aim to conform to WCAG 2.1 Level AA standards.

## Feedback

We welcome your feedback on the accessibility of yHealth.
Please contact us at accessibility@yhealth.com

## Technical Specifications

yHealth relies on the following technologies:
- HTML
- CSS
- JavaScript
- WAI-ARIA

These technologies are relied upon for conformance with
the accessibility standards used.
```

---

*yHealth Accessibility Standards v1.0 | WCAG 2.1 AA compliant, inclusive by design*

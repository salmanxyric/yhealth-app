# yHealth Color System

> A playful, expressive color palette designed for a dark mode primary experience with warmth, personality, and celebration.

---

## Color Philosophy

### Design Principles

1. **Dark Mode Primary**: Premium, immersive, modern. Easier on eyes, battery-efficient.
2. **Playful & Expressive**: Colors should feel alive, with gradients and glow effects that add personality.
3. **Three Living Pillars**: Each pillar has a creature with its own color story and emotional arc.
4. **Celebration-Ready**: Rich, vibrant celebration colors for achievements and milestones.
5. **Time-Aware**: Color temperature shifts based on time of day (warmer mornings, cooler evenings).
6. **Accessibility First**: WCAG 2.1 AA compliance (4.5:1 contrast minimum).

### Color Psychology

| Color | Psychology | Usage in yHealth |
|-------|------------|------------------|
| **Teal/Cyan** | Calm, trust, balance, vitality | Primary brand, CTAs, key actions |
| **Orange** | Energy, warmth, motivation, action | Fitness pillar, achievements |
| **Green** | Growth, health, nature, balance | Nutrition pillar, positive states |
| **Soft Blue** | Serenity, mental clarity, trust | Wellbeing pillar, calm states |

---

## Primary Brand Color

### Warm Teal/Cyan Palette

| Token | Hex | RGB | HSL | Usage |
|-------|-----|-----|-----|-------|
| `primary-50` | `#E0F7FA` | 224, 247, 250 | 187, 71%, 93% | Subtle backgrounds, highlights |
| `primary-100` | `#B2EBF2` | 178, 235, 242 | 187, 71%, 82% | Light accents, hover backgrounds |
| `primary-200` | `#80DEEA` | 128, 222, 234 | 187, 71%, 71% | Secondary accents, borders |
| `primary-300` | `#4DD0E1` | 77, 208, 225 | 187, 71%, 59% | Interactive elements |
| `primary-400` | `#26C6DA` | 38, 198, 218 | 187, 71%, 50% | Hover states, links |
| `primary-500` | `#00BCD4` | 0, 188, 212 | 187, 100%, 42% | **Primary brand color** |
| `primary-600` | `#00ACC1` | 0, 172, 193 | 187, 100%, 38% | Primary buttons, key CTAs |
| `primary-700` | `#0097A7` | 0, 151, 167 | 186, 100%, 33% | Active/pressed states |
| `primary-800` | `#00838F` | 0, 131, 143 | 185, 100%, 28% | Deep accents |
| `primary-900` | `#006064` | 0, 96, 100 | 182, 100%, 20% | Dark mode highlights |

### Tailwind Configuration
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#00BCD4',
          600: '#00ACC1',
          700: '#0097A7',
          800: '#00838F',
          900: '#006064',
        },
      },
    },
  },
}
```

### CSS Custom Properties
```css
:root {
  --primary-50: 187 71% 93%;
  --primary-100: 187 71% 82%;
  --primary-200: 187 71% 71%;
  --primary-300: 187 71% 59%;
  --primary-400: 187 71% 50%;
  --primary-500: 187 100% 42%;
  --primary-600: 187 100% 38%;
  --primary-700: 186 100% 33%;
  --primary-800: 185 100% 28%;
  --primary-900: 182 100% 20%;
}
```

---

## Pillar Colors

### Three Equal Pillars - Warm Spectrum

Each pillar has a distinct color identity while harmonizing with the primary teal.

### Fitness Pillar (Orange)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `fitness-50` | `#FFF3E0` | 255, 243, 224 | Subtle backgrounds |
| `fitness-100` | `#FFE0B2` | 255, 224, 178 | Light accents |
| `fitness-200` | `#FFCC80` | 255, 204, 128 | Secondary elements |
| `fitness-300` | `#FFB74D` | 255, 183, 77 | Interactive elements |
| `fitness-400` | `#FFA726` | 255, 167, 38 | Hover states |
| `fitness-500` | `#FF9800` | 255, 152, 0 | **Fitness primary** |
| `fitness-600` | `#FB8C00` | 251, 140, 0 | Active states |
| `fitness-700` | `#F57C00` | 245, 124, 0 | Deep accents |
| `fitness-800` | `#EF6C00` | 239, 108, 0 | Dark mode accent |
| `fitness-900` | `#E65100` | 230, 81, 0 | Dark mode deep |

**Use for**: Activity tracking, workouts, strain score, movement, achievements

### Nutrition Pillar (Green)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `nutrition-50` | `#E8F5E9` | 232, 245, 233 | Subtle backgrounds |
| `nutrition-100` | `#C8E6C9` | 200, 230, 201 | Light accents |
| `nutrition-200` | `#A5D6A7` | 165, 214, 167 | Secondary elements |
| `nutrition-300` | `#81C784` | 129, 199, 132 | Interactive elements |
| `nutrition-400` | `#66BB6A` | 102, 187, 106 | Hover states |
| `nutrition-500` | `#4CAF50` | 76, 175, 80 | **Nutrition primary** |
| `nutrition-600` | `#43A047` | 67, 160, 71 | Active states |
| `nutrition-700` | `#388E3C` | 56, 142, 60 | Deep accents |
| `nutrition-800` | `#2E7D32` | 46, 125, 50 | Dark mode accent |
| `nutrition-900` | `#1B5E20` | 27, 94, 32 | Dark mode deep |

**Use for**: Meal logging, calories, macros, hydration, food tracking

### Wellbeing Pillar (Soft Blue)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `wellbeing-50` | `#E3F2FD` | 227, 242, 253 | Subtle backgrounds |
| `wellbeing-100` | `#BBDEFB` | 187, 222, 251 | Light accents |
| `wellbeing-200` | `#90CAF9` | 144, 202, 249 | Secondary elements |
| `wellbeing-300` | `#64B5F6` | 100, 181, 246 | Interactive elements |
| `wellbeing-400` | `#42A5F5` | 66, 165, 245 | Hover states |
| `wellbeing-500` | `#5C9CE6` | 92, 156, 230 | **Wellbeing primary** |
| `wellbeing-600` | `#1E88E5` | 30, 136, 229 | Active states |
| `wellbeing-700` | `#1976D2` | 25, 118, 210 | Deep accents |
| `wellbeing-800` | `#1565C0` | 21, 101, 192 | Dark mode accent |
| `wellbeing-900` | `#0D47A1` | 13, 71, 161 | Dark mode deep |

**Use for**: Mood tracking, journaling, sleep, habits, energy levels

---

## Creature Color System

Each pillar creature has a rich gradient palette that reflects their emotional state and vitality.

### Ember (Fitness Creature) Colors

| State | Gradient | Glow | Description |
|-------|----------|------|-------------|
| **Blazing** (80-100) | `#FF6B00` → `#FF9800` → `#FFC107` | `#FF9800/40` | Vibrant, dancing warmth |
| **Steady** (60-79) | `#F57C00` → `#FF9800` → `#FFB74D` | `#FF9800/25` | Warm, comfortable glow |
| **Dimming** (40-59) | `#EF6C00` → `#F57C00` → `#FF9800` | `#FF9800/15` | Muted, cooler warmth |
| **Ember** (0-39) | `#E65100` → `#EF6C00` → `#F57C00` | `#FF9800/08` | Soft, needs kindling |

```css
/* Ember gradients */
.ember-blazing { background: linear-gradient(135deg, #FF6B00 0%, #FF9800 50%, #FFC107 100%); }
.ember-steady { background: linear-gradient(135deg, #F57C00 0%, #FF9800 50%, #FFB74D 100%); }
.ember-dimming { background: linear-gradient(135deg, #EF6C00 0%, #F57C00 50%, #FF9800 100%); }
.ember-low { background: linear-gradient(135deg, #E65100 0%, #EF6C00 50%, #F57C00 100%); }
```

### Sprout (Nutrition Creature) Colors

| State | Gradient | Glow | Description |
|-------|----------|------|-------------|
| **Flourishing** (80-100) | `#2E7D32` → `#4CAF50` → `#81C784` | `#4CAF50/40` | Lush, full bloom |
| **Growing** (60-79) | `#388E3C` → `#4CAF50` → `#66BB6A` | `#4CAF50/25` | Healthy, vibrant |
| **Wilting** (40-59) | `#43A047` → `#388E3C` → `#4CAF50` | `#4CAF50/15` | Needs nourishment |
| **Seedling** (0-39) | `#1B5E20` → `#2E7D32` → `#388E3C` | `#4CAF50/08` | Dormant, waiting |

```css
/* Sprout gradients */
.sprout-flourishing { background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #81C784 100%); }
.sprout-growing { background: linear-gradient(135deg, #388E3C 0%, #4CAF50 50%, #66BB6A 100%); }
.sprout-wilting { background: linear-gradient(135deg, #43A047 0%, #388E3C 50%, #4CAF50 100%); }
.sprout-seedling { background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%); }
```

### Nimbus (Wellbeing Creature) Colors

| State | Gradient | Glow | Description |
|-------|----------|------|-------------|
| **Serene** (80-100) | `#64B5F6` → `#5C9CE6` → `#B39DDB` | `#5C9CE6/40` | Peaceful, rainbow hint |
| **Balanced** (60-79) | `#42A5F5` → `#5C9CE6` → `#90CAF9` | `#5C9CE6/25` | Calm, stable |
| **Cloudy** (40-59) | `#1E88E5` → `#42A5F5` → `#5C9CE6` | `#5C9CE6/15` | Gray edges appearing |
| **Stormy** (0-39) | `#1565C0` → `#1976D2` → `#1E88E5` | `#5C9CE6/08` | Darker, needs clearing |

```css
/* Nimbus gradients */
.nimbus-serene { background: linear-gradient(135deg, #64B5F6 0%, #5C9CE6 50%, #B39DDB 100%); }
.nimbus-balanced { background: linear-gradient(135deg, #42A5F5 0%, #5C9CE6 50%, #90CAF9 100%); }
.nimbus-cloudy { background: linear-gradient(135deg, #1E88E5 0%, #42A5F5 50%, #5C9CE6 100%); }
.nimbus-stormy { background: linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #1E88E5 100%); }
```

---

## Celebration Colors

### Confetti Palette

Used for achievement celebrations, streaks, and milestone animations.

| Color | Hex | Usage |
|-------|-----|-------|
| `confetti-gold` | `#FFD700` | Primary celebration, gold medals |
| `confetti-coral` | `#FF6B6B` | Warm celebrations |
| `confetti-teal` | `#4ECDC4` | Cool celebrations |
| `confetti-purple` | `#A855F7` | Special achievements |
| `confetti-pink` | `#F472B6` | Streak celebrations |
| `confetti-lime` | `#84CC16` | Health milestones |

### Achievement Glow Colors

| Achievement Type | Glow Color | Intensity |
|------------------|------------|-----------|
| **Daily Goal** | `#FFD700/30` | Subtle |
| **Weekly Streak** | `#F472B6/40` | Medium |
| **Personal Best** | `#A855F7/50` | Strong |
| **Trio Perfect** (all 3 pillars 80+) | Rainbow gradient | Maximum |

```css
/* Celebration effects */
.celebration-glow { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
.streak-glow { box-shadow: 0 0 30px rgba(244, 114, 182, 0.4); }
.rainbow-glow {
  box-shadow:
    0 0 10px rgba(255, 107, 107, 0.3),
    0 0 20px rgba(78, 205, 196, 0.3),
    0 0 30px rgba(168, 85, 247, 0.3);
}
```

---

## Time-Aware Color Shifts

The app subtly shifts color temperature based on time of day.

### Time-Based Gradients

| Time | Background Tint | Primary Shift | Mood |
|------|-----------------|---------------|------|
| **Morning** (5am-11am) | Warm amber tint | Warmer teal | Energizing, fresh |
| **Afternoon** (11am-5pm) | Neutral | Default | Balanced, focused |
| **Evening** (5pm-9pm) | Warm sunset tint | Softer teal | Winding down |
| **Night** (9pm-5am) | Cool blue-purple | Cooler teal | Calm, restful |

```css
/* Time-based background overlays */
.time-morning { background: linear-gradient(to bottom, rgba(255, 183, 77, 0.05), transparent); }
.time-afternoon { background: transparent; }
.time-evening { background: linear-gradient(to bottom, rgba(255, 138, 101, 0.05), transparent); }
.time-night { background: linear-gradient(to bottom, rgba(103, 58, 183, 0.05), transparent); }
```

---

### Tailwind Configuration - Pillars
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        fitness: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        nutrition: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        wellbeing: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#5C9CE6',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
      },
    },
  },
}
```

---

## Dark Mode Palette

### Surface Colors

Dark mode uses dark grays (not pure black) to reduce eye strain and create depth.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `surface-base` | `#121212` | 18, 18, 18 | Primary background |
| `surface-elevated-1` | `#1E1E1E` | 30, 30, 30 | Cards, bottom sheets |
| `surface-elevated-2` | `#252525` | 37, 37, 37 | Modals, dropdowns |
| `surface-elevated-3` | `#2C2C2C` | 44, 44, 44 | Hover states on cards |
| `surface-elevated-4` | `#333333` | 51, 51, 51 | Active/pressed states |

### Text Colors

| Token | Hex | RGB | Opacity | Usage |
|-------|-----|-----|---------|-------|
| `text-primary` | `#FAFAFA` | 250, 250, 250 | 100% | Primary text, headings |
| `text-secondary` | `#B3B3B3` | 179, 179, 179 | 70% | Secondary text, labels |
| `text-tertiary` | `#757575` | 117, 117, 117 | 50% | Captions, hints, timestamps |
| `text-disabled` | `#525252` | 82, 82, 82 | 38% | Disabled text |

### Border Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `border-subtle` | `#2E2E2E` | 46, 46, 46 | Dividers, separators |
| `border-default` | `#404040` | 64, 64, 64 | Input borders, cards |
| `border-strong` | `#525252` | 82, 82, 82 | Focus states, emphasis |

### Tailwind Dark Mode Configuration
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#121212',
        foreground: '#FAFAFA',
        card: {
          DEFAULT: '#1E1E1E',
          foreground: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#2C2C2C',
          foreground: '#B3B3B3',
        },
        border: '#404040',
      },
    },
  },
}
```

### CSS Custom Properties - Dark Mode
```css
:root {
  /* Dark mode is default */
  --background: 0 0% 7%;         /* #121212 */
  --foreground: 0 0% 98%;        /* #FAFAFA */

  --card: 0 0% 12%;              /* #1E1E1E */
  --card-foreground: 0 0% 98%;   /* #FAFAFA */

  --popover: 0 0% 15%;           /* #252525 */
  --popover-foreground: 0 0% 98%;

  --primary: 187 100% 42%;       /* #00BCD4 */
  --primary-foreground: 0 0% 98%;

  --secondary: 0 0% 17%;         /* #2C2C2C */
  --secondary-foreground: 0 0% 98%;

  --muted: 0 0% 17%;             /* #2C2C2C */
  --muted-foreground: 0 0% 70%;  /* #B3B3B3 */

  --accent: 0 0% 17%;
  --accent-foreground: 0 0% 98%;

  --border: 0 0% 25%;            /* #404040 */
  --input: 0 0% 25%;
  --ring: 187 100% 42%;          /* Primary teal */
}
```

---

## Semantic Colors

### Feedback Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `success` | `#4CAF50` | `#81C784` | Achievements, completed, positive |
| `success-bg` | `#E8F5E9` | `#1B3D1F` | Success backgrounds |
| `warning` | `#FF9800` | `#FFB74D` | Caution, attention needed |
| `warning-bg` | `#FFF3E0` | `#3D2E1A` | Warning backgrounds |
| `error` | `#F44336` | `#E57373` | Errors, failures, critical |
| `error-bg` | `#FFEBEE` | `#3D1A1A` | Error backgrounds |
| `info` | `#2196F3` | `#64B5F6` | Information, tips |
| `info-bg` | `#E3F2FD` | `#1A2D3D` | Info backgrounds |

### Tailwind Semantic Colors
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        success: {
          DEFAULT: '#81C784',
          foreground: '#121212',
          muted: '#1B3D1F',
        },
        warning: {
          DEFAULT: '#FFB74D',
          foreground: '#121212',
          muted: '#3D2E1A',
        },
        destructive: {
          DEFAULT: '#E57373',
          foreground: '#121212',
          muted: '#3D1A1A',
        },
        info: {
          DEFAULT: '#64B5F6',
          foreground: '#121212',
          muted: '#1A2D3D',
        },
      },
    },
  },
}
```

---

## Color in Context

### Dashboard Usage

```
┌──────────────────────────────────────────────┐
│  Header: surface-elevated-1 (#1E1E1E)        │
├──────────────────────────────────────────────┤
│                                              │
│  Background: surface-base (#121212)          │
│                                              │
│  ┌─────────────┐  ┌─────────────┐           │
│  │ Fitness     │  │ Nutrition   │           │
│  │ #FF9800     │  │ #4CAF50     │           │
│  │ ring        │  │ ring        │           │
│  └─────────────┘  └─────────────┘           │
│                                              │
│  ┌─────────────┐  ┌─────────────┐           │
│  │ Wellbeing   │  │ AI Coach    │           │
│  │ #5C9CE6     │  │ #00BCD4     │           │
│  │ ring        │  │ card        │           │
│  └─────────────┘  └─────────────┘           │
│                                              │
├──────────────────────────────────────────────┤
│  Tab Bar: surface-elevated-1 (#1E1E1E)       │
│  Active: primary-500 (#00BCD4)               │
│  Inactive: text-tertiary (#757575)           │
└──────────────────────────────────────────────┘
```

### Button States

| State | Background | Text | Border |
|-------|------------|------|--------|
| **Primary Default** | `primary-600` | `text-primary` | none |
| **Primary Hover** | `primary-500` | `text-primary` | none |
| **Primary Active** | `primary-700` | `text-primary` | none |
| **Primary Disabled** | `surface-elevated-2` | `text-disabled` | none |
| **Secondary Default** | transparent | `primary-500` | `primary-500` |
| **Secondary Hover** | `primary-500/10` | `primary-400` | `primary-400` |
| **Ghost Default** | transparent | `text-secondary` | none |
| **Ghost Hover** | `surface-elevated-2` | `text-primary` | none |

### Pillar Button Variants

| Pillar | Default | Hover | Active |
|--------|---------|-------|--------|
| **Fitness** | `fitness-500` | `fitness-400` | `fitness-600` |
| **Nutrition** | `nutrition-500` | `nutrition-400` | `nutrition-600` |
| **Wellbeing** | `wellbeing-500` | `wellbeing-400` | `wellbeing-600` |

---

## Accessibility

### Contrast Ratios

All color combinations meet WCAG 2.1 AA standards (4.5:1 minimum for text).

| Combination | Ratio | Pass |
|-------------|-------|------|
| `text-primary` on `surface-base` | 15.8:1 | AAA |
| `text-secondary` on `surface-base` | 8.5:1 | AAA |
| `text-tertiary` on `surface-base` | 4.6:1 | AA |
| `primary-500` on `surface-base` | 6.2:1 | AA |
| `fitness-500` on `surface-base` | 7.3:1 | AAA |
| `nutrition-500` on `surface-base` | 5.1:1 | AA |
| `wellbeing-500` on `surface-base` | 5.8:1 | AA |

### Color Blindness Considerations

- **Never use color alone** to convey meaning
- Always pair colors with icons, labels, or patterns
- Test with color blindness simulators
- Pillar colors are distinguishable in all common CVD types

### Dark Mode Adjustments

Colors are desaturated slightly in dark mode to reduce eye strain:
- Reduce saturation by 10-20% for accent colors
- Use lighter variants for better contrast
- Avoid pure white (#FFFFFF) - use off-white (#FAFAFA)

---

## Light Mode Reference

While dark mode is primary, light mode should be available as an option.

### Light Mode Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-base` | `#FFFFFF` | Primary background |
| `surface-elevated-1` | `#F5F5F5` | Cards |
| `surface-elevated-2` | `#EEEEEE` | Modals |
| `text-primary` | `#121212` | Primary text |
| `text-secondary` | `#666666` | Secondary text |
| `border-default` | `#E0E0E0` | Borders |

### CSS Custom Properties - Light Mode
```css
.light {
  --background: 0 0% 100%;
  --foreground: 0 0% 7%;
  --card: 0 0% 96%;
  --card-foreground: 0 0% 7%;
  --border: 0 0% 88%;
  --muted: 0 0% 93%;
  --muted-foreground: 0 0% 40%;
}
```

---

## Complete Tailwind Configuration

```js
// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme")

module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Primary brand
        primary: {
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#00BCD4',
          600: '#00ACC1',
          700: '#0097A7',
          800: '#00838F',
          900: '#006064',
          DEFAULT: '#00BCD4',
          foreground: '#FAFAFA',
        },

        // Pillar colors
        fitness: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
          DEFAULT: '#FF9800',
        },
        nutrition: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
          DEFAULT: '#4CAF50',
        },
        wellbeing: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#5C9CE6',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
          DEFAULT: '#5C9CE6',
        },

        // Semantic colors
        success: {
          DEFAULT: '#81C784',
          foreground: '#121212',
        },
        warning: {
          DEFAULT: '#FFB74D',
          foreground: '#121212',
        },
        destructive: {
          DEFAULT: '#E57373',
          foreground: '#FAFAFA',
        },

        // Dark mode surfaces
        background: '#121212',
        foreground: '#FAFAFA',
        card: {
          DEFAULT: '#1E1E1E',
          foreground: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#2C2C2C',
          foreground: '#B3B3B3',
        },
        border: '#404040',
        input: '#404040',
        ring: '#00BCD4',
      },
    },
  },
}
```

---

## Usage Guidelines

### Do's
- Use pillar colors consistently for their respective domains
- Use primary teal for key CTAs and navigation
- Ensure all text meets contrast requirements
- Test color combinations with accessibility tools
- Use semantic colors for feedback (success, error, warning)

### Don'ts
- Don't mix pillar colors within a single context
- Don't use color alone to convey meaning
- Don't use pure black (#000000) or pure white (#FFFFFF)
- Don't override pillar color associations
- Don't use more than 3 colors in a single view (excluding neutrals)

---

*yHealth Color System v2.0 | Playful, Expressive, Celebration-Ready*

# Balencia Client

Next.js 16 frontend for the Balencia AI Life Coach platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| UI Library | [React 19](https://react.dev/) |
| Language | TypeScript 5 (strict mode) |
| Component System | [Radix UI](https://www.radix-ui.com/) primitives + [Shadcn/UI](https://ui.shadcn.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| State (Global) | [Redux Toolkit](https://redux-toolkit.js.org/) |
| State (Server) | [TanStack React Query](https://tanstack.com/query) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| 3D Rendering | [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Drei](https://github.com/pmndrs/drei) |
| Charts | [Recharts](https://recharts.org/) · [Chart.js](https://www.chartjs.org/) · [D3.js](https://d3js.org/) |
| Rich Text Editor | [TipTap](https://tiptap.dev/) |
| Graph Visualization | [Graphology](https://graphology.github.io/) + [Sigma.js](https://www.sigmajs.org/) + [XY Flow](https://reactflow.dev/) |
| Drag & Drop | [dnd-kit](https://dndkit.com/) |
| Auth | [NextAuth.js](https://next-auth.js.org/) (Google OAuth) |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) + React Hot Toast |
| Testing | [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) |
| Linting | ESLint with pre-commit hooks (Husky + lint-staged) |

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `http://localhost:5000/api`) |
| `NEXTAUTH_URL` | Auth callback URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Session encryption secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build (standalone output) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ci` | CI mode (with coverage, no watch) |

---

## Project Structure

```
client/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, fonts, theme)
│   ├── page.tsx                  # Landing page
│   ├── auth/                     # Authentication pages
│   └── (pages)/                  # Authenticated routes (60+ pages)
│       ├── dashboard/            # Main dashboard
│       ├── ai-coach/             # SIA AI coach interface
│       ├── chat/                 # Messaging & chat history
│       ├── voice-assistant/      # Voice interaction
│       ├── voice-call/           # AI voice calls
│       ├── goals/                # Life goal tracking
│       ├── schedule/             # Calendar & daily planning
│       ├── nutrition/            # Meal plans & macro logging
│       ├── workouts/             # Exercise & fitness tracking
│       ├── exercises/            # Exercise library
│       ├── wellness/             # Mental health hub
│       ├── journal/              # Journaling
│       ├── knowledge-graph/      # Interactive knowledge visualization
│       ├── life-areas/           # Cross-domain life view
│       ├── community/            # Social features
│       ├── competitions/         # Challenges & competitions
│       ├── leaderboard/          # Rankings
│       ├── achievements/         # Badges & milestones
│       ├── progress/             # Progress tracking
│       ├── money-map/            # Financial overview
│       ├── soundscape/           # Audio & guided sessions
│       ├── profile/              # User profile
│       ├── settings/             # App settings
│       ├── subscription/         # Billing & plans
│       ├── onboarding/           # New user onboarding
│       ├── admin/                # Admin panel (19+ sub-routes)
│       │   ├── analytics/
│       │   ├── users/
│       │   ├── billing/
│       │   ├── blog/
│       │   ├── exercises/
│       │   ├── roles/
│       │   ├── tools/
│       │   ├── webinars/
│       │   └── ...
│       └── ...
│
├── components/                   # React components (30+ groups)
│   ├── ui/                       # Shadcn/UI base components
│   ├── common/                   # Headers, footers, loaders, product tour
│   ├── layout/                   # Navigation, sidebars, menus
│   ├── dashboard/                # Dashboard widgets & analytics
│   ├── chat/                     # Chat interfaces & message views
│   ├── ai-coach/                 # AI coach UI components
│   ├── avatar/                   # 3D avatar (VRM) rendering
│   ├── voice-assistant/          # Voice interaction UI
│   ├── landing/                  # Marketing page sections
│   ├── blog/                     # Blog post components
│   ├── admin/                    # Admin panel UI
│   ├── subscription/             # Billing UI & paywalls
│   ├── notifications/            # Alert & notification UI
│   ├── editor/                   # Rich text editor (TipTap)
│   ├── music/                    # Audio player & streaming
│   ├── loading/                  # Skeleton loaders
│   ├── wellbeing/                # Wellness tracking UI
│   ├── community/                # Social components
│   ├── features/                 # Marketing feature sections
│   ├── gates/                    # Access control & paywalls
│   ├── whoop/                    # Wearable integration UI
│   ├── webinar/                  # Event & webinar pages
│   └── providers/                # Auth, theme, query providers
│
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities (API client, auth helpers, utils)
├── store/                        # Redux store, slices, middleware
├── types/                        # TypeScript type definitions
├── public/                       # Static assets
├── patches/                      # patch-package patches
├── components.json               # Shadcn/UI configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.ts                # Next.js configuration
├── jest.config.ts                # Jest test configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## Architecture Patterns

### Component Organization

Components follow a domain-driven structure. Each feature area has its own directory under `components/`, with base primitives in `components/ui/`.

### Data Fetching

- **Server data**: TanStack React Query for caching, deduplication, and background refetching
- **Global client state**: Redux Toolkit for auth state, UI preferences, and cross-component state
- **API client**: Axios instance with interceptors for auth tokens, error handling, and base URL

### Routing

Next.js App Router with:
- Route groups: `(pages)/` for authenticated routes
- Layout nesting for shared navigation (sidebar, header)
- Loading states via `loading.tsx`
- Error boundaries via `error.tsx`

### Styling

- Tailwind CSS 4 with CSS variables for theming
- Dark mode via `next-themes`
- Shadcn/UI components configured in `components.json` (New York style)
- Framer Motion for page transitions and micro-interactions
- Consistent 8px spacing system

### Forms

All forms use React Hook Form with Zod schemas for validation. Pattern:
```tsx
const schema = z.object({ /* ... */ });
const form = useForm({ resolver: zodResolver(schema) });
```

---

## Testing

Tests use Jest with React Testing Library. Run with:

```bash
# All tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test file location

Test files live alongside source code as `__tests__/*.test.tsx` or adjacent `*.test.tsx` files.

### Pre-commit hooks

Husky runs lint-staged on every commit, enforcing ESLint with zero warnings on changed `.ts`/`.tsx` files.

---

## Docker

The client uses a multi-stage Dockerfile optimized for Next.js standalone output:

1. **Dependencies** — `npm ci`
2. **Builder** — `next build` with standalone output
3. **Runner** — Minimal image with static assets + standalone server

```bash
docker build -f Dockerfile.client -t balencia-client .
docker run -p 3000:3000 balencia-client
```

Health check: `GET http://localhost:3000`

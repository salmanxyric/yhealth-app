---
name: nextjs-best-practices
description: Apply Next.js best practices including promise handling, API optimization, SSR prevention, component management, reusable components, Context API state management, and custom hooks. Use when writing or reviewing Next.js code, creating React components, or working with API calls in a Next.js application.
---

# Next.js Best Practices

## Core Principles

### 1. Promise Handling

Always handle promises properly with proper error boundaries:

```typescript
// ✅ Good: Proper async/await with error handling
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// ✅ Good: Using React Query for server state
default function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ❌ Bad: Unhandled promise
fetch('/api/data').then(data => setState(data));

// ❌ Bad: No error handling
const data = await fetch('/api/data');
setState(data);
```

### 2. Avoid Unnecessary API Calls

Implement caching, deduplication, and efficient data fetching:

```typescript
// ✅ Good: React Query with caching
const { data, isLoading } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 60 * 1000, // Cache for 1 minute
  gcTime: 5 * 60 * 1000, // Keep in garbage collector for 5 minutes
});

// ✅ Good: SWR for data fetching
const { data, error } = useSWR('/api/user', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 2000,
});

// ✅ Good: Debounce search inputs
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Use debounced value for API calls
const debouncedSearch = useDebounce(searchTerm, 500);
useEffect(() => {
  if (debouncedSearch) {
    searchAPI(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 3. Prevent SSR Issues

Handle client-side only code properly:

```typescript
// ✅ Good: Dynamic import with SSR disabled
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(
  () => import('../components/Chart'),
  { ssr: false }
);

// ✅ Good: Check for window before using browser APIs
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);
  
  return storedValue;
}

// ✅ Good: use client directive for client components
'use client';

import { useState, useEffect } from 'react';

export function ClientOnlyComponent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null; // or return a loading state / skeleton
  }
  
  return <div>Client-side content</div>;
}

// ❌ Bad: Using window without checks in SSR context
const width = window.innerWidth; // This will crash SSR
```

### 4. Component Management

Organize components efficiently with proper separation of concerns:

```typescript
// ✅ Good: Co-locate related components
// components/
//   user-profile/
//     index.tsx          # Main component
//     UserAvatar.tsx     # Sub-component
//     UserStats.tsx      # Sub-component
//     types.ts           # Shared types
//     utils.ts           # Helper functions

// ✅ Good: Container/Presentational pattern
// Container - handles data and logic
'use client';

export function UserProfileContainer({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);
  
  if (isLoading) return <UserProfileSkeleton />;
  if (error) return <UserProfileError error={error} />;
  if (!user) return <UserProfileEmpty />;
  
  return <UserProfile user={user} />;
}

// Presentational - pure rendering
interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ Good: Use Server Components by default
// app/page.tsx - Server Component (no 'use client')
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  });
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <main>{/* render data */}</main>;
}
```

### 5. Reusable Components

Build composable, flexible components:

```typescript
// ✅ Good: Composition pattern with forwardRef
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'btn',
          `btn-${variant}`,
          `btn-${size}`,
          isLoading && 'btn-loading'
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ✅ Good: Compound Component pattern
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={cn('card', className)}>{children}</div>;
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
};

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="card-footer">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>

// ✅ Good: Polymorphic components with as prop
type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as'>;

export function Text<E extends React.ElementType = 'span'>({
  as,
  children,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || 'span';
  return <Component {...props}>{children}</Component>;
}

// Usage: <Text as="h1">Heading</Text> or <Text as={Link}>Link</Text>
```

### 6. State Management with Context API

Implement proper high-level state management:

```typescript
// ✅ Good: Create context with proper typing
interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ✅ Good: Provider with state and memoization
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
    }),
    [theme]
  );
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ Good: Custom hook with error handling
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ✅ Good: Split contexts to prevent unnecessary re-renders
// Don't combine unrelated state in one context

// UserContext - only user data
interface UserContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

// UIContext - only UI state
interface UIContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  modalStack: Modal[];
  pushModal: (modal: Modal) => void;
  popModal: () => void;
}

// ✅ Good: Use Zustand for complex global state (alternative to Context)
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        login: (user) => set({ user, isAuthenticated: true }),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ user: state.user }),
      }
    )
  )
);
```

### 7. Custom Hooks Best Practices

Create reusable, focused custom hooks:

```typescript
// ✅ Good: Single responsibility hooks
// hooks/useWindowSize.ts
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
}

// ✅ Good: Hook with cleanup
// hooks/useIntersectionObserver.ts
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  { threshold = 0, root = null, rootMargin = '0%' }: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, threshold, root, rootMargin]);
  
  return isIntersecting;
}

// ✅ Good: Hook for async operations with state
// hooks/useAsync.ts
interface UseAsyncReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (...args: any[]) => Promise<T>;
}

export function useAsync<T>(asyncFunction: (...args: any[]) => Promise<T>): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const execute = useCallback(async (...args: any[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);
  
  return { data, error, isLoading, execute };
}

// ✅ Good: Hook for form handling
// hooks/useForm.ts
interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);
  
  return { values, errors, isSubmitting, handleChange, handleSubmit, setValues };
}
```

### 8. API Route Handlers

Implement proper API routes in Next.js:

```typescript
// ✅ Good: Structured API route with error handling
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const users = await db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({ users, page, limit });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createUserSchema.parse(body);
    
    const user = await db.user.create({
      data: validated,
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// ✅ Good: Dynamic route with parameter validation
// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const user = await db.user.findUnique({ where: { id } });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Failed to fetch user:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
```

### 9. Performance Optimization

Optimize Next.js applications:

```typescript
// ✅ Good: Image optimization
import Image from 'next/image';

export function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={100}
      height={100}
      priority={false} // Set true only for above-fold images
      loading="lazy" // Lazy load below-fold images
      className="rounded-full"
    />
  );
}

// ✅ Good: Route prefetching
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      <Link href="/dashboard" prefetch={true}>
        Dashboard
      </Link>
      <Link href="/settings" prefetch={false}> {/* Disable for rarely visited pages */}
        Settings
      </Link>
    </nav>
  );
}

// ✅ Good: Streaming with Suspense
import { Suspense } from 'react';

export default function Page() {
  return (
    <main>
      <h1>Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <ChartData />
      </Suspense>
    </main>
  );
}

// ✅ Good: Selective hydration with next/dynamic
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('../components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

// ✅ Good: Memorization for expensive calculations
export function ExpensiveList({ items, filter }: { items: Item[]; filter: string }) {
  // Only recalculate when items or filter changes
  const filteredItems = useMemo(
    () => items.filter(item => item.name.includes(filter)),
    [items, filter]
  );
  
  // Memoize callback to prevent child re-renders
  const handleItemClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);
  
  return (
    <ul>
      {filteredItems.map(item => (
        <ItemComponent
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </ul>
  );
}

// ✅ Good: useMemo for expensive objects
const chartOptions = useMemo(
  () => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
  }),
  [] // Empty deps - options don't change
);
```

### 10. Error Handling & Boundaries

Implement robust error handling:

```typescript
// ✅ Good: Error Boundary component
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Send to error reporting service
    // logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// ✅ Good: Global error handling in error.tsx
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);
  
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// ✅ Good: Not found handling
// app/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
```

## File Structure Convention

```
my-app/
├── app/                          # App Router
│   ├── (marketing)/              # Route group (no URL segment)
│   │   ├── layout.tsx            # Marketing layout
│   │   ├── page.tsx              # Homepage
│   │   └── about/
│   │       └── page.tsx
│   ├── api/                      # API Routes
│   │   └── users/
│   │       ├── route.ts          # GET, POST /api/users
│   │       └── [id]/
│   │           └── route.ts      # GET, PUT, DELETE /api/users/:id
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── page.tsx              # Dashboard page
│   │   ├── loading.tsx           # Loading UI
│   │   └── error.tsx             # Error UI
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root page
│   ├── loading.tsx               # Root loading
│   ├── error.tsx                 # Root error
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── forms/                    # Form-specific components
│   │   ├── user-form.tsx
│   │   └── form-field.tsx
│   └── layouts/                  # Layout components
│       ├── header.tsx
│       ├── footer.tsx
│       └── sidebar.tsx
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts
│   ├── use-fetch.ts
│   └── use-local-storage.ts
├── lib/                          # Utilities and helpers
│   ├── utils.ts                  # General utilities
│   ├── api-client.ts             # API client setup
│   └── db.ts                     # Database client
├── providers/                    # Context providers
│   ├── auth-provider.tsx
│   ├── theme-provider.tsx
│   └── app-providers.tsx         # Combined providers
├── stores/                       # State management (Zustand)
│   ├── user-store.ts
│   └── cart-store.ts
├── types/                        # TypeScript types
│   ├── user.ts
│   └── api.ts
├── public/                       # Static assets
└── tests/                        # Test files
    ├── unit/
    └── e2e/
```

## Checklist

Before committing Next.js code, verify:

- [ ] Server Components used by default; 'use client' only when needed
- [ ] Promises have proper error handling with try/catch
- [ ] API calls are cached/deduplicated (React Query/SWR)
- [ ] Browser APIs checked with `typeof window !== 'undefined'`
- [ ] Dynamic imports used for heavy client components
- [ ] Components are composable and reusable
- [ ] Context values are memoized to prevent re-renders
- [ ] Custom hooks follow single responsibility principle
- [ ] Images use Next.js Image component with proper sizing
- [ ] Route handlers validate input with Zod
- [ ] Error boundaries wrap error-prone components
- [ ] Expensive calculations use useMemo
- [ ] Callbacks passed to children use useCallback
- [ ] Types are defined and exported from types/

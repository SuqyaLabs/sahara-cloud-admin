---
trigger: always_on
---

# Next.js Super Power UI/UX Rules

## Core Principles

### Design Philosophy
- **Mobile-first approach**: Always design for mobile screens first, then scale up
- **Accessibility (a11y)**: WCAG 2.1 AA compliance minimum - semantic HTML, ARIA labels, keyboard navigation
- **Performance-first**: Target Core Web Vitals - LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Progressive enhancement**: Core functionality works without JavaScript

---

## Tech Stack Requirements

### UI Framework
- **React 18+** with Server Components by default
- **Next.js 15+** with App Router
- **TypeScript** - strict mode enabled, no `any` types

### Styling
- **Tailwind CSS** as primary styling solution
- **CSS Variables** for theming and dynamic values
- **Framer Motion** for animations and micro-interactions
- **clsx/cn** utility for conditional classes

### Component Libraries
- **shadcn/ui** - copy-paste components, fully customizable
- **Radix UI** - accessible primitives when needed
- **Lucide React** - consistent icon system

---

## Component Architecture

### File Structure
```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                 # Reusable UI primitives (Button, Input, Card)
│   ├── features/           # Feature-specific components
│   └── layouts/            # Layout components (Header, Footer, Sidebar)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── styles/                 # Global styles and Tailwind config
└── types/                  # TypeScript type definitions
```

### Component Guidelines
1. **Single Responsibility**: One component = one purpose
2. **Composition over inheritance**: Build complex UIs from simple pieces
3. **Props interface first**: Define TypeScript interface before implementation
4. **Default to Server Components**: Use `'use client'` only when necessary

### Component Template
```tsx
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  // ... specific props
}

export function Component({ children, className, ...props }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {children}
    </div>
  );
}
```

---

## UI/UX Patterns

### Visual Hierarchy
- **Typography scale**: Use consistent heading sizes (text-4xl, text-2xl, text-xl, text-lg, text-base)
- **Spacing system**: Use Tailwind spacing scale consistently (4, 8, 12, 16, 24, 32, 48, 64)
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text

### Micro-interactions
- **Hover states**: Subtle scale (1.02-1.05) or color transitions
- **Button feedback**: Visual press state, loading spinners
- **Form validation**: Real-time inline validation with helpful messages
- **Transitions**: 150-300ms duration, ease-out for enters, ease-in for exits

### Animation Principles
```tsx
// Standard animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } }
};
```

### Loading States
- **Skeleton loaders**: Match content layout, subtle pulse animation
- **Progressive loading**: Show content as it becomes available
- **Optimistic updates**: Update UI immediately, rollback on error

---

## Responsive Design

### Breakpoints
```
sm: 640px   - Mobile landscape
md: 768px   - Tablets
lg: 1024px  - Desktop
xl: 1280px  - Large desktop
2xl: 1536px - Ultra-wide
```

### Responsive Patterns
- **Fluid typography**: `clamp()` for scalable text sizes
- **Container queries**: Component-level responsiveness when appropriate
- **Responsive images**: Next.js Image with proper sizes prop
- **Touch targets**: Minimum 44x44px on mobile

---

## Performance Optimization

### Image Handling
```tsx
import Image from 'next/image';

// Always use Next.js Image component
<Image
  src="/hero.jpg"
  alt="Descriptive alt text"
  width={1200}
  height={600}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={blurHash}
/>
```

### Code Splitting
- **Dynamic imports** for heavy components
- **Route-based splitting** (automatic with App Router)
- **Lazy load below-fold content**

### Caching Strategy
- Use `generateStaticParams` for static pages
- Implement proper `revalidate` values
- Leverage React cache() for data fetching

---

## Accessibility Checklist

### Every Component Must Have
- [ ] Semantic HTML elements
- [ ] Proper heading hierarchy
- [ ] Focus visible states
- [ ] Keyboard navigation support
- [ ] Screen reader announcements for dynamic content
- [ ] Color-independent information (not just color to convey meaning)
- [ ] Alt text for images
- [ ] Labels for form inputs

### Testing
- Test with keyboard only
- Test with screen reader (VoiceOver/NVDA)
- Run Lighthouse accessibility audit
- Use axe DevTools extension

---

## Dark Mode Implementation

### Theme System
```tsx
// Use CSS variables for theming
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
}
```

### Implementation
- Use `next-themes` for theme switching
- Respect system preference by default
- Persist user preference in localStorage
- Prevent flash of wrong theme (use blocking script)

---

## Form Design

### Best Practices
- **Labels above inputs**: Never use placeholder as label
- **Inline validation**: Validate on blur, show errors immediately
- **Error recovery**: Clear error on input change
- **Submit feedback**: Disable button, show loading state
- **Success confirmation**: Clear feedback after submission

### Form Component Pattern
```tsx
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        aria-describedby="email-error"
        aria-invalid={!!errors.email}
      />
      {errors.email && (
        <p id="email-error" className="text-sm text-destructive mt-1">
          {errors.email}
        </p>
      )}
    </div>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? <Spinner /> : 'Submit'}
    </Button>
  </div>
</form>
```

---

## Error Handling

### Error Boundaries
- Implement error.tsx for route-level errors
- Create reusable ErrorFallback component
- Log errors to monitoring service
- Provide clear recovery actions

### User-Friendly Errors
- Never show technical error messages
- Provide actionable next steps
- Maintain consistent visual language
- Include retry/back options

---

## SEO & Metadata

### Required for Every Page
```tsx
export const metadata: Metadata = {
  title: 'Page Title | Site Name',
  description: 'Compelling 150-160 char description',
  openGraph: {
    title: 'Page Title',
    description: 'Description for social sharing',
    images: ['/og-image.jpg'],
  },
};
```

### Structured Data
- Implement JSON-LD for rich snippets
- Use appropriate schema.org types
- Test with Google Rich Results Test

---

## Code Quality Standards

### Naming Conventions
- **Components**: PascalCase (Button, UserProfile)
- **Files**: kebab-case (user-profile.tsx)
- **Hooks**: camelCase with use prefix (useAuth)
- **Constants**: SCREAMING_SNAKE_CASE
- **CSS classes**: Follow Tailwind conventions

### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Internal components
4. Internal utilities
5. Types
6. Styles

### Code Comments
- Explain "why", not "what"
- Document complex business logic
- Add TODO with ticket reference
- Use JSDoc for public APIs

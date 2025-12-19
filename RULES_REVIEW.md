    # Next.js Project Rules - Atomic Review Analysis

## Current Project Context

**Tech Stack Detected:**
- Next.js 16.0.7 (App Router)
- React 19.2.0
- TypeScript (strict mode)
- Tailwind CSS 4
- Radix UI primitives
- shadcn/ui components
- Supabase (auth + database)
- Framer Motion
- Lucide React icons
- next-themes

---

## Atomic Reasoning Units

### ATOM 1: Framework Version Alignment
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules mention "Next.js 15+" but project uses Next.js 16.0.7 |
| **Independence** | ✅ This atom is self-contained - version detection is independent |
| **Correctness** | ⚠️ PARTIAL - Rules should specify Next.js 15+ with App Router (current) |
| **Action** | Update to reflect actual version and App Router requirement |

---

### ATOM 2: React Server Components (RSC) Usage
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules recommend "Minimize 'use client'" but project has heavy client-side hooks |
| **Independence** | ✅ RSC decision is independent of other atoms |
| **Correctness** | ⚠️ PARTIAL - Project requires client interactivity (forms, state) |
| **Observation** | 12 custom hooks exist, all requiring `'use client'` |
| **Action** | Clarify when client components are acceptable (forms, interactive UI) |

---

### ATOM 3: State Management Approach
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules suggest "Zustand, TanStack React Query" |
| **Independence** | ✅ State management choice is independent |
| **Correctness** | ❌ INCORRECT - Project uses custom hooks with useState, not Zustand/React Query |
| **Observation** | Current pattern: `use-*.ts` hooks with local state + Supabase client |
| **Action** | Update rules to reflect actual pattern OR recommend migration |

---

### ATOM 4: Data Fetching Pattern
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules don't specify Supabase integration patterns |
| **Independence** | ✅ Data fetching is a distinct concern |
| **Correctness** | ❌ MISSING - No guidance for Supabase client usage |
| **Observation** | Project has `lib/supabase/client.ts` and `lib/supabase/server.ts` |
| **Action** | Add Supabase-specific patterns for client/server data fetching |

---

### ATOM 5: Validation Strategy
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules recommend "Zod for schema validation" |
| **Independence** | ✅ Validation is independent |
| **Correctness** | ❌ INCORRECT - Zod is NOT in package.json |
| **Observation** | Project uses TypeScript interfaces for type safety |
| **Action** | Either add Zod or update rules to reflect TypeScript-only validation |

---

### ATOM 6: Internationalization (i18n)
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules have NO mention of i18n |
| **Independence** | ✅ i18n is a separate concern |
| **Correctness** | ❌ MISSING - Project has full i18n system |
| **Observation** | `lib/i18n/`, `useLanguage()`, RTL support, 3 languages (fr, ar, en) |
| **Action** | Add i18n guidelines (translation keys, RTL handling, language context) |

---

### ATOM 7: Multi-tenancy Pattern
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules have NO mention of multi-tenancy |
| **Independence** | ✅ Multi-tenancy is architectural concern |
| **Correctness** | ❌ MISSING - Project is multi-tenant (tenant_id on all tables) |
| **Observation** | `useTenant()` hook, tenant-scoped data |
| **Action** | Add multi-tenancy guidelines |

---

### ATOM 8: Component Library Usage
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules mention "shadcn/ui, Radix UI" |
| **Independence** | ✅ Component choice is independent |
| **Correctness** | ✅ CORRECT - Project uses both |
| **Observation** | 14 UI components in `components/ui/` |
| **Action** | Keep as-is, add specific component patterns |

---

### ATOM 9: Styling Approach
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules mention "Tailwind CSS" |
| **Independence** | ✅ Styling is independent |
| **Correctness** | ✅ CORRECT - Project uses Tailwind CSS 4 |
| **Observation** | `cn()` utility, class-variance-authority |
| **Action** | Add Tailwind CSS 4 specific patterns (CSS variables theme) |

---

### ATOM 10: Testing Infrastructure
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules mention "Jest and React Testing Library" |
| **Independence** | ✅ Testing is independent |
| **Correctness** | ❌ INCORRECT - No testing dependencies in package.json |
| **Observation** | No `jest`, `@testing-library/*` packages installed |
| **Action** | Either add testing or mark as aspirational |

---

### ATOM 11: Directory Structure
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules mention lowercase-dash naming |
| **Independence** | ✅ Directory naming is independent |
| **Correctness** | ✅ CORRECT - Project follows this (e.g., `components/ui/`) |
| **Action** | Keep as-is |

---

### ATOM 12: Error Handling Pattern
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules mention "early returns, guard clauses" |
| **Independence** | ✅ Error handling is independent |
| **Correctness** | ✅ CORRECT - Pattern is followed in hooks |
| **Action** | Add Supabase error handling specifics |

---

### ATOM 13: Image Optimization
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules mention "WebP, lazy loading, Next.js Image" |
| **Independence** | ✅ Image handling is independent |
| **Correctness** | ⚠️ PARTIAL - Project uses Supabase Storage for images |
| **Observation** | Product images stored in Supabase, not local |
| **Action** | Add remote image handling patterns |

---

### ATOM 14: Authentication Pattern
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules have NO mention of authentication |
| **Independence** | ✅ Auth is independent concern |
| **Correctness** | ❌ MISSING - Project uses Supabase Auth |
| **Observation** | `middleware.ts`, auth routes in `(auth)/` |
| **Action** | Add Supabase Auth patterns |

---

### ATOM 15: Dark Mode Implementation
| Component | Logical Statement |
|-----------|-------------------|
| **Statement** | Rules have NO specific dark mode guidance |
| **Independence** | ✅ Theming is independent |
| **Correctness** | ❌ MISSING - Project uses next-themes |
| **Observation** | `theme-provider.tsx`, `theme-toggle.tsx` |
| **Action** | Add dark mode patterns |

---

## Synthesis: Validation Summary

| Atom | Status | Action Required |
|------|--------|-----------------|
| 1. Framework Version | ⚠️ Partial | Minor update |
| 2. RSC Usage | ⚠️ Partial | Clarify exceptions |
| 3. State Management | ❌ Incorrect | Major update |
| 4. Data Fetching | ❌ Missing | Add section |
| 5. Validation | ❌ Incorrect | Update or add Zod |
| 6. i18n | ❌ Missing | Add section |
| 7. Multi-tenancy | ❌ Missing | Add section |
| 8. Component Library | ✅ Correct | Keep |
| 9. Styling | ✅ Correct | Minor enhancement |
| 10. Testing | ❌ Incorrect | Update |
| 11. Directory Structure | ✅ Correct | Keep |
| 12. Error Handling | ✅ Correct | Minor enhancement |
| 13. Image Optimization | ⚠️ Partial | Update for remote |
| 14. Authentication | ❌ Missing | Add section |
| 15. Dark Mode | ❌ Missing | Add section |

---

## Recommendations

### High Priority (Project-Specific)
1. Add Supabase integration patterns
2. Add i18n/RTL guidelines
3. Add multi-tenancy patterns
4. Add authentication patterns

### Medium Priority (Alignment)
5. Update state management to reflect actual patterns
6. Remove or defer Zod recommendation
7. Remove or defer testing recommendation

### Low Priority (Enhancements)
8. Add dark mode patterns
9. Add remote image handling
10. Enhance error handling with Supabase specifics

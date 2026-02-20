# Frontend - Claude.md

## Overview

This is a React 18 + TypeScript learning platform frontend with gamification features. It uses Vite for building, Redux Toolkit for client state, React Query for server state, and Tailwind CSS for styling.

## Tech Stack

- **Framework:** React 18.2.0
- **Language:** TypeScript 5.2.2 (strict mode)
- **Build Tool:** Vite 6.0.0
- **State Management:** Redux Toolkit 2.0.0 + Redux Persist
- **Data Fetching:** TanStack React Query 5.8.0
- **Routing:** React Router DOM 6.20.0
- **HTTP Client:** Axios 1.6.0
- **Styling:** Tailwind CSS 3.3.5
- **Testing:** Vitest 1.0.0, Playwright 1.40.0, @testing-library/react
- **Backend Services:** Firebase 12.2.1

## Directory Structure

```
src/
├── pages/                  # Page components (public/ and protected/)
├── components/             # Reusable components (common/, public/, protected/)
├── layouts/                # Layout components (AuthLayout, PublicLayout, MainLayout)
├── store/                  # Redux store and slices (auth, modules, quiz, coins, ui)
├── hooks/                  # Custom hooks, queries/, mutations/
├── services/               # API service layer (*API.ts files)
├── lib/                    # React Query client and query keys
├── types/                  # TypeScript type definitions
├── contexts/               # React Context (SidebarContext)
├── utils/                  # Utility functions (api.ts, authUtils.ts, etc.)
├── styles/                 # Global styles and typography constants
└── assets/                 # Static assets (images, fonts, downloadables)
```

## Key Patterns

### State Management
- **Redux** for client state: auth, UI preferences, module selections
- **React Query** for server state: API data fetching, caching, synchronization
- Redux slices: `authSlice`, `moduleSlice`, `quizSlice`, `coinSlice`, `uiSlice`
- Persisted slices: auth, modules, coins (quiz and ui are NOT persisted)

### API Layer
- Service files per domain: `authAPI.ts`, `learningAPI.ts`, `badgesAPI.ts`, etc.
- Axios instance configured in `utils/api.ts`
- Vite proxy: `/api` routes to `VITE_API_BASE_URL` in development
- Token-based auth with refresh token rotation

### Query Keys
- Use centralized query key factory in `lib/queryKeys.ts`
- Pattern: `queryKeys.domain.resource(id)`
- Enables precise cache invalidation

### Custom Hooks
- Follow naming: `use[Feature]` (e.g., `useAuth`, `useCoinSystem`, `useModules`)
- Query hooks in `hooks/queries/`
- Mutation hooks in `hooks/mutations/`

### Components
- Functional components with hooks only
- Protected routes wrapped with `ProtectedRoute` component
- Layout-based routing (AuthLayout, PublicLayout, MainLayout)

### Styling
- Tailwind CSS utility classes
- Global styles in `index.css` and `styles/`
- Typography presets in `styles/constants/typography.ts`
- Custom font: Onest

## Development Commands

```bash
yarn dev              # Start dev server (port 3000)
yarn build            # Production build
yarn build:staging    # Staging build
yarn preview          # Preview production build
yarn lint             # Run ESLint
yarn type-check       # TypeScript compilation check
yarn deploy:firebase  # Build and deploy to Firebase
```

## Important Files

- `App.tsx` - Main routing and layout structure
- `main.tsx` - Entry point with providers (Redux, React Query)
- `store/store.ts` - Redux store configuration with persistence
- `lib/queryClient.ts` - React Query client setup
- `utils/api.ts` - Axios instance and interceptors
- `vite.config.ts` - Vite build configuration and proxy setup

## Code Guidelines

1. **TypeScript:** Use strict types. Define types in `types/` directory.
2. **Components:** Use functional components with hooks. No class components.
3. **State:** Use React Query for server data, Redux for client-only state.
4. **API Calls:** Add new endpoints to appropriate service file in `services/`.
5. **Hooks:** Create custom hooks for reusable logic. Place in `hooks/`.
6. **Styling:** Use Tailwind utility classes. Avoid inline styles.
7. **Imports:** Use path alias `@/*` for imports from `src/`.
8. **Error Handling:** Handle API errors in service layer and display in UI.

## Authentication Flow

- Tokens stored in localStorage via Redux Persist
- Access token + refresh token pattern
- Auto-refresh on token expiration
- `ProtectedRoute` component guards authenticated pages
- Auth state managed in `authSlice`

## Gamification Features

- Coin-based rewards system with animations (`useCoinSystem`)
- Badge/achievement system
- Module unlock conditions
- House/neighborhood/map-based content organization

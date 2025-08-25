# 🎯 Nest Navigate Frontend

Video-based learning platform with gamification - Frontend Application

## Tech Stack

- **Framework**: React 18 + TypeScript 5.x
- **Build Tool**: Vite 6.0+
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Redux Toolkit + React Query
- **Package Manager**: Yarn 4.x
- **Deployment**: Firebase Hosting

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
# Opens http://localhost:3000

# Other commands
yarn build              # Production build
yarn build:staging      # Staging build  
yarn build:production   # Production build with prod env
yarn preview            # Preview build
yarn lint               # ESLint check
yarn type-check         # TypeScript check
```

## Deployment

### Firebase Hosting (Frontend)
```bash
# Build and deploy to Firebase
yarn deploy:firebase

# Or manually
yarn build
firebase deploy
```

### Environment Configuration

- **Development**: Uses `http://localhost:8000` for API
- **Staging**: Configure `VITE_API_BASE_URL` in `.env.staging`
- **Production**: Configure `VITE_API_BASE_URL` in `.env.production`

## Architecture

- **Frontend**: React SPA deployed to Firebase Hosting
- **Backend**: Python FastAPI deployed separately (Render/Railway/etc)
- **Database**: PostgreSQL (Amazon RDS)
- **Communication**: REST API with CORS enabled

## Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/        # Route components
├── hooks/        # Custom React hooks
├── store/        # Redux store & slices
├── types/        # TypeScript type definitions
├── utils/        # Helper functions (includes api.ts)
└── assets/       # Static assets
```

## API Integration

The frontend communicates with a separately deployed backend via REST API. Update the `VITE_API_BASE_URL` environment variable to point to your backend deployment.

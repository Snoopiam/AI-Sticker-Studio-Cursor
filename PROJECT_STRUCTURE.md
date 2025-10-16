# AI Sticker Studio - Project Structure Guide

This document provides a definitive guide to the directory structure and module import conventions for the AI Sticker Studio application. Adhering to this structure is essential for maintaining code quality, consistency, and preventing build errors.

## 1. Corrected Directory Structure

The project has been consolidated to use a single, primary location for all UI components. The redundant top-level `/components` directory has been identified as deprecated and should be removed. The official location for all React components is `/compliance/components/`.

```
.
├── compliance/
│   └── components/      -- ✅ PRIMARY LOCATION for ALL UI components
│
├── components/          -- ❌ DEPRECATED - This directory is redundant and should be deleted.
│
├── constants/           -- Application-wide constants, static data, and presets.
├── context/             -- React Context providers and consumers for state management.
├── hooks/               -- Custom React hooks containing all business logic.
├── reducers/            -- Reducer functions for managing state transitions.
├── types/               -- All TypeScript type definitions and interfaces.
├── utils/               -- Core utilities (API resilience, image processing, etc.).
│   └── services/        -- Direct interaction with external services (Gemini API, IndexedDB).
│
├── App.tsx              -- The root React component.
├── index.tsx            -- The application's main entry point.
└── ...                  -- Other configuration and documentation files.
```

## 2. Directory Roles & Responsibilities

-   **/compliance/components/:** The single source of truth for all UI components. Any new component must be created here. `App.tsx` directly imports its main child components from this directory.

-   **/constants/:** Contains all static, non-executable data. This includes UI dropdown options (`expressions.ts`), style definitions (`wallpaperPresets.ts`), system-level configuration (`system.ts`), and creative content (`promptIdeas.ts`).

-   **/context/:** Manages the React Context API setup. `AppContext.tsx` defines the global state provider and custom hooks for consuming state (`useAppContext`) and accessing cached data (`useCachedImage`).

-   **/hooks/:** The "brain" of the application. All business logic, user-initiated actions, and workflows are encapsulated in custom hooks here (e.g., `useGeneration`, `useCalibration`). Components should be "dumb" and call functions from these hooks.

-   **/reducers/:** Contains pure functions that manage state transitions. Each reducer is responsible for a specific slice of the application state (e.g., `settingsReducer`, `uiReducer`). `rootReducer.ts` composes them together.

-   **/types/:** The central hub for all TypeScript interfaces and type definitions. `types/types.ts` is the single source of truth for the application's data structures.

-   **/utils/services/:** The lowest level of the application, responsible for direct interaction with external APIs and services. `geminiService.ts` contains all Gemini API calls, and `imageCache.ts` manages IndexedDB storage.

-   **/utils/:** Contains higher-level utilities that support the services and hooks, such as the API resilience suite (circuit breaker, rate limiter) and image processing functions.

## 3. Module Import Rules

-   **From `compliance/components/`:** When a component inside this directory needs to import a module from a top-level directory (like `hooks`, `types`, `constants`, `context`, `utils`), it **MUST** use a `../../` relative path.
    -   **Correct:** `import { useAppContext } from '../../context/AppContext';`
    -   **Incorrect:** `import { useAppContext } from '../context/AppContext';`

-   **From other top-level directories (e.g., `hooks`, `reducers`):** Use a `../` relative path to access other top-level directories.
    -   **Correct (from a hook):** `import { AppContext } from '../context/AppContext';`

-   **Local Imports:** When importing a module within the same directory, use a `./` relative path.
    -   **Correct (in `ControlPanel.tsx`):** `import { StickerStudioWorkflow } from './StickerStudioWorkflow';`
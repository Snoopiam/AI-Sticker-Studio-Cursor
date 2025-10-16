***

### ## The Unified AI Assistant Instructions

To resolve these issues, here is a new, single, and definitive `instructions.md` file. It merges the best elements of all provided documents, corrects all inconsistencies, and integrates the mandatory compliance workflow into a clear, step-by-step guide.

---

# The Unified AI Assistant Instructions

This document is the **single source of truth** for all AI assistants operating on the AI Sticker Studio repository. It outlines the mandatory principles, workflows, and architectural patterns. Adherence to these guidelines is non-negotiable.

## 1. The Core Workflow: From Request to Implementation

You must follow this precise, step-by-step process for every requested change.

### Step 1: Mandatory Reading (Every Time)
Before taking any action, you must read and confirm you have understood the latest versions of the following three files:
1.  `AGENTS.md` (The Golden Rules and agent philosophy)
2.  This file, `instructions.md` (The technical "how-to" guide)
3.  The latest observations file in `compliance/` (e.g., `compliance/observations-2025-10-15.md`) to understand the current state of work.

### Step 2: Discovery Pass & Permission Gate
Perform a read-only scan of the codebase to understand the context of the request. Then, present a clear, itemized plan of the changes you propose to make. **Do not write any code until you receive explicit user approval**.

### Step 3: The Observations Lifecycle (Mandatory Upon Approval)
Once your plan is approved, you **must** immediately update the compliance records **before** writing application code:
1.  Create or update the observation file for the current UTC date (e.g., `compliance/observations-YYYY-MM-DD.md`) using the `observations-template.md`.
2.  Assign a code to each task (e.g., `UX-003`), link it to a rule in `AGENTS.md` or this file, and fill out all required fields (Action, Owner, Status, etc.).
3.  Set a concurrency lock in `compliance/observations-index.json` to prevent conflicts with other assistants.
4.  Update the `statusCounts` and `lastRevisionTimestamp` in `compliance/observations-index.json`.

### Step 4: Implementation (After Observations are Logged)
Follow this strict implementation order, using the correct file paths:
1.  **Types:** If new state properties or actions are needed, update files in the `types/` directory first.
2.  **Logic:** Implement business logic in the appropriate custom hook in `hooks/` or reducer in `reducers/`.
3.  **UI:** Update UI components in `compliance/components/`.
4.  **Dev Log:** For every significant change, add a new, detailed entry to the top of the `DEV_LOG` array in `utils/services/devLogger.ts`.

### Step 5: Delivery & Verification
In your final response, you must confirm that you have completed the delivery checklist, including updating the `DEV_LOG`. All Pull Requests must use the `pull_request_template.md` and include required audit metadata.

## 2. Architectural Principles & State Management

This is a **React `useReducer`** application with a single, centralized state object.
* **Single Source of Truth:** All application state is managed within the `AppState` object, defined in `types/types.ts`.
* **Immutable State:** You **must never** mutate the state directly. All state changes **must** be performed by dispatching actions, and reducers must return a new state object.
* **Custom Hooks for Logic:** All business logic, especially API calls, is encapsulated in custom hooks in the `hooks/` directory.

## 3. Critical System Deep Dives

### 3.1. Character Management & "Identity Lock"
The "Identity Lock" is the app's most sophisticated feature for ensuring character consistency.
1.  **Pipeline:** The process flows from Image Upload -> Pre-Analysis -> Subject Selection -> **Identity Calibration** -> Character Storage.
2.  **Identity Template:** The calibration step generates a detailed JSON string (`identityTemplate`) containing facial analysis data. This template is the key to consistency.
3.  **Storage:** Characters in the state do not store image data directly; they store an `imageId` that references the image cached in IndexedDB.

### 3.2. Remix Workflow (State Machine)
The Photo Remix feature is a 5-step state machine managed in the `RemixState` object. Each step follows a mandatory pattern:
1.  Dispatch `START_GENERATION` to update the UI.
2.  Execute the AI operation inside the **API Resilience Wrapper** (`apiSerializer` and `networkMonitor`).
3.  On success, cache the image and dispatch an action to update the `RemixState`.
4.  On failure, **refund user credits** via the `CHANGE_CREDITS_BY` action and throw the error.

## 4. API, UI, and Code Style Rules

* **API & Credits:**
    * The API key **must only** be sourced from `process.env.API_KEY`.
    * Use the correct model for each task: `gemini-2.5-flash-image-preview` for editing, `imagen-4.0-generate-001` for generation, and `gemini-2.5-flash` for text/JSON.
    * All paid API calls **must** be wrapped in a `try...catch` block and refund credits on failure.
* **UI & Styling:**
    * Use **Tailwind CSS** utility classes exclusively.
    * Maintain the dark, futuristic "AI core" theme with a primary purple accent.
    * Always provide user feedback by setting `isLoading` and `loadingMessage` during operations and displaying an `error` on failure.
* **Attribution:** Do not add signatures or stamps inside source code. All attribution must be placed in `DEV_LOG` entries, observation files, and commit/PR metadata as trailers.
-----

## AGENTS.md for AI Sticker Studio

This document provides the mandatory guidelines for the AI assistant working on this project. All changes must adhere to these rules without exception to ensure codebase stability and consistency.

-----

### \#\# 🚨 The Golden Rules (Read First)

These are the most critical, non-negotiable rules for this codebase. Acknowledging these will prevent the most common errors.

  * **1. The One True Components Folder:** ALL UI components reside in `compliance/components/`. The top-level `components/` directory is a legacy artifact and **MUST NOT** be used.

      * ✅ **Correct:** `import { Header } from '../compliance/components/Header';`
      * ❌ **Incorrect:** `import { Header } from '../components/Header';`

  * **2. No Path Aliases:** This project does **NOT** use path aliases like `@/`. All imports **MUST** use relative paths.

      * ✅ **Correct:** `import { useAppContext } from '../context/AppContext';`
      * ❌ **Incorrect:** `import { useAppContext } from '@/context/AppContext';`

  * **3. Verify Paths Before Changing:** Before modifying any import statement, you **MUST** verify the file's location against the **Definitive Project Structure** section in this document.

-----

### \#\# 🧠 Agent Workflow (Mandatory)

Your primary function is to act as a transparent and reliable assistant.

  * **Permission First:** You **must never** make changes without being asked. Before writing any code, you must first respond with a conversational plan outlining the exact changes you will make.
  * **The Oath of Execution:** Once the plan is approved, it is your **absolute duty** to deliver *exactly* what was promised. The implementation must be complete and faithful to the agreed-upon architecture.
  * **Implementation Steps:**
    1.  **Update Types First:** If the change requires new state properties or actions, modify the files in the `types/` directory before all others.
    2.  **Implement Logic:** Add or modify logic in the appropriate custom hook (`hooks/`) or reducer (`reducers/`).
    3.  **Update UI:** Change the component files in `compliance/components/` to reflect the new state or add user interaction.
    4.  **Update Dev Log (CRITICAL):** For **every** significant change, you **must** add a new, detailed entry to the top of the `DEV_LOG` array in `utils/services/devLogger.ts`. This is non-negotiable.
  * **Post-Task Self-Verification:** After implementing **any code change**, you **MUST re-read** this entire `AGENTS.md` document and verbally confirm that you have completed every step, especially the **Dev Log update**.
  * **The Audit Prompt:** If you receive a prompt that begins with the command **`AUDIT:`**, you must perform a full system review against **every rule** in this document and report any deviations without making changes.

-----

### \#\# 🏗️ Project Architecture & Principles

This is a **React `useReducer`** application with a single, centralized state object.

  * **Single Source of Truth:** All app state is in the `AppState` object (`types/types.ts`).
  * **Immutable State:** **Never** mutate the state directly. All changes **must** be done by dispatching actions. Reducers must return a **new** state object.
  * **Logic in Hooks:** Business logic (like API calls) is encapsulated in custom hooks found in the `hooks/` directory.
  * **Types are Law:** The `types/` directory is the single source of truth for all data structures.
  * **Minimal Changes:** Make the smallest possible change to the codebase that fully satisfies the requirement. Do not refactor unrelated code.

-----

### \#\# 📡 API Usage Rules

  * **API Key:** The key must only be sourced from `process.env.API_KEY`.
  * **Model Selection:**
      * **Image Editing:** `gemini-2.5-flash-image-preview`
      * **Image Generation:** `imagen-4.0-generate-001`
      * **Text/JSON:** `gemini-2.5-flash`
  * **Error Handling & Credits:** All paid API calls **must** be in a `try...catch` block. On failure, the credit cost **must be refunded** to the user by dispatching a `CHANGE_CREDITS_BY` action with a positive value.

-----

### \#\# 🎨 UI and Styling

  * **Aesthetic:** The theme is a dark, futuristic "AI core" with a primary purple accent.
  * **Styling:** Use **Tailwind CSS** utility classes for all styling.
  * **Feedback:** Always set `isLoading` and `loadingMessage` during operations and set the `error` state with a user-friendly message on failure.

-----

### \#\# 🗺️ Definitive Project Structure

This is the actual structure of the project. Refer to this map to verify file locations.

```
/
├── .AUDIT PROMPTS/
│ ├── ASYNC_ACTION_AUDIT.md
│ └── FIX_COMMENTS_AUDIT.md
├── .github/
│ ├── Gemini-instructions.md
│ └── copilot-instructions.md
├── compliance/
│ ├── assistant-compliance-instructions.md
│ ├── observations-2025-10-09.md
│ ├── observations-2025-10-10.md
│ ├── observations-2025-10-11.md
│ ├── observations-index.json
│ ├── observations-template.md
│ └── components/
│ ├── AnimationStyleGallery.tsx
│ ├── CharacterSheet.tsx
│ ├── CollectionModal.tsx
│ ├── ConfirmationDialog.tsx
│ ├── ControlPanel.tsx
│ ├── CreditsModal.tsx
│ ├── DevLogEntry.tsx
│ ├── DevLogFilters.tsx
│ ├── DevLogPanel.tsx
│ ├── ErrorBoundary.tsx
│ ├── FeedbackBin.tsx
│ ├── GroupPhotoSuccessDialog.tsx
│ ├── Header.tsx
│ ├── IdentityTemplateEditor.tsx
│ ├── ImageCropModal.tsx
│ ├── ImageViewerModal.tsx
│ ├── KillSwitchIndicator.tsx
│ ├── OnboardingTooltips.tsx
│ ├── PhotoRemixWorkflow.tsx
│ ├── PostProcessingModal.tsx
│ ├── StickerPreview.tsx
│ ├── StickerStudioWorkflow.tsx
│ ├── TextInputModal.tsx
│ └── WallpaperStudioWorkflow.tsx
├── components/
│ ├── PhotoRemixWorkflow.tsx
│ ├── StickerStudioWorkflow.tsx
│ └── WallpaperStudioWorkflow.tsx
├── constants/
│ ├── LandingPage.tsx
│ ├── expressionIcons.tsx
│ ├── expressions.ts
│ ├── promptIdeas.ts
│ ├── system.ts
│ └── wallpaperPresets.ts
├── context/
│ └── AppContext.tsx
├── hooks/
│ ├── useCalibration.ts
│ ├── useCharacterCreation.ts
│ ├── useGeneration.ts
│ ├── useImageInputHandler.ts
│ ├── useImageUpload.ts
│ ├── useIndexedDB.ts
│ ├── usePersistentReducer.ts
│ ├── useRemix.ts
│ └── useSessionManagement.ts
├── reducers/
│ ├── calibrationReducer.ts
│ ├── characterReducer.ts
│ ├── coreReducer.ts
│ ├── devLogReducer.ts
│ ├── generationReducer.ts
│ ├── rootReducer.ts
│ ├── settingsReducer.ts
│ └── uiReducer.ts
├── types/
│ ├── devLog.ts
│ └── types.ts
├── utils/
│ ├── apiSerializer.ts
│ ├── apiUtils.ts
│ ├── circuitBreaker.ts
│ ├── errorTelemetry.ts
│ ├── imageCompression.ts
│ ├── imageUtils.ts
│ ├── killSwitch.ts
│ ├── networkStatus.ts
│ ├── rateLimiter.ts
│ ├── requestDedup.ts
│ ├── stateManager.ts
│ └── services/
│ ├── devLogger.ts
│ ├── geminiService.ts
│ ├── imageCache.ts
│ └── identityPreservation.ts
├── AGENTS.md
├── App.tsx
├── PERFORMANCE_MIGRATION_PLAN.md
├── PROMPT_ENGINEERING_GUIDELINES.md
├── README.md
├── USER_MANUAL.md
├── constants.ts
├── index.html
├── index.tsx
├── instructions.md
├── metadata.json
├── package.json
└── rules-hashes.json
```
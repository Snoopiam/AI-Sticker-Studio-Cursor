GEMINI CODE ASSIST - Project Instructions: AI Sticker Studio

This document provides essential instructions for working on the AI Sticker Studio codebase. The project uses a strict, pattern-heavy architecture. Adherence to these patterns is mandatory for all contributions.

1. The Golden Rule: The Mandatory Development Workflow

This is the most critical process and must be followed for every change, no matter how small.

Step 1: Permission-First Development

NEVER write or modify code without receiving explicit approval for a detailed implementation plan.

Your plan must outline which files you will modify and the logic you intend to implement.

Step 2: Strict Implementation Order

All changes must be made in this precise sequence:

Types (types.ts): If the change affects state, actions, or data models, update the type definitions first.

Logic (Reducers/Hooks): Implement the core business logic in the appropriate reducer (reducers/) or custom hook (hooks/).

UI (Components): Update the relevant React components (components/) to reflect the changes.

Dev Log (services/devLogger.ts): Add a detailed entry to the development log following the strict format defined below.

Step 3: Post-Implementation Verification

After implementation, you must verbally state that you have:

Completed all steps in the required order.

Re-read this instructions document to ensure compliance.

Verified the Dev Log entry is correct.

2. Core Architectural Principles

Single Source of Truth: All application state is located in a single, centralized AppState object defined in types.ts. All data flows from this object.

Immutable State: State is read-only. Never mutate it directly. All changes MUST be performed by dispatching actions to a useReducer hook.

Types are Law: types.ts is the definitive source for all data structures. Any deviation will break the application.

3. Critical Subsystems & Patterns

3.1. API Integration (MANDATORY)

This is the most complex and critical system. Failure to follow these rules will result in application failure and wasted user credits.

The API Resilience Wrapper: ALL external API calls MUST be wrapped in the apiSerializer and networkMonitor. This system prevents rate-limiting and handles network failures.

TypeScript



return apiSerializer.add(() => networkMonitor.executeWithRetry(async () => {

    // Your API logic (e.g., call to geminiService) goes here

}));

Error Handling & Credit Refunds: Every operation that costs credits MUST be wrapped in a try/catch block. On failure, you must dispatch an action to refund the user's credits.

TypeScript



try {

  // API call that costs credits

} catch (error) {

  dispatch({ type: 'CHANGE_CREDITS_BY', payload: +cost }); // Note the '+' to make it a positive number

  throw error;

}

Model Selection: Use the correct model for the job as defined in constants.ts. Do not deviate.

3.2. Dev Logging

All changes are tracked in services/devLogger.ts.

Format: "[TYPE]: Description. (Affected: file1.ts, file2.tsx)"

Date: Must be generated using new Date().toISOString().

Details: Must include a markdown-formatted code diff or snippet that clearly shows the core of the change.

3.3. Testing & Debugging

The primary method for testing hooks and logic involves renderHook from React Testing Library, providing a mock context.

Debugging Tools: Utilize the built-in tools:

Dev Log Panel: Cmd/Ctrl + Shift + D

Credits Modal: View transaction history.

React DevTools: Inspect state and component props.

4. Major Application Workflows

Understanding these multi-step workflows is essential. Do not attempt to modify them without a deep understanding of the state machine involved.

4.1. Onboarding Flow

The app's UI and behavior change based on flags in state.onboardingCompleted.

When implementing a feature, you must check if it should be hidden or modified for users who have not completed onboarding for a specific mode (e.g., stickers, remix).

Use the COMPLETE_ONBOARDING_FOR_MODE action to mark a tutorial as finished.

4.2. Character Management Pipeline

This is a strict, multi-step process for creating a new character.

Image Upload -> Caches to IndexedDB.

Pre-Analysis -> Detects subjects.

Calibration -> A multi-step AI process that generates the critical identityTemplate.

Storage -> The final character is saved to state.

Identity Template: This is a unique project concept. It is a JSON string containing detailed facial analysis data. It is the key to maintaining character consistency and must be generated through the calibration workflow.

4.3. Remix Workflow State Machine

The Photo Remix feature is a 5-step state machine managed by RemixState. Each step follows the same bulletproof pattern:

Dispatch a START_GENERATION action.

Execute the AI operation using the mandatory API Resilience Wrapper.

On success, cache the resulting image to IndexedDB.

Dispatch a SET_REMIX_STATE action with the new data.

On failure, handle the error and execute the Credit Refund pattern.

5. Example Implementation: Adding a 'High Contrast' Setting

This example demonstrates the complete, mandatory workflow.

1. Get Approval: Propose the change, outlining the files to be modified.

2. Update types.ts:

TypeScript



export interface AppSettings {

  highContrast: boolean; // Add new property

  //...

}export type Action = | { type: 'TOGGLE_HIGH_CONTRAST' };

3. Implement Logic (Reducer):

TypeScript



// In reducers/settingsReducer.tscase 'TOGGLE_HIGH_CONTRAST':

  return {

    ...state,

    settings: { ...state.settings, highContrast: !state.settings.highContrast },

  };

4. Update UI Component:

TypeScript



// In components/SettingsPanel.tsxconst { state, dispatch } = useAppContext();const toggleHighContrast = () => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' });

5. Update Dev Log:

TypeScript



// In services/devLogger.ts

{

  id: '...',

  date: new Date().toISOString(),

  agent: 'Gemini',

  entry: "[FEATURE]: Add High Contrast toggle. (Affected: SettingsPanel.tsx, settingsReducer.ts, types.ts)",

  details: "`...code diff...`"

}

6. Post-Implementation Verification: Verbally confirm all steps were followed.
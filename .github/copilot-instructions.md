# AI Sticker Studio - Copilot Instructions

## Architecture Overview
This is a React + TypeScript application using `useReducer` for state management with a **single, centralized state object** (`AppState` in `types.ts`). The architecture is based on **immutable state updates** and **strict action-based mutations**.

### Key Architectural Principles
- **Single Source of Truth**: All app state lives in `AppState` object
- **Immutable State**: Never mutate state directly - always dispatch actions through reducers
- **Logic in Hooks**: Business logic encapsulated in custom hooks (`hooks/` directory)
- **Types are Law**: `types.ts` is the definitive source for all data structures

## Critical Development Workflow (MANDATORY)

### 1. Permission-First Development
- **Never make changes without explicit approval**
- Always provide a conversational plan outlining exact changes before implementation
- Implementation must match the approved plan exactly

### 2. Implementation Order (Required Sequence)
1. **Update `types.ts` first** if new state properties/actions needed
2. **Implement logic** in appropriate hook (`hooks/`) or reducer (`reducers/`)
3. **Update UI components** in `components/`
4. **Update Dev Log** - Add detailed entry to top of `DEV_LOG` array in `services/devLogger.ts` (CRITICAL)

### 3. Post-Implementation Verification
After any code change, you MUST:
- Re-read this document (`copilot-instructions.md`)
- Verbally confirm completion of all implementation steps
- Verify the Dev Log entry was added and matches all requirements

## Dev Log Requirements

All entries in `DEV_LOG` (`services/devLogger.ts`) must follow this structure precisely:

- **Format**: Use this template: `"[Type]: Brief description of changes. (Affected: ComponentA, useHookB, etc.)"`
    - `[Type]` can be: `FEATURE`, `FIX`, `REFACTOR`, `CHORE`.
- **Date & Time**: The `date` field must be an accurate ISO 8601 string. Use `new Date().toISOString()` to generate the current UTC timestamp.
- **Code Changes**: The log entry's `details` field must contain a concise markdown-formatted snippet or diff of the exact code that was changed. This is for review and traceability and must be complete enough for another developer to understand the core of the change.

## State Management Patterns

### Reducer Composition
State is managed through composed reducers in `reducers/rootReducer.ts`:
```typescript
// Each reducer handles specific state slices
newState = coreReducer(newState, action);
newState = settingsReducer(newState, action);
// ... etc
```

### Action Dispatch Pattern
```typescript
const { state, dispatch } = useAppContext();
dispatch({ type: 'ACTION_TYPE', payload: data });
```

### Image Caching
Uses IndexedDB via `services/imageCache.ts`. Access cached images with:
```typescript
const imageData = useCachedImage(imageId);
```

## API Integration (Critical Patterns)

### API Key Configuration
- API key MUST come from `process.env.API_KEY`
- All API calls must check `isApiKeySet` before execution

### Model Selection Rules
- **Image Editing**: `gemini-2.5-flash-image-preview`
- **Image Generation**: `imagen-4.0-generate-001`  
- **Text/JSON**: `gemini-2.5-flash`

### API Resilience (v4.0.0+ Critical)
ALL API calls must use the serialization system to prevent rate limiting:
```typescript
return apiSerializer.add(() => networkMonitor.executeWithRetry(async () => {
    // Your API logic here
}));
```

### Error Handling & Credits
All paid operations MUST be in try/catch blocks. On failure, refund credits:
```typescript
try {
    // API call
} catch (error) {
    dispatch({ type: 'CHANGE_CREDITS_BY', payload: +cost }); // Refund
    throw error;
}
```

## Testing & Debugging Patterns

### Error Boundaries & Resilience

The app uses comprehensive error handling:
- `<ErrorBoundary>` component wraps the entire app to catch React errors
- All API calls go through circuit breakers and retry logic in `utils/`
- Network status monitoring via `networkMonitor.executeWithRetry()`

### Debugging Tools

- **Dev Log Panel**: `Cmd/Ctrl + Shift + D` opens development history
- **Credits Modal**: Shows transaction history and current balance
- **Kill Switch**: Emergency system disable via `utils/killSwitch.ts`
- **Health Monitor**: Real-time system status tracking

### Testing Approach

```typescript
// Example test pattern for hooks with state
const { result } = renderHook(() => useCalibration(), {
  wrapper: ({ children }) => (
    <AppContext.Provider value={{ state: mockState, dispatch: mockDispatch }}>
      {children}
    </AppContext.Provider>
  ),
});
```

### Common Debugging Steps

1. Check browser network tab for API call failures
2. Verify `process.env.API_KEY` is set correctly  
3. Check Dev Log for recent changes that might have introduced issues
4. Monitor IndexedDB for image cache issues
5. Use React DevTools to inspect state transitions

## Component & Styling Patterns

### UI Feedback Requirements
Always provide loading states:
```typescript
dispatch({ type: 'START_GENERATION', payload: 'Loading message...' });
```

### Styling Rules
- Use **Tailwind CSS** utility classes exclusively
- Theme: Dark, futuristic "AI core" with purple accents
- Use `<AiCore />` component for loading states

### File Organization
```
components/     # UI Components  
hooks/         # Business Logic
reducers/      # State Management
services/      # API Integration
utils/         # Utilities (API resilience, image processing)
types.ts       # Type Definitions (single source of truth)
constants.ts   # Static Configuration
```

## Onboarding Flow Patterns

The app tracks user onboarding completion per mode in `AppCoreState`:

```typescript
onboardingCompleted: {
  stickers: boolean;
  wallpapers: boolean;
  remix: boolean;
}
```

### Critical Onboarding Rules

- **First-time users** see tooltips and guided workflows
- **Mode-specific onboarding**: Each app mode (stickers/wallpapers/remix) has separate completion tracking
- **OnboardingTooltips component**: Manages tooltip display based on completion state
- **Completion trigger**: Use `COMPLETE_ONBOARDING_FOR_MODE` action when user finishes a mode's tutorial

### Implementation Pattern

```typescript
// Check if onboarding is needed
if (!state.onboardingCompleted.stickers && state.appMode === 'stickers') {
  // Show onboarding UI
}

// Mark onboarding complete after user action
dispatch({ type: 'COMPLETE_ONBOARDING_FOR_MODE', payload: 'stickers' });
```

## Character Management Workflow

### Character Creation Pipeline

1. **Image Upload**: User uploads photo → stored in IndexedDB via `imageCache`
2. **Pre-Analysis**: `preAnalyzeImage()` detects subjects and quality issues
3. **Subject Selection**: User crops/selects specific person from group photos
4. **Identity Calibration**: Multi-step AI analysis creates `identityTemplate` JSON
5. **Character Storage**: Final character saved to `characterLibrary` state slice

### Identity Template System

```typescript
interface Character {
  id: string;
  name: string;
  imageId: string; // References IndexedDB cached image
  identityTemplate?: string; // JSON string of facial analysis
  // ... other properties
}
```

### Critical Character Patterns

- **Identity Templates**: JSON strings containing detailed facial feature analysis for AI consistency
- **Image References**: Characters store `imageId` that references IndexedDB, never direct base64
- **Recommended Presets**: AI-analyzed compatibility with wallpaper styles
- **Character Transfer**: Special workflow for moving sticker characters to wallpaper mode

### Character Hook Usage

```typescript
const { createCharacterFromImage, updateCharacter } = useCharacterCreation();

// Create new character with identity locking
await createCharacterFromImage({
  base64Image,
  name: 'Character Name',
  identityTemplate: calibrationResult.identityTemplate
});
```

## Remix Workflow (Multi-Step State Machine)

The Photo Remix feature follows a complex 5-step process managed in `RemixState`:

### Remix State Structure

```typescript
interface RemixState {
  originalImage: string | null;        // Step 1: User upload
  cutoutImage: string | null;          // Step 2: Subject extraction 
  remixedCutoutImage: string | null;   // Step 3: AI style transformation
  generatedBackground: string | null;   // Step 4: Scene generation
  finalImage: string | null;           // Step 5: Composite result
  sceneSuggestions: SceneSuggestion[]; // AI-generated scene ideas
  // ... other properties
}
```

### Remix Step Pattern

Each step follows this pattern:

```typescript
// 1. Update loading state
dispatch({ type: 'START_GENERATION', payload: 'Processing step...' });

// 2. Execute AI operation with error handling
try {
  const result = await apiSerializer.add(() => 
    networkMonitor.executeWithRetry(() => aiOperation())
  );
  
  // 3. Cache result and update state
  const imageId = await imageCache.store(result.dataUrl);
  dispatch({ 
    type: 'SET_REMIX_STATE', 
    payload: { [stepProperty]: result.dataUrl }
  });
} catch (error) {
  // 4. Handle failure with credit refund
  dispatch({ type: 'CHANGE_CREDITS_BY', payload: +stepCost });
  throw error;
}
```

### Group Photo Detection

Special handling for group photos:
- `isGroupPhoto: boolean` flag changes UI and cost calculation
- `detectedSubjects: DetectedSubject[]` for individual subject selection
- Different credit costs for single vs. group processing

## Example Workflow: Adding a 'High Contrast' Setting

This demonstrates the mandatory implementation order for adding a new boolean setting.

**Step 1: Get Approval**

- Propose: "I will add a 'High Contrast' toggle. This requires updating `AppState`, `settingsReducer`, a settings hook, and the `SettingsPanel` component. I will then add a dev log entry."
- Wait for "Approved."

**Step 2: Update `types.ts`**

```typescript
// In types.ts, inside the settings interface
export interface AppSettings {
  theme: 'dark' | 'light';
  highContrast: boolean; // Add new property
  //...
}

// Add a new action type
export type Action =
  // ... existing actions
  | { type: 'TOGGLE_HIGH_CONTRAST' };
```

**Step 3: Implement Logic (Reducer)**

```typescript
// In reducers/settingsReducer.ts
case 'TOGGLE_HIGH_CONTRAST':
  return {
    ...state,
    settings: {
      ...state.settings,
      highContrast: !state.settings.highContrast,
    },
  };
```

**Step 4: Update UI Component**

```typescript
// In components/SettingsPanel.tsx
// ... imports
const { state, dispatch } = useAppContext();
const toggleHighContrast = () => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' });
// ...
return (
  // ... JSX
  <Toggle
    label="High Contrast Mode"
    checked={state.settings.highContrast}
    onChange={toggleHighContrast}
  />
);
```

**Step 5: Add Detailed Code Comments**

- Add JSDoc comments in the reducer and component explaining the new logic.

**Step 6: Update Dev Log**

```typescript
// In services/devLogger.ts
{
  id: 'log-entry-uuid-generated-by-agent',
  date: new Date().toISOString(), // Current UTC timestamp
  agent: 'Gemini',
  entry: "[FEATURE]: Add High Contrast toggle to settings. (Affected: SettingsPanel.tsx, settingsReducer.ts, types.ts)",
  details: `
Added 'highContrast: boolean' to AppSettings in types.ts and a corresponding 'TOGGLE_HIGH_CONTRAST' action. The settingsReducer now handles this action to toggle the boolean state. A UI toggle was added to SettingsPanel.
\`\`\`diff
// types.ts
+ highContrast: boolean;

// settingsReducer.ts
+ case 'TOGGLE_HIGH_CONTRAST':
+   return { ...state, settings: { ...state.settings, highContrast: !state.settings.highContrast }};
\`\`\`
  `
}
```

**Step 7: Post-Implementation Verification**

- Verbally state: "Implementation is complete. I have updated `types.ts`, the reducer, the component, added comments, and logged the change in `devLogger.ts`. I have re-read `copilot-instructions.md`."

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Build for production
```

## Key Files to Reference

- `types.ts` - Complete type system and action definitions
- `AGENTS.md` - Mandatory development workflow rules
- `services/geminiService.ts` - API integration patterns
- `utils/apiSerializer.ts` - API resilience implementation
- `services/devLogger.ts` - Development logging system
- `context/AppContext.tsx` - State access patterns

## Unique Project Patterns

### Credit System
All operations cost credits. Track costs in `constants.ts` `CREDIT_COSTS` object.

### Multi-Step Workflows
Complex features like calibration use state machines with specific steps (see `CalibrationStep` type).

### Identity Templates
Facial recognition data stored as JSON strings in character objects for consistency across generations.

### Style Compatibility System
`STYLE_COMPATIBILITY` in `constants.ts` enforces valid artistic style combinations.

## Additional Resources

- **DevLogPanel**: `Cmd/Ctrl + Shift + D` for development history
- **Network Monitoring**: Browser DevTools network tab for API debugging
- **Error Boundaries**: Component crash protection with fallback UI
- **Credits System**: Modal shows balance and transaction history
- **State Persistence**: Uses `usePersistentReducer` with session storage backup
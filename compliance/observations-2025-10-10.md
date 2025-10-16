1. Critical Build Error: Incomplete Refactoring of wallpaperPresets.ts
ID: STRUCTURE-001
Files Affected:
components/wallpaperPresets.ts (Incorrectly located here)
constants.ts (Attempts to import from the wrong path)
types.ts (Attempts to import from the wrong path)
components/WallpaperStudioWorkflow.tsx (Attempts to import from the wrong path)
Description:
The development log (log-093) states that components/wallpaperPresets.ts was moved to constants/wallpaperPresets.ts to centralize all static data. However, the file still resides in the components/ directory. Multiple other files (constants.ts, types.ts, and WallpaperStudioWorkflow.tsx) were updated to import it from the new, non-existent path in constants/.
Impact: This discrepancy causes a critical module resolution failure, which will break the application's build process.
Suggested Fix: To resolve this, the file components/wallpaperPresets.ts must be moved to constants/wallpaperPresets.ts. This will align the file structure with the dev log and fix the broken import paths.

2. Critical Build Error: Incomplete Refactoring of promptIdeas.ts
ID: STRUCTURE-002
Files Affected:
promptIdeas.ts (Incorrectly located in the root directory)
reducers/settingsReducer.ts (Attempts to import from the wrong path)
Description:
Similar to the issue above, development log log-092 indicates that promptIdeas.ts was moved into the constants/ directory. The file, however, remains in the project's root. The settingsReducer.ts file attempts to import it from the constants/ directory.
Impact: This is another critical module resolution failure that will break the build.
Suggested Fix: The promptIdeas.ts file must be moved from the root into the constants/ directory to match the import path used in the reducer.

3. Architectural Violation: Decentralized Type Definitions
ID: ARCHITECTURE-001
Files Affected:
services/geminiService.ts
services/identityPreservation.ts
types.ts
Description:
The architectural guidelines in AGENTS.md state that types.ts is the single source of truth for all data structures. Currently, several key type interfaces (SceneSuggestion, StickerAnalysis, BiometricProfile, IdentityAnchor, ValidationResult) are defined directly within services/geminiService.ts and services/identityPreservation.ts. The central types.ts file then re-imports and re-exports them. This pattern violates the principle of centralizing type definitions and separates them from their source of truth.
Impact: This makes the codebase harder to maintain and introduces potential for type inconsistencies.
Suggested Fix: The type definitions for these interfaces should be moved from the services/ files into types.ts. This will properly centralize all type definitions and bring the codebase into compliance with the established architectural rules.
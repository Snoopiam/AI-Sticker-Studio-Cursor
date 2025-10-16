
***

### ## 1. Audit Prompt: `StickerStudioWorkflow` Failure Analysis 🕵️

**`AUDIT: Act as a Senior System Reliability Engineer. Your mission is to perform a root cause analysis of the StickerStudioWorkflow generation pipeline to identify any and all potential failure points that could stop a result from being generated. Trace the entire process from user input to the final state update.`**

`Your analysis must follow this exact data-flow trace:`
1.  **`Input & State Capture:`** `Analyze StickerStudioWorkflow.tsx. How are user selections (mode, expressions, style, format) captured and dispatched to the global state? Is there any risk of a race condition or stale state when toggling between 'static' and 'animated' formats?`
2.  **`Triggering Event:`** `Examine the "Generate" button's onClick handler, generation.generateStickers.`
3.  **`Inside the Hook (`useGeneration.ts`):`**
    * `Trace the logic that differentiates between a 'text-to-image' and an 'image-to-image' request. How is the IdentityAnchor prepared? Is it possible for this data to be malformed?`
    * `Follow the logic path for 'animated' vs. 'static' generation. How is the credit cost calculated for a pack size vs. a single animation? Is this calculation foolproof?`
4.  **`API Prompt Assembly:`** `How is the final prompt for the Gemini/Imagen API constructed? Does it strictly follow the Prompt Engineering Playbook, especially the Primary Directive to preserve identity when an IdentityAnchor is present?`
5.  **`Response Handling:`** `Analyze the try...catch...finally block. On API success, how is the array of results (for a static pack) or the single video result handled and added to the collection? On failure, is the credit refund logic guaranteed to execute? Is the FINISH_GENERATION action dispatched in ALL possible outcomes (success, caught error, unexpected failure)?`

`**Output Format:** Provide a "Sticker Workflow Fault Analysis" report. For each potential "culprit" (failure point) you identify, list the file, the function/line number, a description of the risk, and a recommended fix.`

***

### ## 2. Audit Prompt: `WallpaperStudioWorkflow` Failure Analysis 🖼️

**`AUDIT: Act as a Lead QA Engineer specializing in complex AI integrations. Your task is to perform a microscopic audit of the WallpaperStudioWorkflow generation pipeline. Your goal is to find any weak link in the chain that could prevent a wallpaper from being generated successfully, especially when using advanced features.`**

`Your analysis must follow this exact data-flow trace:`
1.  **`Input & State Capture:`** `Analyze WallpaperStudioWorkflow.tsx. How are the selectedCharacterIds, customPrompt, and advanced composition settings (lighting, blending, etc.) captured in the wallpaperSettings state slice?`
2.  **`Triggering Event:`** `Examine the "Generate Wallpaper" button's onClick handler, generation.generateWallpaper.`
3.  **`Inside the Hook (`useGeneration.ts`):`**
    * `Trace the logic for retrieving the `IdentityAnchor` data for all selected characters. What happens if one or more characters are selected but have a missing or corrupt IdentityAnchor?`
    * `Critically analyze the "Smart Context Adaptation" logic path. How does it modify the final prompt sent to the AI? Is it possible for this pipeline to fail, and if so, does it have a fallback?`
4.  **`API Prompt Assembly:`** `How is the final prompt for the imagen-4.0-generate-001 model constructed? Pay special attention to how it handles style mismatches between a character and the scene, as defined in the Prompt Engineering Playbook. Does it correctly instruct the AI on how to blend the two?`
5.  **`Response Handling:`** `Analyze the try...catch...finally block. On success, how is the final wallpaper image added to the collection and recent generations? On failure, is the credit refund logic robust? Is the UI state guaranteed to be reset via FINISH_GENERATION, preventing a stuck loading screen?`

`**Output Format:** Provide a "Wallpaper Workflow Fault Analysis" report. For each potential "culprit" (failure point) you identify, list the file, the function/line number, a description of the risk, and a recommended fix.`

***

### ## 3. Audit Prompt: `PhotoRemixWorkflow` Failure Analysis 🎭

**`AUDIT: Act as a Senior System Reliability Engineer with expertise in distributed image processing. The PhotoRemixWorkflow is the most complex pipeline in this application. Your mission is to perform a deep, forensic audit of the entire workflow, from upload to final composite, to find any culprit that could stop a result from being generated, especially for group photos.`**

`Your analysis must follow this exact data-flow trace:`
1.  **`Initial Analysis (`useRemix.ts`):`** `Trace the uploadAndAnalyze function. What are the failure modes for the initial Promise.all that calls segmentImage and analyzeAndSuggestScenes? If one fails, does the entire process halt gracefully?`
2.  **`Triggering Event (`initiateSimpleGenerate`):`** `Analyze how the component decides between a single subject and a group photo remix. Focus on the detectSubjectsInCutout call. What happens if this analysis fails or returns zero subjects?`
3.  **`The "Divide and Conquer" Group Photo Pipeline (`executeGroupPhotoRemix` in `useRemix.ts`):`**
    * `Trace the image processing utilities. Could the `cropImage` or `stitchImages` canvas functions fail with certain image dimensions or formats?`
    * `Analyze the loop that calls `remixForeground` for each subject. This is a critical failure point. What happens if one of the API calls in the middle of the loop fails? Does the entire process stop? Are partial credits refunded? Is there a risk of wasted work?`
4.  **`API Prompt Assembly:`** `Review the prompts sent to `remixForeground`, `generateBackground`, and `compositeImages`. Do they adhere to the "VFX Compositor" persona and its constraints as defined in the Prompt Engineering Playbook?`
5.  **`Response Handling:`** `Scrutinize the `try...catch` blocks in both `executeGroupPhotoRemix` and `executeSingleSubjectRemix`. Is the complex credit calculation for group photos correct? Is the refund logic guaranteed to return the exact amount charged? Is the FINISH_GENERATION action called correctly on all paths to prevent a stuck UI?`

`**Output Format:** Provide a "Photo Remix Workflow Fault Analysis" report. For each potential "culprit" (failure point) you identify, list the file, the function/line number, a description of the risk, and a recommended fix.`

-----




### 1\. Resilience & User Experience (UX) Audits 🛡️

These prompts focus on the application's stability and how it feels to the user, especially when things go wrong.

  * **`AUDIT: Perform a comprehensive Resilience and User Experience (UX) audit across all major workflows (Sticker, Wallpaper, Remix). You are a Quality Assurance engineer trying to find ways to break the app or create a confusing user state. Analyze the codebase with the following checks in mind:`**
      * **`1. State Transition Integrity:`** `For every "START_" action, is there a corresponding "FINISH_" action on ALL possible code paths (success and error)? Identify any scenarios where the app could get stuck in a loading state.`
      * **`2. Comprehensive Error Handling:`** ` Are all async operations that might fail wrapped in a try...catch block? Does every  `catch`  block correctly perform all three cleanup actions: 1) Dispatching a GENERATION_ERROR, 2) Dispatching a CHANGE_CREDITS_BY to refund credits, and 3) Dispatching a FINISH_* action to reset the UI state? `
      * **`3. User Feedback Completeness:`** ` Does every major process provide immediate feedback by setting a  `loadingMessage`and is every significant success or failure recorded with an`ADD\_LOG\_ENTRY`  action? `
      * **`4. Edge Case Resilience:`** ` Are all primary action buttons correctly  `disabled`  during loading states? Are there checks for insufficient credits before an action is executed? `

-----

### 2\. API Usage & Stability Audits 🚦

These prompts focus on preventing API errors, managing costs, and ensuring efficient communication with the Gemini API.

  * **`AUDIT: Scan the entire codebase for functions that make multiple, sequential API calls in rapid succession. Report any instances where there is no delay between these calls, as this creates a high risk of hitting API rate limit quotas.`**
  * **`AUDIT: Analyze the workflows triggered by a single user action (like 'image upload'). Identify any that result in a burst of multiple, un-delayed API calls.`**
  * **`AUDIT: Review all API calls. Are we correctly identifying and catching 429 (Too Many Requests) errors and ensuring the user's credits are always refunded upon failure?`**
  * **` AUDIT: Review all API calls in  `geminiService.ts` . Are there any instances where a more powerful (and expensive) model is being used when a cheaper, faster model like  `gemini-2.5-flash`  would be sufficient for the task? `**
  * **`AUDIT: Analyze the user workflows to identify any scenarios where the same data might be fetched multiple times. Suggest opportunities to implement caching to prevent redundant, credit-consuming API calls.`**

-----

### 3\. Performance & Security Audits 🚀

These prompts check for client-side performance bottlenecks and common security vulnerabilities.

  * **`AUDIT: Analyze our main UI components (`StickerStudioWorkflow` ,  `WallpaperStudioWorkflow` ). Identify potential causes of unnecessary re-renders and suggest where  `React.memo` ,  `useCallback` , or  `useMemo`  could be used to optimize performance. `**
  * **` AUDIT: Perform a security review of the entire frontend codebase. Verify that the Gemini API key is ONLY ever referenced via  `process.env.API\_KEY`  and is never exposed, hardcoded, or stored in the application state or local storage. `**
  * **` AUDIT: Scan the application for any potential Cross-Site Scripting (XSS) vulnerabilities, specifically checking for any use of  `dangerouslySetInnerHTML`.`**

-----

### 4\. Code Quality & Maintainability Audits 🧹

These prompts focus on the long-term health, readability, and consistency of the codebase.

  * **`AUDIT: Perform a dead code analysis. Scan the codebase for any declared but unused functions, variables, components, hooks, or constants that can be safely removed.`**
  * **` AUDIT: Review the codebase for "magic strings" or "magic numbers." Identify any hardcoded literal values that should be refactored into named constants in the  `constants/`  directory. `**
  * **`AUDIT: Review the JSDoc comments. Identify any comments that are stale, inaccurate, or simply restate the function name without providing useful context.`**
  * **`AUDIT: Analyze the naming conventions for functions, variables, and props. Report any names that are ambiguous, too generic, or do not clearly communicate their purpose.`**
  * **` AUDIT: Analyze the  `AppState`  interface. Identify any potential instances of redundant state where one piece of state can be derived from another. `**
  * **`AUDIT: Review the reducer functions. Identify any cases that have become overly complex and could be refactored into smaller, more focused helper functions.`**

-----

### 5\. Accessibility (a11y) Audits ♿

These prompts ensure the application is usable by everyone, including those with disabilities.

  * **` AUDIT: Perform an accessibility review of all UI components. Check for proper use of semantic HTML and verify that all interactive elements without clear text (like icon buttons) have a descriptive  `aria-label`  attribute. `**
  * **` AUDIT: Scan all  `\<img\>`tags. Report any images that are missing an`alt`  attribute or are using generic, non-descriptive alt text (e.g., "Generated sticker"). `**

-----

### 6\. The Final Pre-Release Audit ✅

This is the comprehensive, all-in-one prompt to use as a final quality gate before a release.

  * **`AUDIT: This is the final pre-release audit. Act as the Lead Quality Assurance Engineer and give a final "go/no-go" assessment. Perform a comprehensive regression test and a full compliance review against all rules in AGENTS.md, including:`**
      * **`1. Stability Verification:`** ` Confirm that all API call pacing delays and the  `Promise.all`  refactoring are still in place. `
      * **`2. Full Compliance Review:`** `Briefly re-verify all major principles from our previous audits (Architecture, API Error Handling, UI Feedback, Code Quality, Accessibility).`
      * **`3. Final Sanity Check:`** `Scan for any remaining "// TODO" comments and confirm the DEV_LOG is up-to-date.`
      * **`Provide your findings in a "Final Pre-Release Audit Report." If no deviations are found, conclude with the statement: "The application passes all quality checks and is ready for release."`**
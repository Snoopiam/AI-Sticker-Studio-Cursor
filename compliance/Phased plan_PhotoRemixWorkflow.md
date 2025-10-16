Phased plan to focusing on the `PhotoRemixWorkflow` component first as our test case.

This roadmap is designed to systematically refactor the component to improve its maintainability and performance, following the two key recommendations: **Component Decomposition** and **Logic Encapsulation**.

***

### ## Refactoring Roadmap: `PhotoRemixWorkflow` 🗺️

The goal is to break down the monolithic component into smaller, focused pieces and extract complex logic into a dedicated hook.

#### ### Phase 1: Encapsulate Logic with a New Hook (Low Risk) 🚀
The first step is to tackle the recommendation of encapsulating logic in a custom hook.

1.  **Create `useInspiration.ts`:** Create a new file in the `hooks/` directory.
2.  **Migrate Logic:** Move the entire `handleInspireMe` function, including its dual-path logic for handling online vs. offline suggestions, from `PhotoRemixWorkflow.tsx` into the new `useInspiration` hook.
3.  **Return Values:** The hook should return the `inspireMe` function and any related loading or state variables.
4.  **Integrate:** Replace the original `handleInspireMe` function in `PhotoRemixWorkflow.tsx` with a call to the new `useInspiration()` hook. This isolates the logic without changing the UI.

#### ### Phase 2: Component Scaffolding (Medium Risk) 🏗️
Next, we'll create the new file structure for the decomposed child components.

1.  **Create New Files:** In the `compliance/components/` directory, create the following new, empty component files:
    * `UploadSection.tsx`
    * `PromptControls.tsx`
    * `GenerationModeToggle.tsx`
    * `ActionFooter.tsx`
2.  **Define Props (Component API):** For each new component, define its `Props` interface. These components should only receive the specific state and handlers they need, not the entire `remix` object. For example:
    * `UploadSection` will need props for image handling and the `originalImage` and `cutoutImage` state.
    * `PromptControls` will need props for the prompt values and the `onInspireMe` handler.
    * `ActionFooter` will need props for the `isLoading` state and the simple/advanced generation functions.

#### ### Phase 3: Logic & JSX Migration (High Risk) 🧱
This is the core of the refactoring process.

1.  **Move JSX:** Carefully cut the corresponding JSX for each section from `PhotoRemixWorkflow.tsx` and paste it into the `render` function of the appropriate new child component.
2.  **Connect Props:** Wire up the props defined in Phase 2 to the JSX. This will likely involve removing `remixState.` prefixes from variables and using the direct props instead.
3.  **Update Parent Component:** In `PhotoRemixWorkflow.tsx`, replace the JSX you just cut out with the new child components, passing the required props to each one.

#### ### Phase 4: Cleanup & Verification (Low Risk) 🧹
The final step is to clean up the now-simplified parent component.

1.  **Simplify `PhotoRemixWorkflow.tsx`:** This component should now be much smaller, primarily acting as a container that calls hooks and passes state down to the new child components.
2.  **Remove Redundant State/Props:** Remove any local state variables or props that were only used by the logic that has now been moved to a child component.
3.  **Test:** Perform a full functional test of the Photo Remix feature to ensure the refactored version behaves identically to the original.
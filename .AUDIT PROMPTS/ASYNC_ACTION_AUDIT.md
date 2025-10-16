# Asynchronous Action Feedback Audit

This document outlines a comprehensive audit of all user-initiated asynchronous actions in the AI Sticker Studio application. The goal is to ensure that every action provides immediate, clear, and consistent feedback to the user, eliminating "stuck" states and improving the overall user experience.

## Audit Checklist

| Action / Location                                | Sets Loading State? | Sets Loading Message? | Handles Error State? | Clears State on Finish? | Notes & Required Fixes                                                                                                                                                                                                                                                          |
| :----------------------------------------------- | :------------------ | :-------------------- | :------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **useImageUpload > uploadImage**                 | ✅ `START_PRE_ANALYSIS` | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅ (`OPEN_CROP_MODAL` clears it) | **Status: OK.** This was fixed in `log-041`. However, the UI needs to disable upload while `isPreAnalyzing` is true. **FIX:** Disable UI inputs in all workflows.                                                                                                                   |
| **useCalibration > autoCalibrate**               | ✅ `START_CALIBRATION`  | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅                      | **Status: OK.** The core logic is sound.                                                                                                                                                                                                                                          |
| **useCharacterCreation > execute...**            | ✅ `START_...`          | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅                      | **Status: OK.** Fixed in `log-040`. The `FINISH_CHARACTER_CREATION` is correctly called in `finally` or `onCancel` blocks.                                                                                                                                                 |
| **useGeneration > executeSticker...**            | ✅ `START_GENERATION`   | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅ `GENERATION_COMPLETE`  | **Status: OK.** The core logic is sound.                                                                                                                                                                                                                                          |
| **useGeneration > executeWallpaper...**          | ✅ `START_WALLPAPER...` | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅ `GENERATION_COMPLETE`  | **Status: OK.** The core logic is sound.                                                                                                                                                                                                                                          |
| **useRemix > uploadAndAnalyze**                  | ✅ `START_GENERATION`   | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅ `FINISH_GENERATION`    | **Status: Needs Improvement.** Does not dispatch to `activityLog`, making it invisible to the user. **FIX:** Add `ADD_LOG_ENTRY` dispatches for start/success/error.                                                                                                           |
| **useRemix > execute...Remix**                   | ✅ `START_GENERATION`   | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅ `FINISH_GENERATION`    | **Status: Needs Improvement.** Does not dispatch to `activityLog`. **FIX:** Add `ADD_LOG_ENTRY` dispatches for start/success/error.                                                                                                                                         |
| **useRemix > executeAdvancedRemixStep**          | ✅ `START_GENERATION`   | ✅ `SET_LOADING_MESSAGE`  | ✅ `GENERATION_ERROR`  | ✅ `FINISH_GENERATION`    | **Status: Needs Improvement.** Does not dispatch to `activityLog`. **FIX:** Add `ADD_LOG_ENTRY` dispatches for start/success/error.                                                                                                                                         |
| **PostProcessingModal > performEdit**            | ✅ (Local State)        | ✅ (Local State)        | ❌ (Local State)        | ✅                      | **Status: Critical Fix Needed.** Uses local `isProcessing` and `error` state, inconsistent with the rest of the app. Redo button is broken. **FIX:** Fix Redo button. Refactor to use global `GENERATION_ERROR` dispatch. |
| **CharacterSheet > handleSave**                  | ❌                  | ❌                    | ❌                   | N/A                     | **Status: OK.** This is a synchronous state update (`onUpdate` callback), so no loading state is needed.                                                                                                                                                                     |

## Test Checklist

### General
- [ ] **Verify Dev Log:** Confirm a new, accurate entry for this fix exists in the Dev Log panel.

### Post-Processing Modal
- [ ] **Test Undo:** Open the modal, perform an edit (e.g., "Remove BG"), then click Undo. The image should revert to the previous state.
- [ ] **Test Redo:** After undoing, click Redo. The edit should be re-applied. Verify the button is not just performing another undo.
- [ ] **Test Error State:** (Requires simulating an API failure) Trigger an edit and confirm that the global error overlay appears inside the modal, and that credits are refunded in the activity log.
- [ ] **Test Save & Close:** After several edits, click "Save & Close". Re-open the main image viewer and confirm the final edited image is displayed.

### Photo Remix Workflow
- [ ] **Check Activity Log:** Perform a full Photo Remix workflow (upload, generate ideas, generate final image).
- [ ] **Verify Log Entries:** Open the Activity Log and confirm that there are entries for "Remix started," "Analysis complete," "Generation successful," etc., for each step.

### Concurrent Operation Prevention
- [ ] **Sticker Studio:**
    - [ ] Start an image upload.
    - [ ] While the "Pre-analyzing..." message is visible, **verify** that the drag-and-drop area and file input button are disabled and do not respond to clicks or drops.
- [ ] **Wallpaper Studio:**
    - [ ] Navigate to the Wallpaper tab.
    - [ ] Start an image import.
    - [ ] While the "Processing image..." message is visible, **verify** that the import button/area is disabled.
- [ ] **Photo Remix Studio:**
    - [ ] Navigate to the Photo Remix tab.
    - [ ] Start a photo upload.
    - [ ] While the "Uploading photo..." message is visible, **verify** that the upload area is disabled.
- [ ] **Cross-Workflow Check:**
    - [ ] Start an image upload in the Sticker Studio.
    - [ ] Quickly switch to the Wallpaper Studio.
    - [ ] **Verify** that the "Import Character" button is disabled because the `isPreAnalyzing` flag is globally true.

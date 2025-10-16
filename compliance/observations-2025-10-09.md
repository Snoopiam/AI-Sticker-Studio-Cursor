# Compliance Audit Observations — 2025-10-09

## Summary
- The app follows a centralized `useReducer` architecture with persistent state and a typed `AppContext`.
- API key correctly sourced from `process.env.API_KEY`. Resilience wrappers (`safeApiCall`, circuit breaker, rate limiter, dedup, retries) are in place.
- Credit deductions and refunds are consistently implemented with clear logging.
- JSDoc and Tailwind usage are widespread; UX feedback (loading/errors) is present.

## High-Priority Findings
1) Image Generation Model Selection
- Expected per policy: Use `imagen-4.0-generate-001` for new image generation; use `gemini-2.5-flash-image-preview` for image editing; use `gemini-2.5-flash` for text/JSON.
- Observation: No occurrences of `imagen-4.0-generate-001` detected. Generation paths appear to use Gemini models.
- Action: Route pure generation (e.g., sticker/wallpaper creation) through `imagen-4.0-generate-001`. Keep editing on `gemini-2.5-flash-image-preview` and text/JSON on `gemini-2.5-flash`.

## Medium-Priority Observations
2) AiCore Usage Consistency
- Expectation: Use `<AiCore />` for primary loading/placeholder states.
- Observation: Loading UX exists (messages/actions), but consistent `<AiCore />` usage across all major workflows not fully verified.
- Action: Confirm and standardize `<AiCore />` usage during blocking operations across Sticker, Wallpaper, Remix, and Calibration flows.

## Low-Priority Observations
3) Prompt Persona Consistency
- Expectation: Prefer explicit persona and strict rule hierarchy for identity preservation.
- Observation: Prompts are explicit, but persona usage varies.
- Action: Prepend a consistent persona (e.g., “You are a world-class digital artist…”) to complex prompts; ensure identity rules are top-priority.

## Strengths Confirmed
- Centralized immutable state with typed reducers and actions.
- Robust API resilience via `safeApiCall` orchestration.
- Reliable credit accounting with transaction typing and audit trail.
- Dev Log system present and loaded on startup.

## Suggested Next Steps (Permission Required Before Edits)
- Implement model selection correction for generation calls.
- Audit and standardize `<AiCore />` loading surfaces.
- Normalize persona scaffolding in key prompts.

## References (Indicative)
- State: `App.tsx`, `reducers/rootReducer.ts`, `context/AppContext.tsx`
- API: `services/geminiService.ts`, `utils/apiUtils.ts`
- Credits: `reducers/coreReducer.ts`, hooks under `hooks/`
- Dev Log: `services/devLogger.ts`



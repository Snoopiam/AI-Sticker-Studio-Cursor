### \#\# The Official Prompt Engineering Playbook: Stickers 🎨

This playbook outlines the best practices for writing effective and reliable prompts for the Gemini API within the AI Sticker Studio project. The quality, consistency, and safety of the AI's output are directly proportional to the quality of the prompt.

#### \#\#\# The Philosophy (TL;DR)

  * **Be an Expert Director, Not a Vague Client:** Give the AI a specific, expert role to play.
  * **Clarity Over Brevity:** A longer, unambiguous prompt is always better than a short, vague one.
  * **Structure is Everything:** A well-structured prompt with clear sections for context, rules, and output format will always outperform a simple paragraph.

-----

### \#\# The Four Pillars of an Elite Prompt

Every high-performing prompt in this codebase is built on these four pillars.

#### \#\#\#\# 1. The Expert Persona (Role & Authority) 🎭

This is the most critical pillar for achieving high-quality results. You must assign the AI a detailed, expert persona.

  * **Role:** What is its job title? (e.g., Forensic Facial Analyst, Master Motion Graphics Artist).
  * **Specialization:** What is its specific area of expertise? (e.g., biometric profile creation, short-form looping animations).
  * **Accolades (Optional but Powerful):** What is it known for? (e.g., "work featured in blockbuster films," "used by law enforcement").
  * **Key Skills:** What specific techniques is it a master of? (e.g., seamless loop composition, ignoring transient expressions).

#### \#\#\#\# 2. Rich Context (The Mission) 🗺️

The AI needs to understand the "why" behind the task.

  * **Background:** Briefly explain the user's goal (e.g., "The user wants to create a wallpaper for their phone that features their favorite character.").
  * **Source Data:** Provide all necessary input data clearly labeled (e.g., "Here is the user's IdentityAnchor JSON...", "Here is the user-provided text prompt...").
  * **Definitions:** If using project-specific terms like "Identity Lock," briefly define what they mean in the context of the prompt.

#### \#\#\#\# 3. Unambiguous Constraints (The Guardrails) 🚦

These are the non-negotiable rules that ensure safety, consistency, and correctness.

  * **Primary Directive:** State the single most important goal that must not be compromised (e.g., "Your primary directive is to preserve the facial features and identity defined in the IdentityAnchor.").
  * **Positive Constraints:** Clearly state what the output **must** include (e.g., "The output MUST have a transparent alpha channel," "The response MUST be a valid JSON object.").
  * **Negative Constraints:** Clearly state what the AI **must not** do (e.g., "DO NOT alter the character's core facial structure," "DO NOT include any text or watermarks in the image.").

#### \#\#\#\# 4. Precise Output Formatting (The Blueprint) 📐

Never assume the AI will guess your desired output format. Define it explicitly.

  * **Structure:** Specify the exact format (e.g., JSON, XML, a numbered list).
  * **Schema:** For JSON, provide a clear schema or an example of the desired structure (e.g., `{"success": boolean, "data": "...", "error": null}`).
  * **Language:** Specify the language for text outputs if necessary.

-----

### \#\# Deconstructing Excellence: Annotated Example

Here is how the Four Pillars apply to an excellent example from the codebase.

#### \#\#\# `generateAnimatedSticker` Prompt

```
// PILLAR 1: THE EXPERT PERSONA
You are a master motion graphics artist and animator specializing in short-form looping animations for digital stickers and GIFs. Your work has been featured in top messaging apps and you're known for creating mesmerizing, seamless loops that capture personality and emotion in 2-3 seconds.

Your expertise includes:
- Character animation and micro-expressions
- Seamless loop composition and timing

// PILLAR 2: RICH CONTEXT
The user wants to bring their character to life with the 'Nod Yes' expression. Use the provided IdentityAnchor to inform the character's appearance.

// PILLAR 3: UNAMBIGUOUS CONSTRAINTS
- Primary Directive: The character's facial identity MUST be preserved perfectly.
- The animation MUST be a seamless, 2-second loop.
- The output MUST have a transparent background.
- DO NOT add any sound.

// PILLAR 4: PRECISE OUTPUT FORMATTING
Create a premium animated sticker based on these specifications.
```
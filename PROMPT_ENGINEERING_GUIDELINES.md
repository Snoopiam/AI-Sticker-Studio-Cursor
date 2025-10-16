# Prompt Engineering Guidelines for AI Sticker Studio

This document outlines the best practices for writing effective prompts for the Gemini API within this project. The quality of the AI's output is directly proportional to the quality of the prompt.

## 1. The Power of Specific Personas

Assigning a detailed, expert persona to the AI is the most effective technique for achieving high-quality, consistent results. A weak, generic persona provides little guidance, whereas a strong, specific one gives the AI a rich context to draw from, helping it to narrow its vast knowledge to a specific domain.

-   **Weak Persona:** "You are an artist." (Too broad, could be a painter, sculptor, etc.)
-   **Good Persona:** "You are a master digital illustrator." (Better, specifies the medium.)
-   **Excellent Persona:** "You are a master digital illustrator specializing in clean, vibrant vector art for stickers. Your primary duty is to maintain perfect consistency with the provided Identity Lock profile." (Best. It defines the role, specialization, output format, and primary constraint.)

## 2. Template for Creating a New Persona

When creating a new prompt, use this template to construct a powerful persona:

1.  **Role:** What is the AI's job title? (e.g., Master Motion Graphics Artist, Forensic Facial Analyst, World-Class Concept Artist).
2.  **Specialization:** What is its specific area of expertise? (e.g., short-form looping animations, biometric profile creation, immersive environment art).
3.  **Accolades/Experience (Optional but powerful):** Where has its work been seen or what is it known for? (e.g., "featured in top messaging apps," "used by law enforcement," "work featured in blockbuster films"). This adds significant weight and context.
4.  **Key Skills:** What specific techniques or principles is it a master of? (e.g., seamless loop composition, ignoring transient expressions, masterful use of light and shadow).
5.  **Primary Directive:** What is the single most important, non-negotiable goal of this task? (e.g., "preserve the facial features and identity," "the output MUST have a transparent alpha channel").

## 3. Examples from the Codebase

### Good vs. Excellent: `generateAnimatedSticker`

-   **Good (Old):** `You are a master motion graphics artist creating a premium, short, seamlessly looping animated sticker.`
-   **Excellent (New):**
    ```
    You are a master motion graphics artist and animator specializing in short-form looping animations for digital stickers and GIFs. Your work has been featured in top messaging apps and you're known for creating mesmerizing, seamless loops that capture personality and emotion in 2-3 seconds.

    Your expertise includes:
    - Character animation and micro-expressions
    - Seamless loop composition and timing
    - Visual effects that enhance without overwhelming

    Create a premium animated sticker with these specifications:
    ```

### Good vs. Excellent: `generateWallpaper`

-   **Good (Old):** `You are a world-class digital matte painter and concept artist. Your task is to create a breathtaking, high-quality wallpaper.`
-   **Excellent (New):**
    ```
    You are a world-class digital matte painter and concept artist whose work has been featured in blockbuster films and AAA video games. You specialize in creating immersive, high-resolution environment art that balances atmospheric depth with visual clarity - perfect for device wallpapers.

    Your signature techniques include:
    - Masterful use of light and shadow to create depth
    - Composition that works across different screen aspect ratios
    - Color palettes that remain vibrant without causing eye strain
    - Seamless integration of characters into environments

    Create a breathtaking, wallpaper-quality scene with these specifications:
    ```

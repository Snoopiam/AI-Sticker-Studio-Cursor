/**
 * @file constants/expressions.ts
 * @description This file defines the master list of all available expressions for sticker generation.
 * Each expression includes a name, a descriptive prompt for the AI, an icon component, and a category for UI grouping.
 */

import React from 'react';
import type { Expression } from '../types/types';
// Import all icon components used for the expression selection grid.
import {
    HeyIcon, ThumbsUpIcon, PeaceSignIcon, FistbumpIcon, ShrugIcon, PunchForwardIcon, HeartHandsIcon, FacepalmIcon,
    WinkIcon, LaughingIcon, SmirkIcon, ThinkingIcon, SadIcon, AngryIcon, InLoveIcon,
    WassupIcon, MindBlownIcon, DealWithItIcon, EatingPopcornIcon,
    SippingTeaIcon, CoffeeIcon, ReadingBookIcon, HoldsSignIcon,
    NodIcon, HighFiveIcon, WorkingOnLaptopIcon, GamingIcon, CelebratingIcon, HeroicPoseIcon, CrossedArmsIcon, GaspIcon, ShockedIcon,
    SunIcon, MoonIcon, PoseFromImageIcon
} from './expressionIcons';


/** 
 * @const COMPOSITION_HANDLE
 * @description A constant string appended to expression descriptions that involve hands or arms.
 * It serves as an explicit instruction to the AI to ensure that these limbs are correctly
 * framed and visible, especially when using a "Headshot / Bust" composition, preventing
 * awkward or incomplete poses.
 */
const COMPOSITION_HANDLE = "IMPORTANT: If using headshot composition, ensure hands/arms are visible in frame.";


/**
 * @const EXPRESSIONS
 * @description The master array of all selectable expressions. This list is the single source of truth
 * for populating the expression selection UI in the Sticker Studio. Each object contains:
 * - `name`: A short, unique identifier.
 * - `category`: For grouping in the UI.
 * - `description`: The detailed text that is injected into the AI generation prompt.
 * - `icon`: The React component for the UI icon.
 * - `speechBubble`: Optional default text for a speech bubble.
 * 
 * Note: `React.createElement` is used to instantiate icon components because this is a `.ts` file, not `.tsx`.
 */
export const EXPRESSIONS: Expression[] = [
    // --- Greetings ---
    { name: 'HEY', category: 'Greetings', description: `enthusiastically waving hello with a big, open-mouthed, friendly smile. One hand is raised and open, gesturing towards the viewer. The expression is warm and inviting. ${COMPOSITION_HANDLE}`, icon: React.createElement(HeyIcon) },
    { name: 'Nod', category: 'Greetings', description: `giving a slight, respectful nod of acknowledgement, head tilted down just a bit. The expression is neutral to friendly, with a small, polite smile and eyes looking directly at the viewer.`, icon: React.createElement(NodIcon) },
    { name: 'High Five', category: 'Greetings', description: `raising one hand high for an energetic high-five, with an excited and joyful expression, mouth open in a cheer. The palm is open and facing the viewer, anticipating a connection. ${COMPOSITION_HANDLE}`, icon: React.createElement(HighFiveIcon) },
    { name: 'FISTBUMP', category: 'Greetings', description: `extending a fist forward for a cool, friendly fistbump, elbow slightly bent. The fist is aimed directly at the viewer, and the character has a confident grin and a slight nod. ${COMPOSITION_HANDLE}`, icon: React.createElement(FistbumpIcon) },
    { name: 'Morning', category: 'Greetings', description: `greeting the day with a bright, cheerful smile, holding a steaming cup of coffee or tea with both hands. The character looks refreshed and content, looking directly at the viewer. ${COMPOSITION_HANDLE}`, icon: React.createElement(SunIcon), speechBubble: 'Morning!' },
    { name: 'Good Afternoon', category: 'Greetings', description: `giving a pleasant and friendly wave with an open palm towards the viewer. The character has a relaxed, happy smile and a slight, welcoming head tilt. ${COMPOSITION_HANDLE}`, icon: React.createElement(HeyIcon), speechBubble: 'Good Afternoon' },
    { name: 'Good Evening', category: 'Greetings', description: `offering a calm, warm smile under a soft, gentle light, suggesting a twilight or evening setting. The expression is peaceful and serene, looking directly at the viewer.`, icon: React.createElement(MoonIcon), speechBubble: 'Good Evening' },
    { name: 'Love You', category: 'Greetings', description: `making a heart shape with both hands held over their chest, looking at the viewer with a warm, sincere, and deeply loving expression, eyes soft and smiling.`, icon: React.createElement(HeartHandsIcon), speechBubble: 'Love You' },
    { name: 'Love you more', category: 'Greetings', description: `making a heart shape with both hands, with an even warmer and more effusive loving expression, perhaps with slightly blushing cheeks and sparkling eyes, looking directly at the viewer.`, icon: React.createElement(HeartHandsIcon), speechBubble: 'Love you more' },
    { name: 'Hi Beautiful', category: 'Greetings', description: `giving a charming, playful wink with one eye while offering a confident, handsome smile directly to the viewer. The head is tilted slightly.`, icon: React.createElement(WinkIcon), speechBubble: 'Hi Beautiful' },
    { name: 'Hi Love', category: 'Greetings', description: `waving hello with a soft, gentle smile and warm, loving eyes that convey deep affection, one hand raised in a gentle wave. ${COMPOSITION_HANDLE}`, icon: React.createElement(HeyIcon), speechBubble: 'Hi Love' },

    // --- Gestures ---
    { name: '(Pose from image)', category: 'Gestures', description: 'Use the exact pose and expression from the provided photo.', icon: React.createElement(PoseFromImageIcon) },
    { name: 'Thumbs Up', category: 'Gestures', description: `giving an enthusiastic thumbs up with a confident smile, right arm extended forward at chest height with thumb pointing upward, looking directly at viewer with an excited expression. ${COMPOSITION_HANDLE}`, icon: React.createElement(ThumbsUpIcon) },
    { name: 'PEACE SIGN', category: 'Gestures', description: `making a classic V-for-victory peace sign with their fingers, held up near their face. Accompanied by a cheerful and friendly expression and a slight, playful head tilt. ${COMPOSITION_HANDLE}`, icon: React.createElement(PeaceSignIcon)},
    { name: 'Heart-hands', category: 'Gestures', description: `forming a perfect heart shape with both hands, held out in front of their chest towards the viewer, with a sincere and happy expression, eyes crinkling with joy. ${COMPOSITION_HANDLE}`, icon: React.createElement(HeartHandsIcon) },
    
    // --- Emotions ---
    { name: 'Laughing', category: 'Emotions', description: `laughing hysterically, with their head thrown back, eyes squeezed shut in mirth, and a wide-open mouth. Cartoonish tears of joy are streaming down their face.`, icon: React.createElement(LaughingIcon) },
    { name: 'In Love', category: 'Emotions', description: `completely smitten, with large, glowing cartoon hearts for eyes and a blissful, dreamy smile. Hands are clasped to their chest in pure adoration, looking slightly upwards.`, icon: React.createElement(InLoveIcon) },
    { name: 'Sad', category: 'Emotions', description: `looking utterly downcast with a sad, quivering frown. Large, glistening cartoon tears well up in their big, sorrowful eyes, with one tear rolling down their cheek.`, icon: React.createElement(SadIcon) },
    { name: 'Angry', category: 'Emotions', description: `fuming with rage, with heavily furrowed brows, a determined scowl, and clenched teeth. Cartoonish steam is comically puffing out of their ears, cheeks puffed out.`, icon: React.createElement(AngryIcon) },

    // --- Reactions ---
    { name: 'Facepalm', category: 'Reactions', description: `doing an epic facepalm, with the palm of one hand pressed firmly against their forehead in disbelief. Their eyes are closed in clear exasperation, and their head is tilted slightly down. ${COMPOSITION_HANDLE}`, icon: React.createElement(FacepalmIcon) },
    { name: 'Shrug', category: 'Reactions', description: `shrugging with both shoulders raised high and palms facing up in a classic 'I don't know' gesture. The expression is puzzled or indifferent, with raised eyebrows and a slightly open mouth. ${COMPOSITION_HANDLE}`, icon: React.createElement(ShrugIcon) },
    { name: 'Mind Blown', category: 'Reactions', description: `an exaggerated, explosive mind-blown expression. The top of their head comically explodes with vibrant comic-book style energy, stars, and patterns, while their face remains intact with a look of utter shock and awe, jaw dropped open.`, icon: React.createElement(MindBlownIcon) },
    { name: 'Eating Popcorn', category: 'Reactions', description: `intently watching drama unfold while dramatically and eagerly eating popcorn from a large bucket held in their lap. Their eyes are wide with fascination, leaning forward slightly. ${COMPOSITION_HANDLE}`, icon: React.createElement(EatingPopcornIcon) },
    { name: 'Sipping Tea', category: 'Reactions', description: `slyly sipping tea from a delicate teacup with one pinky finger extended, giving a knowing, gossipy side-eye glance to the viewer, a small smirk on their lips. ${COMPOSITION_HANDLE}`, icon: React.createElement(SippingTeaIcon) },
    
     // --- Poses ---
    { name: 'Wink', category: 'Poses', description: `giving a playful, charming wink with their left eye directly at the viewer, accompanied by a confident, slightly lopsided smile and a raised eyebrow.`, icon: React.createElement(WinkIcon) },
    { name: 'Smirk', category: 'Poses', description: `a mischievous and confident smirk with one corner of the mouth raised, and one eyebrow slightly arched. The character is looking cunningly at the viewer, perhaps with a slight head tilt.`, icon: React.createElement(SmirkIcon) },
    { name: 'Thinking', category: 'Poses', description: `in a classic thoughtful pose with an index finger and thumb resting on their chin, looking upwards and to the side as if deep in concentration. A single, glowing lightbulb appears above their head.`, icon: React.createElement(ThinkingIcon) },
    { name: 'Heroic Pose', category: 'Poses', description: `standing proudly in a classic superhero pose with hands firmly on hips, chest puffed out, and a confident, determined look on their face, looking off into the distance as if watching over a city.`, icon: React.createElement(HeroicPoseIcon) },
    { name: 'Crossed Arms', category: 'Poses', description: `standing with arms confidently crossed over their chest, looking serious, skeptical, or unimpressed. Their expression is neutral or slightly frowning, with a firm stance. ${COMPOSITION_HANDLE}`, icon: React.createElement(CrossedArmsIcon) },
    
    // --- Activities ---
    { name: 'Working on Laptop', category: 'Activities', description: `sitting and focused on a laptop, typing intently with a look of deep concentration. Their fingers are blurred slightly from rapid typing, and the screen of the laptop casts a slight glow on their face. ${COMPOSITION_HANDLE}`, icon: React.createElement(WorkingOnLaptopIcon) },
    { name: 'Gaming', category: 'Activities', description: `intensely playing a video game with a controller held tightly in their hands, wearing large headphones. They are leaning forward with a look of focused excitement or frustration, tongue slightly sticking out. ${COMPOSITION_HANDLE}`, icon: React.createElement(GamingIcon) },
    { name: 'Celebrating', category: 'Activities', description: `cheering with pure joy and excitement, arms raised triumphantly in the air, throwing colorful confetti with a huge, happy, open-mouthed smile. ${COMPOSITION_HANDLE}`, icon: React.createElement(CelebratingIcon) },
    { name: 'Reading Book', category: 'Activities', description: `happily engrossed in reading a thick, open book, with a thoughtful or captivated expression on their face. They are completely lost in the story, oblivious to their surroundings. ${COMPOSITION_HANDLE}`, icon: React.createElement(ReadingBookIcon) },
    
    // --- Expressions of Surprise ---
    { name: 'Gasp', category: 'Expressions of Surprise', description: `gasping dramatically in surprise with a hand covering their mouth, eyes wide open with shock and disbelief. Their whole body is recoiling slightly. ${COMPOSITION_HANDLE}`, icon: React.createElement(GaspIcon) },
    { name: 'Shocked', category: 'Expressions of Surprise', description: `a comical, jaw-dropped expression of utter shock. Their eyes are popping out cartoonishly, and their body is frozen stiff in a look of complete disbelief.`, icon: React.createElement(ShockedIcon) },
    
    // --- Props & Items ---
    { name: 'Deal With It', category: 'Props & Items', description: `a cool, smug expression as a pair of pixelated 'deal with it' sunglasses dramatically slides down from above onto their face. The character is looking directly at the viewer with a confident smirk. ${COMPOSITION_HANDLE}`, icon: React.createElement(DealWithItIcon) },
    { name: 'Coffee', category: 'Props & Items', description: `holding a large, steaming mug of coffee with both hands close to their face, inhaling the aroma with a look of cozy contentment and closed eyes. ${COMPOSITION_HANDLE}`, icon: React.createElement(CoffeeIcon) },
    { name: 'Holds Sign', category: 'Props & Items', description: `holding up a large blank sign or placard with both hands, with a neutral and inviting expression, looking directly at the viewer, ready for custom text. ${COMPOSITION_HANDLE}`, icon: React.createElement(HoldsSignIcon) },
    { name: 'Punch-Forward', category: 'Props & Items', description: `punching straight forward towards the camera with a look of intense determination. The fist is large and foreshortened, creating a dynamic, action-packed effect, with motion lines indicating speed. ${COMPOSITION_HANDLE}`, icon: React.createElement(PunchForwardIcon) },
    { name: 'WAZZZAAA', category: 'Props & Items', description: `the iconic, goofy 'Wassup' face, with their tongue sticking out, eyes wide in a playful, exaggerated expression, and a hand cupped to their mouth as if shouting at the viewer.`, icon: React.createElement(WassupIcon) },
];
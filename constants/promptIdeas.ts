/**
 * @file promptIdeas.ts
 * @description Contains a curated list of creative prompt ideas for the "Inspire Me" feature.
 * Each idea is a partial `Settings` object that can be applied to the application state
 * to give users a fun and artistically coherent starting point for text-to-image generation.
 * The combinations of styles have been pre-audited to ensure they are valid according to
 * the `STYLE_COMPATIBILITY` map in `constants.ts`.
 */

import type { Settings } from '../types';

/**
 * @const PROMPT_IDEAS
 * @description A collection of creative starting points for the "Inspire Me" feature.
 * This array provides pre-packaged, high-quality prompt ideas that showcase the
 * diversity of styles the application can produce. When a user clicks "Inspire Me,"
 * one of these partial `Settings` objects is randomly selected and applied to the state.
 */
export const PROMPT_IDEAS: Partial<Settings>[] = [
    {
        subject: "A mischievous raccoon hacker",
        keyCharacteristics: "wearing a hoodie, typing on a glowing laptop, with a playful smirk",
        style: "Cartoon Vector",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Cel-shading",
    },
    {
        subject: "A serene, meditating octopus",
        keyCharacteristics: "levitating with its tentacles crossed, with a calm, blissful expression",
        style: "Kawaii",
        palette: "Pastel",
        lineStyle: "Smooth",
        shadingStyle: "Gradient",
    },
    {
        subject: "A wizard cat casting a spell",
        keyCharacteristics: "wearing a pointy hat, holding a glowing wand, with sparks flying everywhere",
        style: "Pop",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Flat",
    },
    {
        subject: "A samurai pizza slice",
        keyCharacteristics: "wielding two pepperoni katanas, looking determined and delicious",
        style: "Lineart",
        palette: "Monochrome",
        lineStyle: "Hand-drawn",
        shadingStyle: "None",
    },
    {
        subject: "A friendly ghost offering a flower",
        keyCharacteristics: "shyly holding out a single glowing daisy, with a gentle smile",
        style: "Watercolor",
        palette: "Pastel",
        lineStyle: "Thin",
        shadingStyle: "Gradient",
    },
    {
        subject: "A steampunk Corgi",
        keyCharacteristics: "wearing brass goggles and a tiny leather vest, looking adventurous",
        style: "Cartoon Vector",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Cel-shading",
    },
    {
        subject: "An astronaut floating with a giant donut",
        keyCharacteristics: "taking a big bite out of a sprinkle donut in zero-gravity",
        style: "Flat",
        palette: "Vibrant",
        lineStyle: "Smooth",
        shadingStyle: "Flat",
    },
    {
        subject: "A punk rock grandma",
        keyCharacteristics: "with a pink mohawk, knitting furiously with skull-tipped needles",
        style: "Pencil Sketch",
        palette: "Monochrome",
        lineStyle: "Hand-drawn",
        shadingStyle: "None",
    },
    {
        subject: "A knight riding a giant snail",
        keyCharacteristics: "holding a lance, looking determined as the snail slowly charges forward",
        style: "Oil Painting",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Gradient",
    },
    {
        subject: "A cheerful cactus giving a thumbs up",
        keyCharacteristics: "wearing a small sombrero, with one of its arms shaped into a thumbs-up",
        style: "Kawaii",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Cel-shading",
    },
    {
        subject: "A detective otter",
        keyCharacteristics: "wearing a trench coat and a fedora, examining a clue with a magnifying glass",
        style: "Tritone",
        palette: "Monochrome",
        lineStyle: "Smooth",
        shadingStyle: "Flat",
    },
    {
        subject: "A robot chef juggling vegetables",
        keyCharacteristics: "with multiple arms, skillfully tossing carrots, broccoli, and tomatoes",
        style: "WPAP",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Flat",
    },
     {
        subject: "A bookworm dragon",
        keyCharacteristics: "curled up on a huge pile of books, wearing reading glasses and looking studious",
        style: "Pencil Sketch",
        palette: "Pastel",
        lineStyle: "Hand-drawn",
        shadingStyle: "None",
    },
    {
        subject: "A zombie barista",
        keyCharacteristics: "groaning while expertly pouring latte art that looks like a brain",
        style: "Dotwork",
        palette: "Monochrome",
        lineStyle: "Thin",
        shadingStyle: "None",
    },
    {
        subject: "A wise old owl reading a book by candlelight",
        keyCharacteristics: "perched on a stack of ancient tomes, wearing small round spectacles, with a thoughtful expression",
        style: "Oil Painting",
        palette: "Monochrome",
        lineStyle: "Smooth",
        shadingStyle: "Gradient",
    },
    {
        subject: "A happy little robot tending to a garden",
        keyCharacteristics: "holding a tiny watering can, surrounded by glowing, bioluminescent flowers, with a friendly digital smile",
        style: "Flat",
        palette: "Vibrant",
        lineStyle: "Smooth",
        shadingStyle: "Flat",
    },
    {
        subject: "A majestic lion wearing a crown",
        keyCharacteristics: "a detailed portrait, with an intricate crown on its head and a noble, powerful gaze",
        style: "Pencil Sketch",
        palette: "Monochrome",
        lineStyle: "Hand-drawn",
        shadingStyle: "None",
    },
    {
        subject: "Animals having a whimsical tea party",
        keyCharacteristics: "a fox, a badger, and a rabbit sitting around a small table in the woods, sipping tea from tiny cups",
        style: "Watercolor",
        palette: "Pastel",
        lineStyle: "Thin",
        shadingStyle: "Gradient",
    },
    {
        subject: "A cyberpunk ninja frog",
        keyCharacteristics: "wearing a high-tech visor, leaping between glowing neon signs in a rainy city alley",
        style: "Pop",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Cel-shading",
    },
    {
        subject: "A sleepy sloth hugging a crescent moon",
        keyCharacteristics: "curled up and dozing peacefully on a glowing crescent moon, floating in a starry sky",
        style: "Kawaii",
        palette: "Pastel",
        lineStyle: "Smooth",
        shadingStyle: "Gradient",
    },
    {
        subject: "An anatomical drawing of a phoenix",
        keyCharacteristics: "a detailed, technical illustration showing the skeletal and muscular structure of the mythical bird, wings outstretched",
        style: "Lineart",
        palette: "Monochrome",
        lineStyle: "Thin",
        shadingStyle: "None",
    },
    {
        subject: "A geometric abstract portrait of a wolf",
        keyCharacteristics: "the wolf's head constructed from sharp, colorful polygons and triangles, looking fierce and modern",
        style: "WPAP",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Flat",
    },
    {
        subject: "An ethereal jellyfish in the deep ocean",
        keyCharacteristics: "glowing with an inner light, trailing long, delicate tentacles, surrounded by darkness and tiny particles",
        style: "Dotwork",
        palette: "Pastel",
        lineStyle: "Thin",
        shadingStyle: "None",
    },
    {
        subject: "A vintage travel poster for a city on Venus",
        keyCharacteristics: "featuring retro-futuristic architecture under a swirling orange sky, with the text 'Visit Venus!' in a stylish font",
        style: "Tritone",
        palette: "Vibrant",
        lineStyle: "Bold",
        shadingStyle: "Flat",
    }
];
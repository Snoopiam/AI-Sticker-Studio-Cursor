/**
 * @file constants/wallpaperPresets.ts
 * @description Defines the data structures and constant values for the Wallpaper Studio feature,
 * including available sizes, a comprehensive list of pre-configured presets, and advanced style options.
 */

/**
 * @interface WallpaperSize
 * @description Defines the properties of a selectable wallpaper size option. Includes both standard
 * aspect ratios and specific device resolutions.
 */
export interface WallpaperSize {
    /** @property {string} name - The user-facing name for the size option (e.g., 'Phone (9:16)'). */
    name: string;
    /** @property {string} aspectRatio - The aspect ratio string (e.g., '9:16'), used by some generation models. */
    aspectRatio: string;
    /** @property {number | undefined} width - The explicit width in pixels for specific device presets. */
    width?: number;
    /** @property {number | undefined} height - The explicit height in pixels for specific device presets. */
    height?: number;
    /** @property {number | undefined} dpi - The dots per inch, for high-resolution presets. */
    dpi?: number;
}

/**
 * @interface WallpaperPreset
 * @description Defines the structure of a pre-configured wallpaper prompt, including metadata for
 * categorization, filtering, and providing creative guidance.
 */
export interface WallpaperPreset {
    /** @property {string} id - A unique identifier for the preset. */
    id: string;
    /** @property {string} category - The category for UI grouping. */
    category: 'Cars' | 'Gods' | 'Mythology' | 'DC Heroes' | 'Marvel Heroes' | 'Nature' | 'Space' | 'Fantasy' | 'Urban' | 'Abstract' | 'Seasonal' | 'Sci-Fi' | 'Vintage';
    /** @property {string} name - The user-facing name of the preset (e.g., 'Cyberpunk Neon City'). */
    name: string;
    /** @property {string} prompt - The detailed text prompt to be sent to the AI. */
    prompt: string;
    /** @property {string | undefined} thumbnailPrompt - An optional, simplified prompt for generating a thumbnail. */
    thumbnailPrompt?: string;
    /** @property {string[] | undefined} hdOptimized - An optional array of device keys for which this preset is specifically optimized. */
    hdOptimized?: string[];
    /** @property {string | undefined} lesson - Optional metadata for educational or mythological presets. */
    lesson?: string;
    /** @property {string | undefined} character - Optional metadata indicating the primary character in the preset. */
    character?: string;
    /** @property {string} mood - A descriptor of the preset's mood, for filtering or recommendations. */
    mood: string;
    /** @property {string} intensity - A descriptor of the preset's visual intensity. */
    intensity: string;
}

/** @description Defines the available blending modes for how characters are integrated into a wallpaper scene. */
export type BlendingMode = 'Natural' | 'Artistic' | 'Dramatic' | 'Ethereal';
/** @description Defines the available lighting styles applied to characters in a wallpaper scene. */
export type LightingStyle = 'Match Background' | 'Enhance Character' | 'Cinematic' | 'Studio';
/** @description Defines the available quality levels for wallpaper generation. */
export type QualityLevel = 'Standard' | 'Premium' | 'Ultra';


// --- CONSTANT ARRAYS for populating UI dropdowns ---

/** @description An array of all available wallpaper sizes, from standard aspect ratios to specific device resolutions. */
export const WALLPAPER_SIZES: WallpaperSize[] = [
    { name: 'Phone (9:16)', aspectRatio: '9:16' },
    { name: 'Desktop (16:9)', aspectRatio: '16:9' },
    { name: 'Tablet (4:3)', aspectRatio: '4:3' },
    { name: 'Square (1:1)', aspectRatio: '1:1' },
    { name: 'Ultrawide (21:9)', aspectRatio: '21:9' },
    { name: 'Galaxy Fold 7 Unfolded', aspectRatio: '6:5', width: 2176, height: 1812 },
    { name: 'Galaxy Fold 7 Cover', aspectRatio: '22:10', width: 968, height: 2176 },
    { name: 'Galaxy Book 5 Pro 16"', aspectRatio: '16:10', width: 2880, height: 1800 },
    { name: '4K Ultra HD', aspectRatio: '16:9', width: 3840, height: 2160 },
    { name: '8K Ready', aspectRatio: '16:9', width: 7680, height: 4320 },
];

/** @description An array of all available character blending modes. */
export const BLENDING_MODES: BlendingMode[] = ['Natural', 'Artistic', 'Dramatic', 'Ethereal'];
/** @description An array of all available character lighting styles. */
export const LIGHTING_STYLES: LightingStyle[] = ['Match Background', 'Enhance Character', 'Cinematic', 'Studio'];
/** @description An array of all available wallpaper quality levels. */
export const QUALITY_LEVELS: QualityLevel[] = ['Standard', 'Premium', 'Ultra'];

/**
 * @const WALLPAPER_PRESETS
 * @description The master array of all pre-configured wallpaper prompts, categorized for easy browsing in the UI.
 * This serves as a rich library of creative starting points for users.
 */
export const WALLPAPER_PRESETS: WallpaperPreset[] = [
    // --- SCI-FI ---
    { id: 'cyberpunk-neon-city', name: 'Cyberpunk Neon City', category: 'Sci-Fi', prompt: 'A sprawling cyberpunk metropolis at night, towering skyscrapers covered in holographic billboards and neon signs in pink, blue, and purple. Flying cars streak through the air between buildings. Rain-slicked streets reflect the colorful lights. Detailed, cinematic, moody atmosphere.', thumbnailPrompt: 'Miniature cyberpunk city scene with neon lights', mood: 'futuristic', intensity: 'dramatic' },
    { id: 'deep-space-station', name: 'Deep Space Station', category: 'Sci-Fi', prompt: 'Inside a massive orbital space station with floor-to-ceiling windows showing Earth in the background. Zero-gravity environment with floating objects. Sleek metallic surfaces, holographic displays, and soft blue interior lighting. Futuristic, realistic, awe-inspiring.', thumbnailPrompt: 'Space station interior with Earth view', mood: 'awe-inspiring', intensity: 'serene' },

    // --- GODS & DEITIES ---
    { id: 'god_shiva_cosmic', name: 'Lord Shiva - Cosmic Dance', category: 'Gods', prompt: 'Lord Shiva in his cosmic Nataraja form, dancing within a ring of cosmic fire, multiple arms in perfect mudras, third eye glowing with divine light, sacred Ganga flowing from his hair, Himalayan mountain backdrop, ultra HD cinematic lighting, divine aura, blue skin with ash markings.', hdOptimized: ['fold7', 'galaxybook', '4k'], mood: 'divine', intensity: 'dramatic' },
    { id: 'god_hanuman_strength', name: 'Lord Hanuman - Divine Strength', category: 'Gods', prompt: 'Lord Hanuman in a powerful flying pose carrying the Sanjeevani mountain, muscular divine form, orange/red glowing skin, flowing hair, mace (gada) in hand, epic sunset sky with clouds, devotional expression, ultra HD rendering, divine energy emanating.', mood: 'powerful', intensity: 'dramatic' },
    { id: 'god_vishnu_cosmic', name: 'Lord Vishnu - Cosmic Protector', category: 'Gods', prompt: 'Lord Vishnu resting on the cosmic serpent Shesha in the ocean of milk (Kshira Sagara), four arms holding conch shell (Panchajanya), discus (Sudarshana Chakra), mace (Kaumodaki) and lotus flower (Padma), magnificent crown and jewelry, serene blue skin, peaceful expression, cosmic background with stars and nebulae, ultra HD divine artwork.', mood: 'serene', intensity: 'dramatic' },
    
    // --- MYTHOLOGICAL TEACHINGS ---
    { id: 'myth_arjuna_krishna', name: 'Bhagavad Gita Teachings', category: 'Mythology', prompt: 'Lord Krishna counseling Arjuna on the battlefield of Kurukshetra, a divine discourse moment from the Bhagavad Gita, glowing Krishna with a peacock feather in his crown, Arjuna listening intently, magnificent war chariots in the background, golden divine light, capturing the profound teaching moment, ultra HD cinematic.', lesson: 'Dharma and Duty', mood: 'profound', intensity: 'spiritual' },
    { id: 'myth_hanuman_devotion', name: 'Devotion of Hanuman', category: 'Mythology', prompt: 'Hanuman tearing open his chest to reveal Lord Ram and Sita residing in his heart, the ultimate depiction of devotion (Bhakti), glowing divine light emanating from within, a mountain forest background, an emotional expression of pure love and unwavering devotion, ultra HD spiritual art.', lesson: 'Pure Devotion', mood: 'devotional', intensity: 'emotional' },

    // --- MARVEL & DC ---
    { id: 'dc_batman_gotham', name: 'Batman - Gotham Guardian', category: 'DC Heroes', prompt: 'The Dark Knight Batman overlooking Gotham City at night from a high gargoyle, his cape flowing in the wind, sprawling city lights below, the Bat-signal illuminating the cloudy sky, noir cinematography, ultra HD dramatic lighting, iconic and brooding pose.', character: 'Batman', mood: 'brooding', intensity: 'dramatic' },
    { id: 'marvel_spiderman_nyc', name: 'Spider-Man - NYC Swing', category: 'Marvel Heroes', prompt: 'Spider-Man swinging through the skyscrapers of New York City at sunset, web-slinging action in a dynamic pose, city lights and traffic visible far below, iconic red and blue suit, ultra HD action cinematography capturing the thrill of movement.', character: 'Spider-Man', mood: 'energetic', intensity: 'action' },
    { id: 'dc_wonder_woman_themyscira', name: 'Wonder Woman - Themyscira', category: 'DC Heroes', prompt: 'Wonder Woman on the paradise island of Themyscira, surrounded by Greco-Roman architecture, waterfalls, and lush greenery. She stands in a powerful warrior princess pose with her golden Lasso of Truth and shield. A Mediterranean sunset paints the sky. Ultra HD fantasy landscape.', character: 'Wonder Woman', mood: 'powerful', intensity: 'majestic' },

    // --- CARS (Enhanced Nissan Z Focus) ---
    { id: 'car_nissan_z_370_mountain', category: 'Cars', name: 'Nissan 370Z - Mountain King', prompt: 'A stunning Nissan 370Z in iconic Bayside Blue metallic finish, positioned on a dramatic mountain switchback road during the golden hour. The lighting reflects beautifully off the glossy paint, highlighting the aggressive Z33 body lines. Sport wheels, mountain peaks in the background. Cinematic automotive photography, ultra HD for Fold 7.', hdOptimized: ['fold7-unfolded', 'galaxybook-16inch'], mood: 'adventurous', intensity: 'cinematic' },
    { id: 'car_nissan_z_370_cyberpunk', category: 'Cars', name: 'Nissan 370Z - Cyber Dynasty', prompt: 'A Bayside Blue Nissan 370Z in a futuristic cyberpunk city at night. Neon lights and holographic advertisements reflect on the car\'s metallic paint and the rain-slicked streets. A Tokyo-inspired, Blade Runner aesthetic. Ultra HD for premium screens.', hdOptimized: ['fold7-cover', '4k-desktop'], mood: 'futuristic', intensity: 'dramatic' },
    { id: 'car_nissan_z_track', category: 'Cars', name: 'Nissan Z: Track Beast', prompt: 'A Bayside Blue metallic Nissan Z Performance at the apex of a turn on a professional racing circuit. The bright daylight highlights the car\'s aerodynamic features. The background shows the blur of the track, tire barriers, and spectator stands. Focus is on the car, conveying a sense of speed and precision. Clean, sharp, high-action motorsport photography.', mood: 'intense', intensity: 'action' },
    { id: 'car_nissan_z_garage', category: 'Cars', name: 'Nissan Z: Showroom King', prompt: 'A pristine Bayside Blue metallic Nissan Z Performance parked in a futuristic, minimalist showroom garage. The environment features dramatic overhead spotlights and polished concrete floors that reflect the car\'s perfect blue paint. The lighting is designed to accentuate every curve and detail of the Z\'s design. A sense of luxury and high-performance technology.', mood: 'sleek', intensity: 'luxurious' },
    
    // --- NATURE ---
    { id: 'bioluminescent-forest', name: 'Bioluminescent Forest', category: 'Nature', prompt: 'A magical forest at night where plants and mushrooms glow with bioluminescent blue and green light. Mist flowing between trees, fireflies dancing in the air. Mystical, enchanting, otherworldly atmosphere.', thumbnailPrompt: 'Glowing forest scene', mood: 'mystical', intensity: 'enchanting' },
    { id: 'aurora-sky', name: 'Aurora Sky', category: 'Nature', prompt: 'Northern lights (aurora borealis) dancing across a star-filled sky in vibrant green, purple, and blue. Snow-covered landscape below with silhouetted pine trees. Cold, majestic, breathtaking natural phenomenon.', thumbnailPrompt: 'Aurora borealis landscape', mood: 'majestic', intensity: 'breathtaking' },
    { id: 'nature_mystical_forest', category: 'Nature', name: 'Mystical Forest', prompt: 'A mystical, ancient forest with massive, moss-covered trees. Ethereal sunbeams pierce through the dense canopy, illuminating particles of dust and pollen in the air. A sense of magic and tranquility.', mood: 'mystical', intensity: 'serene' },
    { id: 'nature_mountain_peak', category: 'Nature', name: 'Mountain Peak', prompt: 'The summit of a majestic, snow-capped mountain range at sunrise. The sky is a brilliant gradient of orange, pink, and purple. A sea of clouds fills the valleys below. Breathtaking, epic, and vast.', mood: 'epic', intensity: 'majestic' },
    { id: 'nature_aurora', category: 'Nature', name: 'Aurora Borealis', prompt: 'A breathtaking view of the aurora borealis over a frozen, snow-covered landscape with pine trees. The sky is alive with swirling curtains of green, purple, and blue light. A magical, cold, and clear night.', mood: 'magical', intensity: 'vibrant' },
    
    // --- SPACE ---
    { id: 'space_galaxy_dreams', category: 'Space', name: 'Galaxy Dreams', prompt: 'Floating in deep space, surrounded by a vibrant, swirling nebula of turquoise, magenta, and gold. Countless stars and distant galaxies are visible in the background. Awe-inspiring and cosmic.', mood: 'cosmic', intensity: 'awe-inspiring' },
    { id: 'space_alien_planet', category: 'Space', name: 'Alien Planet', prompt: 'A bizarre and beautiful alien planet landscape. Two suns hang in the sky over a terrain of crystal formations and bioluminescent flora. The colors are otherworldly and fantastical.', mood: 'alien', intensity: 'fantastical' },
    
    // --- FANTASY ---
    { id: 'fantasy_magic_castle', category: 'Fantasy', name: 'Floating Castle', prompt: 'A magnificent, grand magic castle with towering spires, floating on a cloud island in the sky. Waterfalls cascade from the edges of the island into the sky below. A whimsical and epic fantasy setting.', mood: 'whimsical', intensity: 'epic' },
    { id: 'fantasy_dragon_lair', category: 'Fantasy', name: 'Dragon\'s Lair', prompt: 'A colossal, cavernous dragon\'s lair, filled with mountains of shimmering gold coins, jewels, and ancient artifacts. A faint glow emanates from molten rock in the cavern walls. Epic, dangerous, and awe-inspiring.', mood: 'dangerous', intensity: 'epic' },

    // --- URBAN ---
    { id: 'urban_cyberpunk_city', category: 'Urban', name: 'Cyberpunk Cityscape', prompt: 'A dense, futuristic cyberpunk cityscape at night. Towering skyscrapers are covered in holographic advertisements and neon signs, reflected in the rain-slicked streets below. Flying vehicles zip between buildings.', mood: 'futuristic', intensity: 'energetic' },
    { id: 'urban_tokyo_crossing', category: 'Urban', name: 'Tokyo Crossing', prompt: 'A bustling, iconic street crossing in Tokyo at night, like Shibuya. The scene is a blur of motion, with crowds of people and vibrant neon signs in Japanese. A sense of high energy and modern city life.', mood: 'energetic', intensity: 'bustling' },
    
    // --- ABSTRACT ---
    { id: 'geometric-dreamscape', name: 'Geometric Dreamscape', category: 'Abstract', prompt: 'An abstract scene of floating geometric shapes (cubes, spheres, pyramids) in a pastel gradient space. Soft pink, lavender, and mint green colors. Dreamy atmosphere with subtle light rays. Minimalist, modern, ethereal.', thumbnailPrompt: 'Floating pastel geometric shapes', mood: 'dreamlike', intensity: 'minimalist' },
    { id: 'liquid-metal-flow', name: 'Liquid Metal Flow', category: 'Abstract', prompt: 'Abstract liquid metal flowing and morphing in space. Chrome and silver reflections with iridescent rainbow highlights. Smooth, fluid motion captured in a still moment. High contrast, reflective, dynamic composition.', thumbnailPrompt: 'Liquid chrome abstract', mood: 'dynamic', intensity: 'high-contrast' },
    { id: 'abstract_geometric_dreams', category: 'Abstract', name: 'Geometric Dreams', prompt: 'A complex and beautiful landscape made of interlocking, semi-translucent geometric shapes. The color palette is a soothing blend of pastel colors, and the lighting is soft and ethereal. A modern, minimalist, and dreamlike aesthetic.', mood: 'dreamlike', intensity: 'minimalist' },
    { id: 'abstract_synthwave', category: 'Abstract', name: 'Synthwave Grid', prompt: 'A classic 80s synthwave scene. A glowing neon grid landscape stretches to the horizon, where a wireframe mountain range meets a retro setting sun. The sky is a dark purple filled with stars.', mood: 'retro', intensity: 'vibrant' },

    // --- VINTAGE ---
    { id: 'art-deco-1920s', name: '1920s Art Deco', category: 'Vintage', prompt: 'An elegant Art Deco ballroom from the 1920s with geometric patterns in gold and black. Ornate chandeliers, marble columns, and symmetrical designs. Luxurious, glamorous, vintage aesthetic with warm golden lighting.', thumbnailPrompt: 'Art Deco ballroom detail', mood: 'luxurious', intensity: 'glamorous' },
    { id: 'retro-80s-arcade', name: 'Retro 80s Arcade', category: 'Vintage', prompt: 'A classic 1980s arcade filled with neon-lit game cabinets. Pink and cyan grid floors, palm tree silhouettes, chrome accents. Vaporwave aesthetic with VHS grain effect. Nostalgic, vibrant, retro-futuristic.', thumbnailPrompt: '80s arcade scene with neon', mood: 'nostalgic', intensity: 'vibrant' },
    
    // --- SEASONAL ---
    { id: 'seasonal_winter_wonderland', category: 'Seasonal', name: 'Winter Wonderland', prompt: 'A peaceful, snow-covered forest after a fresh snowfall. The branches of the trees are heavy with snow, and the world is quiet and serene. A cozy cabin with a glowing window is visible in the distance.', mood: 'peaceful', intensity: 'serene' },
    { id: 'seasonal_autumn_forest', category: 'Seasonal', name: 'Autumn Forest', prompt: 'A vibrant autumn forest with a path covered in fallen leaves of red, orange, and yellow. The afternoon sun filters through the colorful canopy, creating a warm and golden glow.', mood: 'warm', intensity: 'vibrant' },
];
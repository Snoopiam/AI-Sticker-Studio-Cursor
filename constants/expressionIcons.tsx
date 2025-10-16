/**
 * @file constants/expressionIcons.tsx
 * @description A library of all SVG icon components used for the expression selection UI.
 * Each icon is a stateless React functional component, making them lightweight and reusable.
 * The `className="w-full h-full"` ensures they scale to fit their container in the expression grid.
 */

import React from 'react';

/** @component HeyIcon - A sparkling icon representing a friendly 'Hey' or wave. */
export const HeyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M7.28 5.165A2.25 2.25 0 019.61 4.25h.78a2.25 2.25 0 012.33 1.915l.386 2.316 2.138-1.233a.75.75 0 01.968 1.299l-2.24 1.293 2.138 1.233a.75.75 0 01-.968 1.299l-2.24-1.293-.386 2.316a2.25 2.25 0 01-2.33 1.915h-.78a2.25 2.25 0 01-2.33-1.915l-.386-2.316-2.138 1.233a.75.75 0 01-.968-1.299l2.24-1.293-2.138-1.233a.75.75 0 01.968-1.299l2.24 1.293.386-2.316Z" />
    </svg>
);

/** @component ThumbsUpIcon - A classic thumbs-up gesture icon. */
export const ThumbsUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M1 10.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
        <path fillRule="evenodd" d="M5.636 4.136a.75.75 0 0 1 1.06 0l.273.273a.75.75 0 0 0 1.06 0l.273-.273a.75.75 0 0 1 1.06 0l.273.273a.75.75 0 0 0 1.06 0l.273-.273a.75.75 0 0 1 1.06 0l3.076 3.075a.75.75 0 0 1-.03 1.09l-3.23 2.423a.75.75 0 0 1-1.033-.213l-1.071-1.895a.75.75 0 0 0-1.34 0l-1.07 1.895a.75.75 0 0 1-1.034.213L4.53 8.302a.75.75 0 0 1-.03-1.09l1.136-1.136.273.273a.75.75 0 0 0 1.06 0l.273-.273Z" clipRule="evenodd" />
    </svg>
);

/** @component PeaceSignIcon - A hand making a peace sign gesture. */
export const PeaceSignIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.5 4.012a.75.75 0 011.043.625l.82 3.784a.75.75 0 01-1.485.32l-.82-3.784a.75.75 0 01.442-.945zM11.5 4.012a.75.75 0 01.442.945l-.82 3.784a.75.75 0 01-1.485-.32l.82-3.784a.75.75 0 011.043-.625zM6.168 10.395a.75.75 0 01.084 1.058l-1.08 1.44a.75.75 0 11-1.14-.856l1.08-1.44a.75.75 0 011.056-.202zM3.5 12.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM13.832 10.395a.75.75 0 011.056.202l1.08 1.44a.75.75 0 11-1.14.856l-1.08-1.44a.75.75 0 01.084-1.058zM16.5 12.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM6 16.25a.75.75 0 001.5 0V11A2.5 2.5 0 0110 8.5h.5a2.5 2.5 0 012.5 2.5v5.25a.75.75 0 001.5 0V11A4 4 0 0010.5 7H10a4 4 0 00-4 4v5.25z" />
    </svg>
);

/** @component FistbumpIcon - An icon of a fist extended for a fistbump. */
export const FistbumpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M15.213 6.623c.463 0 .84.376.84.84v4.322a.84.84 0 0 1-.84.84h-1.21a.84.84 0 0 1-.84-.84V9.813h-.742v3.636a.84.84 0 0 1-.84.84h-1.21a.84.84 0 0 1-.84-.84V9.813h-.743v3.24a.84.84 0 0 1-.84.84H7.545a.84.84 0 0 1-.84-.84V9.813h-.743v2.16a.84.84 0 0 1-.84.84H3.952a.84.84 0 0 1-.84-.84V8.303c0-.464.377-.84.84-.84a2.52 2.52 0 0 1 2.52-2.52h7.9c.39 0 .758.08.109.227z" clipRule="evenodd" />
    </svg>
);

/** @component ShrugIcon - An icon representing a shrugging gesture. */
export const ShrugIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M3.25 8.523a.75.75 0 0 0-1.5 0v3.176a.75.75 0 0 0 1.085.648l1.494-.996a.75.75 0 0 1 1.086 0l1.494.996A.75.75 0 0 0 8 11.699V8.523a.75.75 0 1 0-1.5 0v2.24l-1-0.667-1-0.667v-2.24ZM12 8.523a.75.75 0 0 0-1.5 0v3.176a.75.75 0 0 0 1.085.648l1.494-.996a.75.75 0 0 1 1.086 0l1.494.996a.75.75 0 0 0 1.085-.648V8.523a.75.75 0 0 0-1.5 0v2.24l-1-.667-1-.667v-2.24Z" clipRule="evenodd" />
    </svg>
);

/** @component PunchForwardIcon - A dynamic icon of a punch directed at the viewer. */
export const PunchForwardIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
      <path d="M3 8.75a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 013 8.75zM14.25 8.75a.75.75 0 000-1.5h-2.5a.75.75 0 000 1.5h2.5z" />
      <path fillRule="evenodd" d="M14.717 6.425a3.75 3.75 0 01-1.125 5.236l-3.354 2.115a2.25 2.25 0 01-2.903-3.15l1.65-2.073h-.202a3.75 3.75 0 01-3.675-3.033.75.75 0 011.472-.234 2.25 2.25 0 002.203 1.817h1.018a3.75 3.75 0 012.97 1.258 2.25 2.25 0 002.045-3.235l-1.05-1.68a.75.75 0 111.23-.77l1.05 1.68a3.75 3.75 0 01-2.077 5.394z" clipRule="evenodd" />
    </svg>
);

/** @component HeartHandsIcon - An icon of two hands forming a heart shape. */
export const HeartHandsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

/** @component FacepalmIcon - An icon representing a facepalm gesture of exasperation. */
export const FacepalmIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.25 3.75a.75.75 0 00-1.5 0v1.5c0 .414.336.75.75.75h1.5a.75.75 0 000-1.5h-.75v-1.5z" />
        <path fillRule="evenodd" d="M3.5 6.344a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.5c0 .414-.336.75-.75.75h-2.5a.75.75 0 010-1.5h.5v-.5zm4.5-.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" clipRule="evenodd" />
        <path d="M5.75 9.75a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z" />
        <path fillRule="evenodd" d="M5 12.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        <path d="M12.25 6.844a.75.75 0 00-1.5 0v6.406a.75.75 0 001.5 0V6.844z" />
        <path fillRule="evenodd" d="M15.5 6.594a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v6.656a.75.75 0 01-1.5 0V7.344h-.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

/** @component WinkIcon - A winking eye icon. */
export const WinkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.18l3.75-5.25a1.65 1.65 0 0 1 2.827.24l.582.872a.25.25 0 0 0 .418.033l1.206-1.508a.25.25 0 0 1 .375-.017l1.45 1.05a.25.25 0 0 1 .017.375l-1.508 1.206a.25.25 0 0 0-.033.418l.872.582a1.65 1.65 0 0 1 .24 2.827l-5.25 3.75a1.65 1.65 0 0 1-1.18 0l-5.25-3.75a1.65 1.65 0 0 1 0-1.18ZM10 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" clipRule="evenodd" />
    </svg>
);

/** @component LaughingIcon - An icon representing hysterical laughter. */
export const LaughingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Z" />
        <path fillRule="evenodd" d="M10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" clipRule="evenodd" />
        <path d="M10 16.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
);

/** @component SmirkIcon - An icon of a face with a mischievous smirk. */
export const SmirkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-3.5 8.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Z" />
    </svg>
);

/** @component ThinkingIcon - An icon representing thinking or a question. */
export const ThinkingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);

/** @component SadIcon - An icon of a sad face with a frown. */
export const SadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.5 9a.5.5 0 01.5-.5h6a.5.5 0 010 1H7a.5.5 0 01-.5-.5zM10 14a4 4 0 00-4-4h8a4 4 0 00-4 4z" clipRule="evenodd" />
    </svg>
);

/** @component AngryIcon - An icon of an angry face. */
export const AngryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 8a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 019 8zm3.25.75a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5zM9 13.5a.5.5 0 01.5-.5h1a.5.5 0 010 1H9.5a.5.5 0 01-.5-.5z" clipRule="evenodd" />
    </svg>
);

/** @component InLoveIcon - An icon of a face with heart eyes, representing being in love. */
export const InLoveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-5.5a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zM8.5 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
    </svg>
);

/** @component WassupIcon - An icon for the iconic "Wassup" expression. */
export const WassupIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-2.75-7.25a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm-2.5-3a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm9.5 0a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm-5.418 5a2 2 0 1 0-2.164 0h2.164Z" clipRule="evenodd" />
    </svg>
);

/** @component MindBlownIcon - An icon representing a mind-blown or exploding head expression. */
export const MindBlownIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M10 3.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM5.636 6.364a.75.75 0 011.06 0l1.06 1.061a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.061zM3.75 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM6.364 14.364a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM10 16.25a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75-.75zM13.636 14.364a.75.75 0 01-1.06 0l-1.06-1.061a.75.75 0 111.06-1.06l1.06 1.06a.75.75 0 010 1.061zM16.25 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM14.364 5.636a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0z" />
    </svg>
);

/** @component DealWithItIcon - An icon of pixelated sunglasses for the "deal with it" meme. */
export const DealWithItIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm3-1a1 1 0 00-1 1v2h12V5a1 1 0 00-1-1H5zM4 9v6a1 1 0 001 1h10a1 1 0 001-1V9H4z" clipRule="evenodd" />
    </svg>
);

/** @component EatingPopcornIcon - An icon representing watching drama while eating popcorn. */
export const EatingPopcornIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm6 2a1 1 0 00-1 1v2a1 1 0 102 0V7a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v2a1 1 0 102 0V7a1 1 0 00-1-1zm-4 5a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
    </svg>
);

/** @component SippingTeaIcon - An icon representing sipping tea while watching gossip. */
export const SippingTeaIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v.5c0 .414.336.75.75.75h3a.75.75 0 010 1.5h-.75a3.75 3.75 0 01-3.75 3.75V15a.75.75 0 01-1.5 0v-5.25A3.75 3.75 0 016.25 6h-2.5a.75.75 0 010-1.5h2.5A2.25 2.25 0 0010 2.25V3z" clipRule="evenodd" />
    </svg>
);

/** @component CoffeeIcon - An icon of a coffee cup. */
export const CoffeeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M3 3.5A1.5 1.5 0 014.5 2h5.25a1.5 1.5 0 011.5 1.5v.5a.75.75 0 01-.75.75H9.5a.75.75 0 01-.75-.75v-.5h-2v5.19l-1.3-1.3a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l2.5-2.5a.75.75 0 10-1.06-1.06l-1.3 1.3V3.5h1.25a.75.75 0 01.75.75v.5a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5H9v-.5A1.5 1.5 0 0110.5 2h5.25A1.5 1.5 0 0117 3.5v9A1.5 1.5 0 0115.5 14h-11A1.5 1.5 0 013 12.5v-9z" />
    </svg>
);

/** @component ReadingBookIcon - An icon of an open book. */
export const ReadingBookIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v8.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-8.5z" clipRule="evenodd" />
        <path d="M10 18a.75.75 0 01-.75-.75V16h-3a.75.75 0 010-1.5h3.75a.75.75 0 01.75.75v2a.75.75 0 01-.75.75z" />
    </svg>
);

/** @component HoldsSignIcon - An icon of a blank sign or placard. */
export const HoldsSignIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2z" />
        <path fillRule="evenodd" d="M2 7.5A2.5 2.5 0 014.5 5h11A2.5 2.5 0 0118 7.5v8A2.5 2.5 0 0115.5 18h-11A2.5 2.5 0 012 15.5v-8zM4.5 6.5a1 1 0 00-1 1v8a1 1 0 001 1h11a1 1 0 001-1v-8a1 1 0 00-1-1h-11z" clipRule="evenodd" />
    </svg>
);

/** @component NodIcon - An icon representing a nod of acknowledgement. */
export const NodIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM7.25 12.25a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z" />
        <path stroke="#FFF" strokeLinecap="round" strokeWidth="1.5" d="M12.5 8.5a3 3 0 00-5 0" strokeOpacity="0.8" />
    </svg>
);

/** @component HighFiveIcon - An icon of a hand raised for a high-five. */
export const HighFiveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
      <path fillRule="evenodd" d="M12.75 3.75A2.25 2.25 0 0010.5 6v.159c0 .484.144.947.4 1.342l.983 1.474c.256.384.417.848.417 1.344V14a1 1 0 01-1 1h-1.03a.75.75 0 01-.73-.553l-.22-1.1a.75.75 0 00-1.42.28L6.8 14.447a.75.75 0 01-.73.553H5a1 1 0 01-1-1v-2.68c0-.496.161-.96.417-1.344l.983-1.474c.256-.395.4-.858.4-1.342V6A2.25 2.25 0 017.25 3.75c.995 0 1.823.645 2.122 1.547a.75.75 0 001.458-.396A3.75 3.75 0 009.25 2.25C7.31 2.25 5.75 3.81 5.75 5.75v.409c0 .762-.25 1.49-.69 2.09l-.984 1.474A3.25 3.25 0 003 12.32V14a2.5 2.5 0 002.5 2.5h1.03a2.25 2.25 0 002.19-1.658l.22-1.1a2.25 2.25 0 014.26 0l.22 1.1A2.25 2.25 0 0013.97 16.5H15a2.5 2.5 0 002.5-2.5v-2.68a3.25 3.25 0 00-1.06-2.497l-.984-1.474c-.44-.6-.69-1.328-.69-2.09V5.75C14.75 4.659 13.841 3.75 12.75 3.75z" clipRule="evenodd" />
    </svg>
);

/** @component WorkingOnLaptopIcon - An icon of a laptop computer. */
export const WorkingOnLaptopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v.5h14V5a1 1 0 00-1-1H4zM3 15a1 1 0 001 1h12a1 1 0 001-1v-1.5H3V15z" clipRule="evenodd" />
    </svg>
);

/** @component GamingIcon - An icon of a video game controller. */
export const GamingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M2 6.25A2.25 2.25 0 014.25 4h11.5A2.25 2.25 0 0118 6.25v7.5A2.25 2.25 0 0115.75 16H4.25A2.25 2.25 0 012 13.75v-7.5zM4.25 5.5a.75.75 0 00-.75.75v7.5c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75H4.25z" />
        <path d="M5.25 8.25a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM8 8.25a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H8.75a.75.75 0 01-.75-.75zM5.25 11.25a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM8 11.25a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H8.75a.75.75 0 01-.75-.75zM12.25 8.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" />
    </svg>
);

/** @component CelebratingIcon - An icon representing celebration with confetti. */
export const CelebratingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M8.5 2.25a.75.75 0 00-1.5 0v1.75a.75.75 0 001.5 0V2.25zM10.5 2.25a.75.75 0 011.5 0v1.75a.75.75 0 01-1.5 0V2.25zM13.5 4a.75.75 0 000 1.5h1.75a.75.75 0 000-1.5H13.5zM4.75 5.5a.75.75 0 010-1.5h-1.5a.75.75 0 010 1.5h1.5zM15 9.75a.75.75 0 01-.75-.75V7.25a.75.75 0 011.5 0v1.75a.75.75 0 01-.75.75zM5.5 9.75a.75.75 0 00.75-.75V7.25a.75.75 0 00-1.5 0v1.75a.75.75 0 00.75.75z" />
        <path fillRule="evenodd" d="M3 13.5a.75.75 0 000 1.5h4.25a.75.75 0 000-1.5H3zm14 1.5a.75.75 0 000-1.5h-4.25a.75.75 0 000 1.5H17zM9 13.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM9.75 16.5a.75.75 0 000-1.5H8a.75.75 0 000 1.5h1.75zM12 15.75a.75.75 0 01-.75.75h-.5a.75.75 0 010-1.5h.5a.75.75 0 01.75.75z" clipRule="evenodd" />
    </svg>
);

/** @component HeroicPoseIcon - An icon of a star, representing a heroic or superhero pose. */
export const HeroicPoseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM3.5 7.5a.75.75 0 00-1.5 0v5a.75.75 0 001.5 0v-5zM18 7.5a.75.75 0 00-1.5 0v5a.75.75 0 001.5 0v-5z" clipRule="evenodd" />
        <path d="M10 5.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75zM5.5 10a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75zM14.5 10a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75z" />
        <path d="M10 13.5a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75z" />
    </svg>
);

/** @component CrossedArmsIcon - An icon representing crossed arms. */
export const CrossedArmsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M3.5 4.5a.5.5 0 000 1h13a.5.5 0 000-1h-13zM3.5 9.5a.5.5 0 000 1h13a.5.5 0 000-1h-13zM3.5 14.5a.5.5 0 000 1h13a.5.5 0 000-1h-13z" />
    </svg>
);

/** @component GaspIcon - An icon of a face gasping in surprise with a hand over its mouth. */
export const GaspIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3-7a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm-3 4a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

/** @component SpeechBubbleIcon - A generic speech bubble icon. */
export const SpeechBubbleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
    </svg>
);

/** @component ShockedIcon - An icon of a face with wide eyes, representing shock. */
export const ShockedIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm6 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-3 5a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);

/** @component SunIcon - A sun icon, often used for 'Morning' greetings. */
export const SunIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM10 18a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5A.75.75 0 0 1 10 18ZM2 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2 10ZM15 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 15 10ZM5.636 5.636a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061L5.636 6.7A.75.75 0 0 1 5.636 5.636ZM12.243 12.243a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM5.636 14.364a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 1 1 1.061 1.06l-1.06 1.061a.75.75 0 0 1-1.06 0ZM13.303 6.7a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 0 1 1.061 1.06l-1.06 1.061a.75.75 0 0 1-1.061 0Z" clipRule="evenodd" />
    </svg>
);

/** @component MoonIcon - A moon icon, often used for 'Evening' greetings. */
export const MoonIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M7.455 2.164A8.952 8.952 0 0 1 10 2c4.97 0 9 4.03 9 9s-4.03 9-9 9a8.952 8.952 0 0 1-2.545-.336A6.5 6.5 0 0 0 10 16.5c-3.589 0-6.5-2.91-6.5-6.5 0-1.85.77-3.535 2.045-4.714A6.49 6.49 0 0 0 7.455 2.164Z" clipRule="evenodd" />
    </svg>
);

/** @component PoseFromImageIcon - An icon representing using the pose from the user's uploaded image. */
export const PoseFromImageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
        <path d="M1 5.75A2.75 2.75 0 013.75 3h12.5A2.75 2.75 0 0119 5.75v8.5A2.75 2.75 0 0116.25 17H3.75A2.75 2.75 0 011 14.25v-8.5zM3.75 4.5a1.25 1.25 0 00-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25H3.75z" />
        <path d="M10 8a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8.25 10.5a1.75 1.75 0 113.5 0 1.75 1.75 0 01-3.5 0z" />
    </svg>
);
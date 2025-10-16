/**
 * @file index.tsx
 * @description This file serves as the main entry point for the AI Sticker Studio React application.
 * Its primary responsibilities are to:
 * 1. Locate the root HTML element in the `index.html` file.
 * 2. Initialize the React rendering engine using ReactDOM's modern `createRoot` API.
 * 3. Render the top-level `App` component, which contains the entire application structure,
 *    into the identified root element.
 * This setup bootstraps the entire single-page application (SPA).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Step 1: Attempt to find the root DOM element.
// The application's entire UI will be injected into this element. The ID 'root' is a standard
// convention and corresponds to the `<div id="root"></div>` in `index.html`.
const rootElement = document.getElementById('root');

// Step 2: A crucial safety check.
// If the root element is not found in the DOM, the application cannot render.
// This would happen if `index.html` is missing the '#root' div or if the script runs
// before the DOM is fully loaded. We throw an error to fail fast and make debugging easier.
if (!rootElement) {
  throw new Error("Fatal Error: Could not find the root element with ID 'root' in the DOM. Ensure index.html is correctly set up.");
}

// Step 3: Create a React root.
// `ReactDOM.createRoot` is the modern API for initializing a React application. It enables
// React 18's concurrent features, which can improve performance for complex UIs by allowing
// React to work on multiple state updates simultaneously.
const root = ReactDOM.createRoot(rootElement);

// Step 4: Render the main App component into the root.
// The `root.render()` method tells React to take control of the `rootElement` and manage its content.
//
// `React.StrictMode` is a development-only tool that helps identify potential problems in an application.
// It activates additional checks and warnings for its descendants, such as detecting unsafe lifecycles,
// legacy API usage, and unexpected side effects. It does not render any visible UI and has no
// effect on the production build.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import { Outlet } from "react-router";

// Fonts, self-hosted via @fontsource. Space Grotesk is the display face
// (headings, wordmark); IBM Plex Sans carries body + UI; IBM Plex Mono is
// functional-only (counters, code). Only the weights actually used are loaded,
// so no weight is browser-synthesised.
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import "./Main.css";
import NavBar from "./components/NavBar";
import ErrorBoundary from "./components/ui/ErrorBoundary";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Skip to content
      </a>
      <NavBar />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

import { Outlet } from "react-router";

// Fonts, self-hosted via @fontsource. Space Grotesk carries headings + body;
// IBM Plex Mono is functional-only (counters, code) — keep its use rare.
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import "./Main.css";
import NavBar from "./components/NavBar";
import ErrorBoundary from "./components/ui/ErrorBoundary";

/**
 * Root component wrapping every route. Provides the page chrome (nav) and an
 * error boundary around the routed content.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavBar />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

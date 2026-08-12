import { Component, type ErrorInfo, type ReactNode } from "react";
import Button from "./Button";
import Heading from "./Heading";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * App-wide error boundary. Wraps the routed <Outlet /> in App.tsx so a render
 * error shows a recoverable fallback instead of a blank white page. Wasp has
 * no error-file convention, so this is where a crash is caught and, in
 * production, where you would forward it to an error reporter.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, swap this for your error reporter (Sentry, etc.).
    console.error("[proto-stack] render error", error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main
        id="main"
        className="min-h-[60vh] flex items-center justify-center px-6 py-20"
      >
        <div className="max-w-md w-full text-center space-y-6">
          <Heading as="h1" size="h2" align="center">
            This page hit an error
          </Heading>
          <p className="text-muted-foreground">
            The rest of the app is fine. Reload to try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button href="/" variant="ghost">
              Go home
            </Button>
          </div>
        </div>
      </main>
    );
  }
}

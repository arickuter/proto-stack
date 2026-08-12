import type { ReactNode } from "react";
import { Card, Container } from "../client/components/ui";

/**
 * Chrome for the auth pages. The `auth-form-appearance` class maps Wasp's
 * built-in auth-form CSS variables onto our design tokens (see Main.css), so
 * the forms match the brand and re-skin automatically on a /brand rebrand.
 */
export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="flex-1 flex items-center justify-center py-16">
      <Container width="narrow">
        <div className="mx-auto w-full max-w-md">
          <Card padding="lg">
            <div className="auth-form-appearance">{children}</div>
          </Card>
        </div>
      </Container>
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { type AuthUser } from "wasp/auth";
import { updateDisplayName } from "wasp/client/operations";
import {
  Alert,
  Button,
  Card,
  Container,
  Heading,
  Section,
} from "../client/components/ui";

/*
 * The reference feature: a tiny form calling the updateDisplayName action.
 * Pairs with src/user/operations.ts — copy this shape (local state → await the
 * action → surface success/error with <Alert/>) when you add your own.
 */
export default function AccountPage({ user }: { user: AuthUser }) {
  const [displayName, setName] = useState(user.displayName ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      await updateDisplayName({ displayName });
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main id="main" className="flex-1">
      <Section density="compact">
        <Container width="narrow">
          <Heading size="h1">Account</Heading>
          <p className="mt-3 text-muted-foreground">
            Signed in as {user.email ?? user.username}.
          </p>

          <Card className="mt-8" padding="lg">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Display name
                </label>
                <input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => {
                    setName(e.target.value);
                    setStatus("idle");
                  }}
                  className="w-full rounded-[2px] border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  placeholder="How your name appears in the app"
                />
              </div>

              {status === "saved" && <Alert variant="success">Saved.</Alert>}
              {status === "error" && error && <Alert variant="error">{error}</Alert>}

              <Button type="submit" loading={status === "saving"} loadingText="Saving…">
                Save
              </Button>
            </form>
          </Card>
        </Container>
      </Section>
    </main>
  );
}

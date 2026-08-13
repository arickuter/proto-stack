import { useState, type FormEvent } from "react";
import { type AuthUser } from "wasp/auth";
import { updateDisplayName } from "wasp/client/operations";
import {
  Alert,
  Button,
  Card,
  Container,
  Field,
  Heading,
  Input,
  Section,
} from "../client/components/ui";
import PageMeta from "../client/components/PageMeta";

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
      setError(err instanceof Error ? err.message : "Could not save your display name.");
    }
  }

  return (
    <main id="main" className="flex-1">
      <PageMeta title="Account" />
      <Section density="compact">
        <Container width="narrow">
          <Heading as="h1" size="h1">Account</Heading>
          <p className="mt-3 text-muted-foreground">
            Signed in as {user.email ?? user.username}.
          </p>

          <Card className="mt-8" padding="lg">
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Display name" htmlFor="displayName">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => {
                    setName(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder="How your name appears in the app"
                />
              </Field>

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

import { type AuthUser } from "wasp/auth";
import { Card, Container, Heading, Section } from "../client/components/ui";

export default function DashboardPage({ user }: { user: AuthUser }) {
  const name = user.displayName || user.email || user.username || "there";

  return (
    <main id="main" className="flex-1">
      <Section density="compact">
        <Container>
          <Heading size="h1">Welcome, {name}</Heading>
          <p className="mt-3 text-muted-foreground">
            This is your app's home once someone signs in.
          </p>

          <Card className="mt-8" padding="lg">
            <h2 className="text-lg font-semibold text-foreground">
              Your prototype starts here
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                /prototype
              </code>{" "}
              in Claude Code to turn an idea brief into working screens, then{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                /brand
              </code>{" "}
              to make it yours. Replace this card with your app.
            </p>
          </Card>
        </Container>
      </Section>
    </main>
  );
}

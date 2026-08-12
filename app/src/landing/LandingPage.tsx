import { Zap, ShieldCheck, Paintbrush } from "lucide-react";
import { APP_NAME, TAGLINE } from "../shared/app";
import { Button, Card, Container, Heading, Section } from "../client/components/ui";

/*
 * The landing page doubles as the living style reference for the design
 * system: heading-first sections, sentence case, no generated-page tells
 * (no eyebrow labels, no numbered feature grids, no pill rows). The /prototype
 * skill rewrites this copy for your idea — the structure is the part to keep.
 */

const features = [
  {
    icon: Zap,
    title: "Auth and database, already wired",
    body: "Email and Google sign-in, sessions, and a Postgres schema are set up. Start on the idea, not the plumbing.",
  },
  {
    icon: Paintbrush,
    title: "A design system you can rebrand in minutes",
    body: "One token file drives the whole look. Give the brand skill a brief and every colour, font, and radius updates at once.",
  },
  {
    icon: ShieldCheck,
    title: "Guardrails that fail the build, not the launch",
    body: "Linters catch un-scoped queries, leaked secrets, and off-brand colour before they ship. Correct by default.",
  },
];

export default function LandingPage() {
  return (
    <main id="main" className="flex-1">
      <Section>
        <Container width="narrow">
          <div className="space-y-6 text-center">
            <Heading as="h1" size="display" align="center">
              Ship a prototype worth <span className="accent-text">validating</span>
            </Heading>
            <p className="text-lg text-muted-foreground">{TAGLINE}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button href="/signup" size="lg">
                Get started
              </Button>
              <Button href="/login" size="lg" variant="ghost">
                Log in
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <div className="max-w-2xl space-y-3">
            <Heading size="h2">Everything that slows down a new idea, handled</Heading>
            <p className="text-muted-foreground">
              The parts every project needs are done once, here, so each new idea
              starts at the interesting part.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="inverted">
        <Container width="narrow">
          <div className="space-y-6 text-center">
            <Heading size="h2">Start building {APP_NAME}</Heading>
            <p className="text-surface-inverted-muted">
              Create an account and open the dashboard to begin.
            </p>
            <div className="pt-2">
              <Button href="/signup" size="lg" variant="inverted">
                Create your account
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <footer className="border-t border-border py-8">
        <Container>
          <p className="text-sm text-muted-foreground">
            {APP_NAME} — built on proto-stack.
          </p>
        </Container>
      </footer>
    </main>
  );
}

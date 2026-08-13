import { Button, Container, Heading } from "./ui";
import PageMeta from "./PageMeta";

export default function NotFoundPage() {
  return (
    <main id="main" className="flex-1 flex items-center justify-center py-24">
      <PageMeta title="Page not found" noindex />
      <Container width="narrow">
        <div className="text-center space-y-6">
          <Heading as="h1" size="h1" align="center">
            This page doesn't exist
          </Heading>
          <p className="text-muted-foreground">
            The link may be broken, or the page may have moved.
          </p>
          <div className="pt-2">
            <Button href="/">Back home</Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

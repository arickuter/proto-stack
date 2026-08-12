import { Button, Container } from "./ui";

export default function NotFoundPage() {
  return (
    <main id="main" className="flex-1 flex items-center justify-center py-24">
      <Container width="narrow">
        <div className="text-center space-y-6">
          <p className="text-sm font-medium text-muted-foreground">Page not found</p>
          <h1 className="text-4xl font-bold text-foreground">
            This page doesn't exist
          </h1>
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

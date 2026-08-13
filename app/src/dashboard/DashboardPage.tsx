import { useState, type FormEvent } from "react";
import { type AuthUser } from "wasp/auth";
import { useQuery, getNotes, createNote, deleteNote } from "wasp/client/operations";
import { Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Container,
  EmptyState,
  Field,
  Heading,
  Input,
  Section,
  Skeleton,
} from "../client/components/ui";
import PageMeta from "../client/components/PageMeta";

/*
 * The query exemplar: getNotes rendered through its three states — loading
 * (<Skeleton/>), error (<Alert/>), and empty (<EmptyState/>) — with a form
 * calling createNote/deleteNote. Pairs with src/notes/operations.ts. Every
 * useQuery consumer handles all three states; copy this shape (see
 * docs/frontend.md). Replace this card with your app.
 */
export default function DashboardPage({ user }: { user: AuthUser }) {
  const name = user.displayName || user.email || user.username || "there";
  const { data: notes, isLoading, error } = useQuery(getNotes);

  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setPending(true);
    setFormError(null);
    try {
      await createNote({ text });
      setText("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add the note");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: number) {
    setFormError(null);
    try {
      await deleteNote({ id });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete the note");
    }
  }

  return (
    <main id="main" className="flex-1">
      <PageMeta title="Dashboard" />
      <Section density="compact">
        <Container width="narrow">
          <Heading as="h1" size="h1">Welcome, {name}</Heading>
          <p className="mt-3 text-muted-foreground">
            This is your app's home once someone signs in.
          </p>

          <Card className="mt-8" padding="lg">
            <Heading as="h2" size="h4">
              Notes
            </Heading>
            <p className="mt-2 text-sm text-muted-foreground">
              A tiny per-user list — the reference for a query with loading,
              empty, and error states.
            </p>

            <form onSubmit={onSubmit} className="mt-6 flex items-end gap-3">
              <Field label="New note" htmlFor="note" className="flex-1">
                <Input
                  id="note"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write something to remember"
                  maxLength={500}
                />
              </Field>
              <Button type="submit" loading={pending} loadingText="Adding…">
                Add
              </Button>
            </form>

            {formError && (
              <Alert variant="error" className="mt-4">
                {formError}
              </Alert>
            )}

            <div className="mt-6">
              {isLoading ? (
                <Skeleton lines={3} />
              ) : error ? (
                <Alert variant="error">
                  Could not load your notes. Reload to try again.
                </Alert>
              ) : notes && notes.length > 0 ? (
                <ul className="divide-y divide-border">
                  {notes.map((note) => (
                    <li key={note.id} className="flex items-center gap-3 py-3">
                      <span className="flex-1 text-sm text-foreground">{note.text}</span>
                      <Button
                        size="sm"
                        variant="ghost-secondary"
                        aria-label="Delete note"
                        onClick={() => onDelete(note.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No notes yet">Add the first one above.</EmptyState>
              )}
            </div>
          </Card>

          <Card className="mt-6" padding="lg">
            <Heading as="h2" size="h4">
              Make it yours
            </Heading>
            <p className="mt-2 text-sm text-muted-foreground">
              Run{" "}
              <code className="rounded-control bg-muted px-1.5 py-0.5 font-mono text-xs">
                /prototype
              </code>{" "}
              in Claude Code to turn an idea brief into working screens, then{" "}
              <code className="rounded-control bg-muted px-1.5 py-0.5 font-mono text-xs">
                /brand
              </code>{" "}
              to restyle it. Replace the notes card above with your app.
            </p>
          </Card>
        </Container>
      </Section>
    </main>
  );
}

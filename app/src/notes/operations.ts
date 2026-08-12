import { HttpError } from "wasp/server";
import {
  type GetNotes,
  type CreateNote,
  type DeleteNote,
} from "wasp/server/operations";
import { type Note } from "wasp/entities";
import * as z from "zod";

/*
 * The query exemplar — the read-side counterpart to src/user/operations.ts.
 * Same three rules (auth first, zod-parse input, scope every read/write to
 * context.user.id), shown for a query and its list mutations. The dashboard
 * renders this through loading / empty / error states; copy both together.
 */

// no-input:
export const getNotes: GetNotes<void, Note[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.Note.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

const createNoteInputSchema = z.object({
  text: z.string().trim().min(1, "Note cannot be empty").max(500),
});

type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const createNote: CreateNote<CreateNoteInput, Note> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { text } = createNoteInputSchema.parse(rawArgs);

  return context.entities.Note.create({
    data: { text, userId: context.user.id },
  });
};

const deleteNoteInputSchema = z.object({
  id: z.number().int(),
});

type DeleteNoteInput = z.infer<typeof deleteNoteInputSchema>;

export const deleteNote: DeleteNote<DeleteNoteInput, void> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { id } = deleteNoteInputSchema.parse(rawArgs);

  // deleteMany with the owner in the filter: a note id from the client can
  // never delete another user's row (IDOR-safe). See docs/security.md.
  await context.entities.Note.deleteMany({
    where: { id, userId: context.user.id },
  });
};

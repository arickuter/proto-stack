import { HttpError } from "wasp/server";
import { type UpdateDisplayName } from "wasp/server/operations";
import { type User } from "wasp/entities";
import * as z from "zod";

/*
 * The reference operation. Every operation in this codebase follows this
 * shape — copy it when you add your own (see docs/security.md):
 *
 *   1. A zod schema for the input, parsed before anything else. Never trust
 *      the raw client payload.
 *   2. An auth check as the FIRST statement. Wasp exposes a callable endpoint
 *      for every declared operation, so this is the real security boundary —
 *      `authRequired: true` on a route only gates the page, not the data.
 *   3. All reads/writes scoped to `context.user.id`. Never accept an entity id
 *      from the client as proof of ownership (that is the classic IDOR bug).
 */

const updateDisplayNameInputSchema = z.object({
  displayName: z.string().trim().min(1, "Display name cannot be empty").max(80),
});

type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameInputSchema>;

export const updateDisplayName: UpdateDisplayName<
  UpdateDisplayNameInput,
  User
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { displayName } = updateDisplayNameInputSchema.parse(rawArgs);

  return context.entities.User.update({
    where: { id: context.user.id },
    data: { displayName },
  });
};

import { defineUserSignupFields } from "wasp/auth/providers/types";
import { z } from "zod";

// Emails that become admins at signup. Read server-side, where .env.server is
// natively loaded (unlike main.wasp.ts, which reads the file itself).
const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];

const emailDataSchema = z.object({
  email: z.string(),
});

export const getEmailUserFields = defineUserSignupFields({
  email: (data) => emailDataSchema.parse(data).email,
  username: (data) => emailDataSchema.parse(data).email,
  isAdmin: (data) => adminEmails.includes(emailDataSchema.parse(data).email),
});

const googleDataSchema = z.object({
  profile: z.object({
    email: z.string(),
    email_verified: z.boolean(),
  }),
});

export const getGoogleUserFields = defineUserSignupFields({
  email: (data) => googleDataSchema.parse(data).profile.email,
  username: (data) => googleDataSchema.parse(data).profile.email,
  isAdmin: (data) => {
    const { email, email_verified } = googleDataSchema.parse(data).profile;
    return email_verified && adminEmails.includes(email);
  },
});

export function getGoogleAuthConfig() {
  // 'profile' is required by Google; 'email' gives us the address.
  return { scopes: ["profile", "email"] };
}

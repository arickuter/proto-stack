import { Link } from "react-router";
import { ResetPasswordForm } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";
import PageMeta from "../../client/components/PageMeta";

export function PasswordResetPage() {
  return (
    <AuthPageLayout>
      <PageMeta title="Set a new password" noindex />
      <ResetPasswordForm />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/login" className="text-primary underline">
          Back to log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}

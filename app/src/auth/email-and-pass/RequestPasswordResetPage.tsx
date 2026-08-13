import { Link } from "react-router";
import { ForgotPasswordForm } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";
import PageMeta from "../../client/components/PageMeta";

export function RequestPasswordResetPage() {
  return (
    <AuthPageLayout>
      <PageMeta title="Reset password" noindex />
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link to="/login" className="text-primary underline">
          Log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}

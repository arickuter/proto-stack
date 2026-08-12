import { Link } from "react-router";
import { ResetPasswordForm } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";

export function PasswordResetPage() {
  return (
    <AuthPageLayout>
      <ResetPasswordForm />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/login" className="text-primary underline">
          Back to log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}

import { Link } from "react-router";
import { VerifyEmailForm } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";

export function EmailVerificationPage() {
  return (
    <AuthPageLayout>
      <VerifyEmailForm />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/login" className="text-primary underline">
          Back to log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}

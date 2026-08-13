import { Link } from "react-router";
import { VerifyEmailForm } from "wasp/client/auth";
import { AuthPageLayout } from "../AuthPageLayout";
import PageMeta from "../../client/components/PageMeta";

export function EmailVerificationPage() {
  return (
    <AuthPageLayout>
      <PageMeta title="Verify your email" noindex />
      <VerifyEmailForm />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/login" className="text-primary underline">
          Back to log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}

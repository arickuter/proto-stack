import { Link } from "react-router";
import { SignupForm } from "wasp/client/auth";
import { AuthPageLayout } from "./AuthPageLayout";
import PageMeta from "../client/components/PageMeta";

export default function SignupPage() {
  return (
    <AuthPageLayout>
      <PageMeta title="Sign up" />
      <SignupForm />
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary underline">
          Log in
        </Link>
      </p>
    </AuthPageLayout>
  );
}

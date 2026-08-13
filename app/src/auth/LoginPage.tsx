import { Link } from "react-router";
import { LoginForm } from "wasp/client/auth";
import { AuthPageLayout } from "./AuthPageLayout";
import PageMeta from "../client/components/PageMeta";

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <PageMeta title="Log in" />
      <LoginForm />
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p>
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary underline">
            Sign up
          </Link>
        </p>
        <p>
          Forgot your password?{" "}
          <Link to="/request-password-reset" className="text-primary underline">
            Reset it
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}

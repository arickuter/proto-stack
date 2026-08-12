import { Link, useLocation } from "react-router";
import { useAuth, logout } from "wasp/client/auth";
import { APP_NAME } from "../../shared/app";
import { Button, Container, NavLink } from "./ui";

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/request-password-reset",
  "/password-reset",
  "/email-verification",
]);

export default function NavBar() {
  const location = useLocation();
  const { data: user } = useAuth();
  const isAuthRoute = AUTH_ROUTES.has(location.pathname);

  return (
    <header className="border-b border-border">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
            {APP_NAME}
          </Link>

          {/* On auth pages, keep the chrome to just the wordmark. */}
          {!isAuthRoute && (
            <nav className="flex items-center gap-4 sm:gap-6">
              {user ? (
                <>
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  <NavLink href="/account">Account</NavLink>
                  <Button size="sm" variant="ghost" onClick={() => logout()}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <NavLink href="/login">Log in</NavLink>
                  <Button size="sm" href="/signup">
                    Get started
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
      </Container>
    </header>
  );
}

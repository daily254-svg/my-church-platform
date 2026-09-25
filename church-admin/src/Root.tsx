import AuthenticatedApp from "./App";
import AcceptInvite from "./pages/AcceptInvite";

export default function Root() {
  if (window.location.pathname === "/accept-invite") {
    return <AcceptInvite />;
  }
  return <AuthenticatedApp />;
}

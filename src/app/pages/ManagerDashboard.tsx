import { Navigate } from "react-router";

export function ManagerDashboard() {
  // Redirect Manager directly to Community Chat as they no longer have a dashboard
  return <Navigate to="/app/community" replace />;
}


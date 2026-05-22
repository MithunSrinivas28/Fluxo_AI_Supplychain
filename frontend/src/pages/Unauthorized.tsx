import { useLocation, Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="text-center max-w-md bg-card border border-border/40 p-8 rounded-xl shadow-card">
        <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive flex items-center justify-center rounded-full mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="mb-2 text-2xl font-display font-semibold text-foreground">Access Denied</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          You do not have permission to view <span className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">{location.state?.from || location.pathname}</span>.
          Please contact an administrator if you believe this is a mistake.
        </p>
        <Button asChild className="w-full">
          <Link to="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;

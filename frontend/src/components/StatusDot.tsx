import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "online" | "warning" | "offline" | "completed" | "pending" | "failed" | "processing"
    | "healthy" | "low" | "critical" | "approved" | "shipped" | "delivered" | "rejected";
  className?: string;
}

const colorMap: Record<string, string> = {
  online: "bg-success",
  completed: "bg-success",
  delivered: "bg-success",
  healthy: "bg-success",
  approved: "bg-teal",
  shipped: "bg-primary",
  processing: "bg-teal",
  warning: "bg-amber",
  pending: "bg-amber",
  low: "bg-amber",
  offline: "bg-destructive",
  failed: "bg-destructive",
  rejected: "bg-destructive",
  critical: "bg-destructive",
};

export const StatusDot = ({ status, className }: StatusDotProps) => (
  <span className={cn("inline-block h-2 w-2 rounded-full", colorMap[status] ?? "bg-muted-foreground", className)} />
);

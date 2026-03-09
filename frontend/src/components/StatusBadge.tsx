import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const variantMap: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  delivered: "bg-success/10 text-success border-success/20",
  healthy: "bg-success/10 text-success border-success/20",
  online: "bg-success/10 text-success border-success/20",
  approved: "bg-teal/10 text-teal border-teal/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  processing: "bg-teal/10 text-teal border-teal/20",
  pending: "bg-amber/10 text-amber border-amber/20",
  warning: "bg-amber/10 text-amber border-amber/20",
  low: "bg-amber/10 text-amber border-amber/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  offline: "bg-destructive/10 text-destructive border-destructive/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => (
  <Badge variant="outline" className={cn("capitalize font-medium text-xs", variantMap[status] ?? "", className)}>
    {status}
  </Badge>
);

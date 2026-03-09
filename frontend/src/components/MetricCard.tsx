import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import type { MetricData } from "@/types";

export const MetricCard = ({ label, value, trend, trendLabel }: MetricData) => {
  const positive = trend >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="shadow-card border-border/60">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {positive ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span className={positive ? "text-success" : "text-destructive"}>
              {positive ? "+" : ""}
              {trend}%
            </span>
            <span className="text-muted-foreground ml-1">{trendLabel}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

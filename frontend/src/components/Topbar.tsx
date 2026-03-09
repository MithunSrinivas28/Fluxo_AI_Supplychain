import { Bell, LogOut, User, Settings, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  title: string;
}

export const Topbar = ({ title }: TopbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />
        <h1 className="text-base font-display font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              <Avatar className="h-8 w-8 border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow">
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 text-xs cursor-pointer">
              <User className="h-3.5 w-3.5" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 text-xs cursor-pointer">
              <Settings className="h-3.5 w-3.5" /> Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 text-xs cursor-pointer">
              <History className="h-3.5 w-3.5" /> Activity Log
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

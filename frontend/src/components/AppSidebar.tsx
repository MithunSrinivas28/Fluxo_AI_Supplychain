import { LayoutDashboard, ShoppingCart, Package, ShieldCheck, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import fluxoLogo from "@/assets/fluxo-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "retailer", "warehouse"] },
  { title: "Requests", url: "/requests", icon: ShoppingCart, roles: ["admin", "retailer"] },
  { title: "Inventory", url: "/inventory", icon: Package, roles: ["admin", "warehouse"] },
  { title: "Company Settings", url: "/admin", icon: ShieldCheck, roles: ["admin"] },
  { title: "Profile", url: "/profile", icon: User, roles: ["admin", "retailer", "warehouse"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  const isItemActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        {!collapsed && (
          <img src={fluxoLogo} alt="FluxoAI" className="h-8 object-contain" />
        )}
        {collapsed && <img src={fluxoLogo} alt="FluxoAI" className="h-6 object-contain" />}
      </div>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const active = isItemActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-primary"
                            : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${active ? "text-primary" : ""}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

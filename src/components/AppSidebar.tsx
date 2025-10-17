import { Home, User, CreditCard, LogOut, Trash2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
    });
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Delete user data from profiles table
          await supabase.from("profiles").delete().eq("id", user.id);
          
          toast({
            title: "Account deleted successfully",
            description: "Your account and all associated data have been removed.",
          });
          
          await supabase.auth.signOut();
          navigate("/");
        }
      } catch (error) {
        toast({
          title: "Error deleting account",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    }
  };

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Profile", url: "/profile", icon: User },
    { title: "Billing Information", url: "/billing", icon: CreditCard },
  ];

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
      isActive
        ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
    }`;

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-foreground">D-GEN</h1>
        <p className="text-sm text-sidebar-foreground/70">Learning Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/dashboard"}
            className={getNavCls}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout & Delete Account */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-sidebar-foreground hover:bg-sidebar-accent/50 transition-smooth"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-destructive hover:bg-destructive/10 transition-smooth"
        >
          <Trash2 className="w-5 h-5" />
          <span>Delete Account</span>
        </button>
      </div>
    </aside>
  );
}

import { Link, useLocation } from "wouter";
import { Home, Target, Book, Activity, Gamepad2, Compass, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const navItems = [
    { path: "/", icon: Home, label: "Mind Home" },
    { path: "/goals", icon: Target, label: "Mind Goals" },
    { path: "/knowledge", icon: Book, label: "Knowledge Bank" },
    { path: "/recreation", icon: Activity, label: "Recreation" },
    { path: "/games", icon: Gamepad2, label: "PlayZone" },
    { path: "/discovery", icon: Compass, label: "Discovery" },
  ];

  return (
    <div className="w-64 glass-card m-4 mr-2 rounded-2xl p-6 flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="flex items-center space-x-3 mb-8" data-testid="logo">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
          <GraduationCap className="text-white text-lg" />
        </div>
        <span className="text-white font-bold text-xl">EduMind</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2" data-testid="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "nav-item flex items-center space-x-3 px-4 py-3 rounded-xl text-white/90 hover:text-white cursor-pointer",
                  isActive && "bg-white/20"
                )}
                data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto" data-testid="user-profile">
        <div className="flex items-center space-x-3 px-4 py-3 glass-card rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-r from-accent to-secondary rounded-full flex items-center justify-center">
            <User className="text-white" />
          </div>
          <div>
            <div className="text-white font-medium text-sm" data-testid="user-name">
              {user?.username || "AstroBeth"}
            </div>
            <div className="text-white/70 text-xs" data-testid="user-level">
              Level {user?.level || 7} Explorer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

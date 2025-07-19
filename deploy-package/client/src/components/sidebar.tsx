import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  User, 
  Users, 
  Settings,
  BarChart3,
  FileText
} from "lucide-react";

interface SidebarProps {
  role: "student" | "counsellor" | "admin";
  activeView: string;
  setActiveView: (view: string) => void;
}

const sidebarItems = {
  student: [
    { id: "overview", label: "Overview", icon: Home },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: User },
  ],
  counsellor: [
    { id: "overview", label: "Overview", icon: Home },
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "students", label: "Students", icon: Users },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: Home },
    { id: "users", label: "Users", icon: Users },
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings },
  ],
};

export default function Sidebar({ role, activeView, setActiveView }: SidebarProps) {
  const items = sidebarItems[role];

  return (
    <div className="w-64 bg-white border-r border-neutral-200 min-h-screen">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 capitalize">
          {role} Dashboard
        </h2>
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeView === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
                )}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
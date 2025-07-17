import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  User, 
  Users, 
  CalendarCheck,
  Folder,
  TrendingUp,
  UserCog,
  ClipboardList,
  Database,
  Settings
} from "lucide-react";

interface SidebarProps {
  role: "student" | "counsellor" | "admin";
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Sidebar({ role, activeView, setActiveView }: SidebarProps) {
  const getNavigationItems = () => {
    switch (role) {
      case "student":
        return [
          { id: "overview", icon: Home, label: "Overview" },
          { id: "resources", icon: BookOpen, label: "CBT Resources" },
          { id: "sessions", icon: Calendar, label: "My Sessions" },
          { id: "messages", icon: MessageSquare, label: "Messages" },
          { id: "profile", icon: User, label: "Profile" },
        ];
      case "counsellor":
        return [
          { id: "overview", icon: Home, label: "Overview" },
          { id: "sessions", icon: CalendarCheck, label: "Appointments" },
          { id: "students", icon: Users, label: "My Students" },
          { id: "resources", icon: Folder, label: "Resources" },
          { id: "messages", icon: MessageSquare, label: "Messages" },
        ];
      case "admin":
        return [
          { id: "overview", icon: TrendingUp, label: "Analytics" },
          { id: "users", icon: UserCog, label: "User Management" },
          { id: "sessions", icon: ClipboardList, label: "Sessions" },
          { id: "resources", icon: Database, label: "Resources" },
          { id: "settings", icon: Settings, label: "Settings" },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();
  const roleLabels = {
    student: "Student Dashboard",
    counsellor: "Counsellor Dashboard",
    admin: "Admin Dashboard"
  };

  return (
    <nav className="w-64 bg-white shadow-lg border-r border-neutral-200 flex-shrink-0">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">
            {roleLabels[role]}
          </h2>
          <div className="space-y-2">
            {navigationItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  activeView === id
                    ? "bg-primary bg-opacity-10 text-primary"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

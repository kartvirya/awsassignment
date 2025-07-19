import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import StudentOverview from "@/components/student/overview";
import StudentResources from "@/components/student/resources";
import StudentSessions from "@/components/student/sessions";
import StudentMessages from "@/components/student/messages";
import StudentProfile from "@/components/student/profile";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("overview");

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <StudentOverview setActiveView={setActiveView} />;
      case "resources":
        return <StudentResources />;
      case "sessions":
        return <StudentSessions />;
      case "messages":
        return <StudentMessages />;
      case "profile":
        return <StudentProfile />;
      default:
        return <StudentOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar 
          role="student" 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <main className="flex-1 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

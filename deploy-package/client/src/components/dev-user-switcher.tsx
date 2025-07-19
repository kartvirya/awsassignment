import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Eye } from "lucide-react";

interface DevUserSwitcherProps {
  onUserSelect: (userId: string) => void;
  currentUserId?: string;
}

const sampleUsers = [
  // Students
  {
    id: "student1",
    name: "Alice Johnson",
    email: "alice.johnson@email.com",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b36d1d5a?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "student2",
    name: "Bob Smith",
    email: "bob.smith@email.com",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "student3",
    name: "Emma Davis",
    email: "emma.davis@email.com",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  },
  // Counsellors
  {
    id: "counsellor1",
    name: "Dr. Sarah Wilson",
    email: "dr.sarah.wilson@email.com",
    role: "counsellor",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "counsellor2",
    name: "Dr. Michael Brown",
    email: "dr.michael.brown@email.com",
    role: "counsellor",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "counsellor3",
    name: "Dr. Lisa Garcia",
    email: "dr.lisa.garcia@email.com",
    role: "counsellor",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face"
  },
  // Admins
  {
    id: "admin1",
    name: "Admin Jones",
    email: "admin.jones@email.com",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "admin2",
    name: "Admin Taylor",
    email: "admin.taylor@email.com",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"
  }
];

export default function DevUserSwitcher({ onUserSelect, currentUserId }: DevUserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student": return "bg-blue-100 text-blue-800";
      case "counsellor": return "bg-green-100 text-green-800";
      case "admin": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const groupedUsers = sampleUsers.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, typeof sampleUsers>);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
        >
          <Settings className="h-4 w-4 mr-2" />
          Dev Mode
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-96 overflow-y-auto shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Switch User (Dev Mode)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedUsers).map(([role, users]) => (
            <div key={role}>
              <h4 className="font-medium text-sm text-neutral-600 mb-2 capitalize">
                {role}s
              </h4>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
                      currentUserId === user.id 
                        ? "bg-blue-50 border-blue-200" 
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-neutral-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onUserSelect(user.id)}
                        className="h-6 w-6 p-0"
                        disabled={currentUserId === user.id}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
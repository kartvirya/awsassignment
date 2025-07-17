import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Calendar, Trophy, BookOpen } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions/student"],
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
  });

  const completedSessions = sessions.filter((session: any) => 
    session.status === "completed"
  ).length;

  const resourcesAccessed = progress.length;
  const achievements = Math.floor(completedSessions / 2);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getDisplayName = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "User";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Profile</h1>
        <p className="text-neutral-600">Manage your account and view your progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="lg:col-span-2 border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
                <AvatarFallback className="bg-primary text-white text-xl">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">
                  {getDisplayName(user?.firstName, user?.lastName)}
                </h3>
                <Badge className="bg-blue-100 text-blue-800 mt-2">
                  Student
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Full Name</p>
                  <p className="text-sm text-neutral-600">
                    {getDisplayName(user?.firstName, user?.lastName)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Email</p>
                  <p className="text-sm text-neutral-600">{user?.email || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Member Since</p>
                  <p className="text-sm text-neutral-600">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Recently joined"
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="p-4 bg-primary bg-opacity-10 rounded-full w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {achievements} Achievement{achievements !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-neutral-600">Milestones reached</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="p-3 bg-secondary bg-opacity-10 rounded-lg mb-2">
                    <Calendar className="h-6 w-6 text-secondary mx-auto" />
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">{completedSessions}</p>
                  <p className="text-xs text-neutral-600">Sessions</p>
                </div>

                <div className="text-center">
                  <div className="p-3 bg-accent bg-opacity-10 rounded-lg mb-2">
                    <BookOpen className="h-6 w-6 text-accent mx-auto" />
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">{resourcesAccessed}</p>
                  <p className="text-xs text-neutral-600">Resources</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-900">Overall Progress</span>
                  <span className="text-sm text-neutral-600">
                    {Math.min(85, (completedSessions * 10) + (resourcesAccessed * 5))}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(85, (completedSessions * 10) + (resourcesAccessed * 5))}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

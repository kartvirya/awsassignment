import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CalendarCheck, 
  BookOpen, 
  Trophy, 
  Heart,
  Play,
  FileText,
  Headphones
} from "lucide-react";

export default function StudentOverview() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions/student"],
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["/api/resources"],
  });

  const upcomingSessions = sessions.filter((session: any) => 
    session.status === "confirmed" && new Date(session.scheduledAt) > new Date()
  ).slice(0, 2);

  const completedSessions = sessions.filter((session: any) => 
    session.status === "completed"
  ).length;

  const resourcesAccessed = progress.length;
  const achievements = Math.floor(completedSessions / 2);
  const progressScore = Math.min(85, (completedSessions * 10) + (resourcesAccessed * 5));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">
          Welcome back!
        </h1>
        <p className="text-neutral-600">Here's your journey at a glance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary bg-opacity-10 rounded-full">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Completed Sessions</p>
                <p className="text-2xl font-bold text-neutral-900">{completedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary bg-opacity-10 rounded-full">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Resources Accessed</p>
                <p className="text-2xl font-bold text-neutral-900">{resourcesAccessed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent bg-opacity-10 rounded-full">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Achievements</p>
                <p className="text-2xl font-bold text-neutral-900">{achievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 bg-opacity-10 rounded-full">
                <Heart className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Progress Score</p>
                <p className="text-2xl font-bold text-neutral-900">{progressScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          Dr
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-neutral-800">
                          Counselling Session
                        </p>
                        <p className="text-xs text-neutral-600">
                          {new Date(session.scheduledAt).toLocaleDateString()} at{" "}
                          {new Date(session.scheduledAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p>No upcoming sessions</p>
                </div>
              )}
            </div>
            <Button className="mt-4 w-full bg-primary text-white hover:bg-primary/90">
              Book New Session
            </Button>
          </CardContent>
        </Card>

        {/* Recent Resources */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resources.slice(0, 3).map((resource: any) => (
                <div key={resource.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-secondary bg-opacity-10 rounded-lg">
                      {resource.type === "video" && <Play className="h-4 w-4 text-secondary" />}
                      {resource.type === "worksheet" && <FileText className="h-4 w-4 text-accent" />}
                      {resource.type === "audio" && <Headphones className="h-4 w-4 text-primary" />}
                      {resource.type === "interactive" && <BookOpen className="h-4 w-4 text-purple-500" />}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-800">
                        {resource.title}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        {resource.duration && ` • ${resource.duration} min`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-secondary">
                    {resource.type === "video" ? "Watch" : 
                     resource.type === "audio" ? "Listen" : "Open"}
                  </Button>
                </div>
              ))}
              {resources.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p>No resources available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

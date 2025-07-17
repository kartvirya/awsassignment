import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";

interface StudentOverviewProps {
  setActiveView?: (view: string) => void;
}

export default function StudentOverview({ setActiveView }: StudentOverviewProps) {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions/student"],
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/messages/conversations"],
  });

  const upcomingSessions = sessions?.filter(
    (session: any) => 
      session.status === "confirmed" && 
      new Date(session.scheduledAt) > new Date()
  ).slice(0, 3) || [];

  const completedResourcesCount = progress?.filter(
    (p: any) => p.progress === 100
  ).length || 0;

  const totalResourcesCount = resources?.length || 0;
  const progressPercentage = totalResourcesCount > 0 
    ? Math.round((completedResourcesCount / totalResourcesCount) * 100)
    : 0;

  const recentProgress = progress?.slice(0, 3) || [];
  const unreadMessages = conversations?.filter(
    (msg: any) => msg.status === "sent" && msg.receiverId === msg.userId
  ).length || 0;

  if (sessionsLoading || progressLoading || resourcesLoading || conversationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-neutral-600">Track your progress and upcoming activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{upcomingSessions.length}</div>
            <p className="text-sm text-neutral-500">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Resources Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{progressPercentage}%</div>
            <p className="text-sm text-neutral-500">
              {completedResourcesCount} of {totalResourcesCount} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadMessages}</div>
            <p className="text-sm text-neutral-500">Unread messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {sessions?.filter((s: any) => s.status === "completed").length || 0}
            </div>
            <p className="text-sm text-neutral-500">Sessions completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>No upcoming sessions scheduled</p>
                <Button 
                  className="mt-4" 
                  size="sm"
                  onClick={() => setActiveView?.("sessions")}
                >
                  Book a Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {session.type === "individual" ? "Individual Session" : "Group Session"}
                      </div>
                      <div className="text-sm text-neutral-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(session.scheduledAt), "PPp")}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Recent Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProgress.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>No resources accessed yet</p>
                <Button 
                  className="mt-4" 
                  size="sm"
                  onClick={() => setActiveView?.("resources")}
                >
                  Explore Resources
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProgress.map((item: any) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-neutral-900">
                        Resource #{item.resourceId}
                      </div>
                      <div className="flex items-center text-sm text-neutral-600">
                        {item.progress === 100 ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-1 text-orange-600" />
                        )}
                        {item.progress}%
                      </div>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("sessions")}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Session
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("resources")}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Browse Resources
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("messages")}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
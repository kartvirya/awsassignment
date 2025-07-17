import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { format } from "date-fns";

export default function CounsellorOverview() {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions/counsellor"],
  });

  const { data: pendingSessions, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/sessions/pending"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/users/role/student"],
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

  const completedSessions = sessions?.filter((s: any) => s.status === "completed").length || 0;
  const totalSessions = sessions?.length || 0;
  const activeStudents = students?.filter((s: any) => 
    sessions?.some((session: any) => session.studentId === s.id)
  ).length || 0;
  const unreadMessages = conversations?.filter(
    (msg: any) => msg.status === "sent" && msg.senderId !== msg.userId
  ).length || 0;

  if (sessionsLoading || pendingLoading || studentsLoading || resourcesLoading || conversationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
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
        <h1 className="text-2xl font-bold text-neutral-900">Counsellor Dashboard</h1>
        <p className="text-neutral-600">Monitor your sessions and student progress</p>
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
            <p className="text-sm text-neutral-500">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
            <p className="text-sm text-neutral-500">Currently helping</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Pending Messages
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
              Completed Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{completedSessions}</div>
            <p className="text-sm text-neutral-500">This month</p>
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
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">
                        Student #{session.studentId}
                      </div>
                      <div className="text-sm text-neutral-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(session.scheduledAt), "PPp")}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {session.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Session Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSessions?.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>No pending session requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSessions?.slice(0, 3).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">
                        Student #{session.studentId}
                      </div>
                      <div className="text-sm text-neutral-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(session.scheduledAt), "PPp")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="flex items-center justify-center py-6">
              <Plus className="h-5 w-5 mr-2" />
              Add Resource
            </Button>
            <Button variant="outline" className="flex items-center justify-center py-6">
              <MessageSquare className="h-5 w-5 mr-2" />
              Check Messages
            </Button>
            <Button variant="outline" className="flex items-center justify-center py-6">
              <Users className="h-5 w-5 mr-2" />
              View Students
            </Button>
            <Button variant="outline" className="flex items-center justify-center py-6">
              <Calendar className="h-5 w-5 mr-2" />
              Manage Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
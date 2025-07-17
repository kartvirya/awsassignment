import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp,
  User,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function CounsellorOverview() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions/counsellor"],
  });

  const { data: pendingSessions = [] } = useQuery({
    queryKey: ["/api/sessions/pending"],
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/users/role/student"],
  });

  const today = new Date().toDateString();
  const todaySessions = sessions.filter((session: any) => 
    new Date(session.scheduledAt).toDateString() === today
  );

  const thisWeekSessions = sessions.filter((session: any) => {
    const sessionDate = new Date(session.scheduledAt);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return sessionDate >= weekStart;
  });

  const completedSessions = sessions.filter((session: any) => 
    session.status === "completed"
  );

  const successRate = sessions.length > 0 
    ? Math.round((completedSessions.length / sessions.length) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary";
      case "pending":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-neutral-400";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">
          Counsellor Dashboard
        </h1>
        <p className="text-neutral-600">Manage your appointments and student progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary bg-opacity-10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Active Students</p>
                <p className="text-2xl font-bold text-neutral-900">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary bg-opacity-10 rounded-full">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Sessions This Week</p>
                <p className="text-2xl font-bold text-neutral-900">{thisWeekSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent bg-opacity-10 rounded-full">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Pending Requests</p>
                <p className="text-2xl font-bold text-neutral-900">{pendingSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 bg-opacity-10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Success Rate</p>
                <p className="text-2xl font-bold text-neutral-900">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySessions.length > 0 ? (
                todaySessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(session.status)}`}></div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">
                          {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
                        </p>
                        <p className="text-xs text-neutral-600">
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
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p>No sessions scheduled for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSessions.length > 0 ? (
                pendingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-neutral-800">
                          {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
                        </p>
                        <p className="text-xs text-neutral-600">
                          {new Date(session.scheduledAt).toLocaleDateString()} at{" "}
                          {new Date(session.scheduledAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p>No pending requests</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

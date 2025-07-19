import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  UserCheck,
  UserPlus,
  ShieldAlert,
  BarChart3
} from "lucide-react";

interface AdminOverviewProps {
  setActiveView?: (view: string) => void;
}

export default function AdminOverview({ setActiveView }: AdminOverviewProps) {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions/all"],
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const totalUsers = users?.length || 0;
  const studentCount = users?.filter((u: any) => u.role === "student").length || 0;
  const counsellorCount = users?.filter((u: any) => u.role === "counsellor").length || 0;
  const adminCount = users?.filter((u: any) => u.role === "admin").length || 0;

  const totalSessions = sessions?.length || 0;
  const completedSessions = sessions?.filter((s: any) => s.status === "completed").length || 0;
  const pendingSessions = sessions?.filter((s: any) => s.status === "pending").length || 0;
  const confirmedSessions = sessions?.filter((s: any) => s.status === "confirmed").length || 0;

  const totalResources = resources?.length || 0;
  const totalMessages = conversations?.length || 0;

  const sessionCompletionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const resourceUsageRate = systemStats?.resourceUsage || 0;
  const userEngagementRate = systemStats?.userEngagement || 0;

  const recentUsers = users?.slice(-5) || [];
  const recentSessions = sessions?.slice(-5) || [];

  if (usersLoading || sessionsLoading || resourcesLoading || conversationsLoading || statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-neutral-600">System overview and management</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalUsers}</div>
            <p className="text-sm text-neutral-500">Active platform users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{studentCount}</div>
            <p className="text-sm text-neutral-500">{Math.round((studentCount / totalUsers) * 100)}% of users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Counsellors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counsellorCount}</div>
            <p className="text-sm text-neutral-500">{Math.round((counsellorCount / totalUsers) * 100)}% of users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{adminCount}</div>
            <p className="text-sm text-neutral-500">{Math.round((adminCount / totalUsers) * 100)}% of users</p>
          </CardContent>
        </Card>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalSessions}</div>
            <p className="text-sm text-neutral-500">All time sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
            <p className="text-sm text-neutral-500">{sessionCompletionRate}% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalResources}</div>
            <p className="text-sm text-neutral-500">{resourceUsageRate}% usage rate</p>
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
            <div className="text-2xl font-bold text-blue-600">{totalMessages}</div>
            <p className="text-sm text-neutral-500">Total conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Platform Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Session Completion Rate</span>
                <span className="text-sm text-neutral-500">{sessionCompletionRate}%</span>
              </div>
              <Progress value={sessionCompletionRate} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Resource Usage</span>
                <span className="text-sm text-neutral-500">{resourceUsageRate}%</span>
              </div>
              <Progress value={resourceUsageRate} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">User Engagement</span>
                <span className="text-sm text-neutral-500">{userEngagementRate}%</span>
              </div>
              <Progress value={userEngagementRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                <p>No recent users</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-neutral-600">{user.email}</div>
                    </div>
                    <Badge variant="outline" className={
                      user.role === "student" ? "text-green-600 border-green-600" :
                      user.role === "counsellor" ? "text-blue-600 border-blue-600" :
                      "text-red-600 border-red-600"
                    }>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                <p>No recent sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {session.type === "individual" ? "Individual" : "Group"} Session
                      </div>
                      <div className="text-sm text-neutral-600">
                        Student #{session.studentId} - Counsellor #{session.counsellorId}
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      session.status === "completed" ? "text-green-600 border-green-600" :
                      session.status === "confirmed" ? "text-blue-600 border-blue-600" :
                      session.status === "pending" ? "text-yellow-600 border-yellow-600" :
                      "text-red-600 border-red-600"
                    }>
                      {session.status}
                    </Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Button 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("users")}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add User
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("resources")}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Manage Resources
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("sessions")}
            >
              <Calendar className="h-5 w-5 mr-2" />
              View Sessions
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("users")}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              View Analytics
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-6"
              onClick={() => setActiveView?.("settings")}
            >
              <ShieldAlert className="h-5 w-5 mr-2" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
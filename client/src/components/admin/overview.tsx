import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CalendarCheck, 
  Download, 
  TrendingUp,
  UserPlus,
  Calendar,
  Upload
} from "lucide-react";

export default function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions/all"],
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/messages/conversations"],
  });

  const recentSessions = sessions.slice(0, 5);
  const recentActivity = [
    ...sessions.slice(0, 2).map((session: any) => ({
      type: "session",
      message: `Session ${session.status}: ${session.studentName} with ${session.counsellorName}`,
      timestamp: session.scheduledAt,
    })),
    ...conversations.slice(0, 3).map((conv: any) => ({
      type: "message",
      message: `New message from ${conv.senderName}`,
      timestamp: conv.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "session":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "message":
        return <Upload className="h-4 w-4 text-purple-600" />;
      default:
        return <UserPlus className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Admin Analytics</h1>
        <p className="text-neutral-600">Monitor system performance and user engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary bg-opacity-10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Users</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary bg-opacity-10 rounded-full">
                <CalendarCheck className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Sessions</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalSessions || 0}</p>
                <p className="text-xs text-green-600">+8% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent bg-opacity-10 rounded-full">
                <Download className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Resources</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalResources || 0}</p>
                <p className="text-xs text-green-600">+15% from last month</p>
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
                <p className="text-2xl font-bold text-neutral-900">
                  {stats?.totalSessions > 0 
                    ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-green-600">+3% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Distribution */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Students</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${stats?.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    {stats?.totalStudents || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Counsellors</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ 
                        width: `${stats?.totalUsers > 0 ? (stats.totalCounsellors / stats.totalUsers) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    {stats?.totalCounsellors || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Admins</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-accent h-2 rounded-full" 
                      style={{ 
                        width: `${stats?.totalUsers > 0 ? ((stats.totalUsers - stats.totalStudents - stats.totalCounsellors) / stats.totalUsers) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    {stats ? stats.totalUsers - stats.totalStudents - stats.totalCounsellors : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Completed</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats?.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    {stats?.completedSessions || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Pending</span>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats?.totalSessions > 0 ? ((stats.totalSessions - stats.completedSessions) / stats.totalSessions) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    {stats ? stats.totalSessions - stats.completedSessions : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg">Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-neutral-100 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-800">{activity.message}</p>
                      <p className="text-xs text-neutral-600">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

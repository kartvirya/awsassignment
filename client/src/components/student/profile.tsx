import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Mail, 
  Calendar, 
  TrendingUp,
  BookOpen,
  MessageSquare,
  Award,
  Clock,
  CheckCircle,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function StudentProfile() {
  const { user } = useAuth();
  
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

  if (sessionsLoading || progressLoading || resourcesLoading || conversationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-neutral-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const completedSessions = sessions?.filter((s: any) => s.status === "completed").length || 0;
  const totalSessions = sessions?.length || 0;
  const completedResources = progress?.filter((p: any) => p.progress === 100).length || 0;
  const totalResources = resources?.length || 0;
  const totalMessages = conversations?.length || 0;

  const overallProgress = totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;
  const sessionAttendanceRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const joinedDate = user?.createdAt ? new Date(user.createdAt) : new Date();
  const daysSinceJoined = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

  const achievements = [
    {
      id: 1,
      title: "First Session Complete",
      description: "Completed your first counselling session",
      icon: CheckCircle,
      earned: completedSessions > 0,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      id: 2,
      title: "Resource Explorer",
      description: "Accessed 5 different resources",
      icon: BookOpen,
      earned: progress?.length >= 5,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      id: 3,
      title: "Active Communicator",
      description: "Engaged in conversations with counsellors",
      icon: MessageSquare,
      earned: totalMessages > 0,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      id: 4,
      title: "Commitment Champion",
      description: "Maintained 80% session attendance",
      icon: Award,
      earned: sessionAttendanceRate >= 80,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      id: 5,
      title: "Progress Master",
      description: "Completed 50% of available resources",
      icon: TrendingUp,
      earned: overallProgress >= 50,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const nextAchievements = achievements.filter(a => !a.earned);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
        <p className="text-neutral-600">Track your progress and achievements</p>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-neutral-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <Badge variant="outline" className="mt-1">
                {user?.role}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-neutral-600">
                <Mail className="h-4 w-4 mr-2" />
                {user?.email}
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <Calendar className="h-4 w-4 mr-2" />
                Joined {format(joinedDate, "PPP")}
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <Clock className="h-4 w-4 mr-2" />
                {daysSinceJoined} days active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Resource Completion</span>
                    <span className="text-sm text-neutral-500">{completedResources}/{totalResources}</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                  <p className="text-xs text-neutral-500 mt-1">{overallProgress}% completed</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Session Attendance</span>
                    <span className="text-sm text-neutral-500">{completedSessions}/{totalSessions}</span>
                  </div>
                  <Progress value={sessionAttendanceRate} className="h-3" />
                  <p className="text-xs text-neutral-500 mt-1">{sessionAttendanceRate}% attendance rate</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{totalSessions}</div>
                  <p className="text-sm text-neutral-600">Total Sessions</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedResources}</div>
                  <p className="text-sm text-neutral-600">Resources Done</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalMessages}</div>
                  <p className="text-sm text-neutral-600">Conversations</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{earnedAchievements.length}</div>
                  <p className="text-sm text-neutral-600">Achievements</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Achievements Earned ({earnedAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earnedAchievements.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Award className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>No achievements earned yet</p>
                <p className="text-sm">Keep using the platform to unlock achievements!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnedAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div key={achievement.id} className="flex items-center p-3 bg-neutral-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${achievement.bgColor} mr-3`}>
                        <Icon className={`h-5 w-5 ${achievement.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900">{achievement.title}</h4>
                        <p className="text-sm text-neutral-600">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Next Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAchievements.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>All achievements unlocked!</p>
                <p className="text-sm">You're doing great!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nextAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div key={achievement.id} className="flex items-center p-3 border border-neutral-200 rounded-lg opacity-60">
                      <div className="p-2 rounded-lg bg-neutral-100 mr-3">
                        <Icon className="h-5 w-5 text-neutral-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-700">{achievement.title}</h4>
                        <p className="text-sm text-neutral-500">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions?.slice(0, 3).map((session: any) => (
              <div key={session.id} className="flex items-center p-3 bg-neutral-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {session.type === "individual" ? "Individual" : "Group"} Session
                  </p>
                  <p className="text-xs text-neutral-500">
                    {format(new Date(session.scheduledAt), "PPP")}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {session.status}
                </Badge>
              </div>
            ))}

            {progress?.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex items-center p-3 bg-neutral-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    Resource Progress Updated
                  </p>
                  <p className="text-xs text-neutral-500">
                    {item.progress}% completed
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.progress === 100 ? "Complete" : "In Progress"}
                </Badge>
              </div>
            ))}

            {(!sessions?.length && !progress?.length) && (
              <div className="text-center py-8 text-neutral-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
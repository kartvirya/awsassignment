import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter,
  MessageSquare,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

export default function CounsellorStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/users/role/student"],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions/counsellor"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages/conversations"],
  });

  const getStudentSessions = (studentId: string) => {
    return sessions?.filter((session: any) => session.studentId === studentId) || [];
  };

  const getStudentMessages = (studentId: string) => {
    return messages?.filter((message: any) => 
      message.senderId === studentId || message.receiverId === studentId
    ) || [];
  };

  const getStudentStatus = (studentId: string) => {
    const studentSessions = getStudentSessions(studentId);
    const recentSessions = studentSessions.filter((session: any) => {
      const sessionDate = new Date(session.scheduledAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - sessionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    if (recentSessions.length > 0) {
      return "active";
    } else if (studentSessions.length > 0) {
      return "inactive";
    } else {
      return "new";
    }
  };

  const filteredStudents = students?.filter((student: any) => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const studentStatus = getStudentStatus(student.id);
    const matchesStatus = statusFilter === "all" || studentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const statusCounts = {
    total: students?.length || 0,
    active: students?.filter((s: any) => getStudentStatus(s.id) === "active").length || 0,
    inactive: students?.filter((s: any) => getStudentStatus(s.id) === "inactive").length || 0,
    new: students?.filter((s: any) => getStudentStatus(s.id) === "new").length || 0,
  };

  if (studentsLoading || sessionsLoading || messagesLoading) {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Students</h1>
          <p className="text-neutral-600">Manage your assigned students</p>
        </div>
      </div>

      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{statusCounts.total}</div>
            <p className="text-sm text-neutral-500">Under your care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
            <p className="text-sm text-neutral-500">Recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Inactive Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.inactive}</div>
            <p className="text-sm text-neutral-500">Need follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <User className="h-4 w-4 mr-2" />
              New Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.new}</div>
            <p className="text-sm text-neutral-500">Just assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student: any) => {
          const studentSessions = getStudentSessions(student.id);
          const studentMessages = getStudentMessages(student.id);
          const studentStatus = getStudentStatus(student.id);
          const lastSession = studentSessions[studentSessions.length - 1];

          return (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {student.profileImageUrl ? (
                      <img
                        src={student.profileImageUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-neutral-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-neutral-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-neutral-500">ID: {student.id}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    studentStatus === "active" ? "text-green-600 border-green-600" :
                    studentStatus === "inactive" ? "text-yellow-600 border-yellow-600" :
                    "text-blue-600 border-blue-600"
                  }>
                    {studentStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-neutral-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {student.email}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-neutral-400" />
                    <div>
                      <div className="font-medium">{studentSessions.length}</div>
                      <div className="text-neutral-500">Sessions</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-neutral-400" />
                    <div>
                      <div className="font-medium">{studentMessages.length}</div>
                      <div className="text-neutral-500">Messages</div>
                    </div>
                  </div>
                </div>

                {lastSession && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <div className="text-sm font-medium text-neutral-900">Last Session</div>
                    <div className="text-sm text-neutral-600">
                      {format(new Date(lastSession.scheduledAt), "MMM d, yyyy")}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {lastSession.status}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500 mb-4">No students found</p>
          <p className="text-sm text-neutral-400">
            Students will appear here when they are assigned to you
          </p>
        </div>
      )}
    </div>
  );
}
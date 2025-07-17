import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { User, Search, Calendar, MessageSquare, BookOpen } from "lucide-react";

export default function CounsellorStudents() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["/api/users/role/student"],
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ["/api/sessions/counsellor"],
  });

  const filteredStudents = students.filter((student: any) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentSessions = (studentId: string) => {
    return allSessions.filter((session: any) => session.studentId === studentId);
  };

  const getStudentProgress = (studentId: string) => {
    const sessions = getStudentSessions(studentId);
    const completed = sessions.filter((s: any) => s.status === "completed").length;
    const total = sessions.length;
    return { completed, total };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-neutral-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">My Students</h1>
        <p className="text-neutral-600">Manage your student relationships and track progress</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student: any) => {
            const progress = getStudentProgress(student.id);
            const sessions = getStudentSessions(student.id);
            const lastSession = sessions
              .filter((s: any) => s.status === "completed")
              .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];

            return (
              <Card key={student.id} className="border-neutral-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-white">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-neutral-600">{student.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Sessions</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {progress.completed}/{progress.total}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Last Session</span>
                      <span className="text-sm text-neutral-900">
                        {lastSession 
                          ? new Date(lastSession.scheduledAt).toLocaleDateString()
                          : "No sessions yet"
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-primary hover:bg-primary hover:text-white"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Sessions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-secondary hover:bg-secondary hover:text-white"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {searchTerm ? "No students found" : "No students yet"}
            </h3>
            <p className="text-neutral-600">
              {searchTerm 
                ? "Try adjusting your search terms."
                : "Students will appear here once they book sessions with you."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

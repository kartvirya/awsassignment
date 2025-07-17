import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  Users,
  Search, 
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusIcons = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

export default function AdminSessions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/sessions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session Deleted",
        description: "Session has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUserName = (userId: string) => {
    const user = users?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User ${userId}`;
  };

  const filteredSessions = sessions?.filter((session: any) => {
    const studentName = getUserName(session.studentId);
    const counsellorName = getUserName(session.counsellorId);
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         counsellorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    const matchesType = typeFilter === "all" || session.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleDeleteSession = (id: number) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteSessionMutation.mutate(id);
    }
  };

  const sessionStats = {
    total: sessions?.length || 0,
    pending: sessions?.filter((s: any) => s.status === "pending").length || 0,
    confirmed: sessions?.filter((s: any) => s.status === "confirmed").length || 0,
    completed: sessions?.filter((s: any) => s.status === "completed").length || 0,
    cancelled: sessions?.filter((s: any) => s.status === "cancelled").length || 0,
  };

  if (sessionsLoading || usersLoading) {
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
          <h1 className="text-2xl font-bold text-neutral-900">Session Management</h1>
          <p className="text-neutral-600">Monitor and manage all counselling sessions</p>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{sessionStats.total}</div>
            <p className="text-sm text-neutral-500">All sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{sessionStats.pending}</div>
            <p className="text-sm text-neutral-500">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sessionStats.confirmed}</div>
            <p className="text-sm text-neutral-500">Scheduled sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{sessionStats.completed}</div>
            <p className="text-sm text-neutral-500">Finished sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sessionStats.cancelled}</div>
            <p className="text-sm text-neutral-500">Cancelled sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search sessions..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="group">Group</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-500">No sessions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Counsellor</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session: any) => {
                    const StatusIcon = statusIcons[session.status as keyof typeof statusIcons];
                    return (
                      <tr key={session.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-neutral-400" />
                            <div>
                              <div className="font-medium text-neutral-900">
                                {getUserName(session.studentId)}
                              </div>
                              <div className="text-sm text-neutral-500">ID: {session.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-neutral-400" />
                            <div>
                              <div className="font-medium text-neutral-900">
                                {getUserName(session.counsellorId)}
                              </div>
                              <div className="text-sm text-neutral-500">ID: {session.counsellorId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-neutral-400" />
                            <div>
                              <div className="font-medium text-neutral-900">
                                {format(new Date(session.scheduledAt), "MMM d, yyyy")}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {format(new Date(session.scheduledAt), "h:mm a")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="flex items-center">
                            {session.type === "individual" ? (
                              <User className="h-3 w-3 mr-1" />
                            ) : (
                              <Users className="h-3 w-3 mr-1" />
                            )}
                            {session.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusColors[session.status as keyof typeof statusColors]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {session.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSession(session.id)}
                              disabled={deleteSessionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Filter,
  Edit,
  Eye
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

export default function CounsellorSessions() {
  const [filter, setFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions/counsellor"],
  });

  const { data: pendingSessions, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/sessions/pending"],
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/sessions/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/counsellor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/pending"] });
      setNotesModalOpen(false);
      toast({
        title: "Session Updated",
        description: "Session has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const allSessions = [...(sessions || []), ...(pendingSessions || [])];
  const filteredSessions = allSessions.filter((session: any) => {
    if (filter === "all") return true;
    return session.status === filter;
  });

  const handleUpdateSession = (id: number, status: string) => {
    updateSessionMutation.mutate({ id, status });
  };

  const handleAddNotes = (notes: string) => {
    if (selectedSession) {
      updateSessionMutation.mutate({ 
        id: selectedSession.id, 
        notes 
      });
    }
  };

  if (sessionsLoading || pendingLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-neutral-200 rounded"></div>
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
          <p className="text-neutral-600">Manage your counselling sessions</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Sessions</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-600">Pending</p>
                <p className="text-xl font-bold text-yellow-600">
                  {pendingSessions?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-600">Confirmed</p>
                <p className="text-xl font-bold text-green-600">
                  {sessions?.filter((s: any) => s.status === "confirmed").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-600">Completed</p>
                <p className="text-xl font-bold text-blue-600">
                  {sessions?.filter((s: any) => s.status === "completed").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-600">Total</p>
                <p className="text-xl font-bold text-primary">
                  {allSessions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map((session: any) => {
          const StatusIcon = statusIcons[session.status as keyof typeof statusIcons];
          return (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[session.status as keyof typeof statusColors]}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {session.status}
                  </Badge>
                  <div className="text-sm text-neutral-500">
                    {session.type === "individual" ? "Individual" : "Group"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-neutral-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(session.scheduledAt), "PPP")}
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(new Date(session.scheduledAt), "p")}
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <User className="h-4 w-4 mr-2" />
                  Student #{session.studentId}
                </div>
                
                {session.notes && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">{session.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {session.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateSession(session.id, "confirmed")}
                        disabled={updateSessionMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateSession(session.id, "cancelled")}
                        disabled={updateSessionMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}
                  
                  {session.status === "confirmed" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateSession(session.id, "completed")}
                      disabled={updateSessionMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSession(session);
                      setNotesModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500">No sessions found</p>
        </div>
      )}

      {/* Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Session Notes</DialogTitle>
          </DialogHeader>
          <NotesForm 
            session={selectedSession}
            onSubmit={handleAddNotes}
            isLoading={updateSessionMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotesForm({ session, onSubmit, isLoading }: any) {
  const [notes, setNotes] = useState(session?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-neutral-600 mb-2">
          Session with Student #{session?.studentId} on {format(new Date(session?.scheduledAt), "PPP")}
        </p>
        <Textarea
          placeholder="Add your session notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Notes"}
      </Button>
    </form>
  );
}
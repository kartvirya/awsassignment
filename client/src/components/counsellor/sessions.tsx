import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";

export default function CounsellorSessions() {
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/sessions/counsellor"],
  });

  const { data: pendingSessions = [] } = useQuery({
    queryKey: ["/api/sessions/pending"],
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/sessions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/counsellor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/pending"] });
      toast({
        title: "Success",
        description: "Session updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const handleAccept = (sessionId: number) => {
    updateSessionMutation.mutate({ id: sessionId, status: "confirmed" });
  };

  const handleDecline = (sessionId: number) => {
    updateSessionMutation.mutate({ id: sessionId, status: "cancelled" });
  };

  const handleComplete = (sessionId: number) => {
    updateSessionMutation.mutate({ id: sessionId, status: "completed" });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Appointments</h1>
        <p className="text-neutral-600">Manage your counselling sessions</p>
      </div>

      <div className="space-y-6">
        {/* Pending Requests */}
        {pendingSessions.length > 0 && (
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-neutral-900">
                            {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
                          </h4>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(session.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(session.scheduledAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {session.notes && (
                          <p className="text-sm text-neutral-600 mt-2">
                            <strong>Notes:</strong> {session.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleAccept(session.id)}
                        disabled={updateSessionMutation.isPending}
                        variant="outline"
                        size="sm" 
                        className="text-green-600 hover:text-green-800 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        onClick={() => handleDecline(session.id)}
                        disabled={updateSessionMutation.isPending}
                        variant="outline"
                        size="sm" 
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Sessions */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">All Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-neutral-900">
                            {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
                          </h4>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(session.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(session.scheduledAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-primary">
                        View Details
                      </Button>
                      {session.status === "confirmed" && (
                        <Button 
                          onClick={() => handleComplete(session.id)}
                          disabled={updateSessionMutation.isPending}
                          variant="outline"
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No sessions yet</h3>
                <p className="text-neutral-600">Sessions will appear here once students book appointments.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

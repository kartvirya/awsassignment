import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Filter
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

export default function StudentSessions() {
  const [filter, setFilter] = useState("all");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions/student"],
  });

  const { data: counsellors, isLoading: counsellorsLoading } = useQuery({
    queryKey: ["/api/users/role/counsellor"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/student"] });
      setIsBookingModalOpen(false);
      toast({
        title: "Session Booked",
        description: "Your session request has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to book session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredSessions = sessions?.filter((session: any) => {
    if (filter === "all") return true;
    return session.status === filter;
  }) || [];

  const handleBookSession = (data: any) => {
    createSessionMutation.mutate({
      counsellorId: data.counsellorId,
      scheduledAt: new Date(data.scheduledAt).toISOString(),
      notes: data.notes,
    });
  };

  if (sessionsLoading || counsellorsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-20 bg-neutral-200 rounded"></div>
                  <div className="h-4 bg-neutral-200 rounded w-full"></div>
                </div>
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
          <h1 className="text-2xl font-bold text-neutral-900">My Sessions</h1>
          <p className="text-neutral-600">Manage your counselling sessions</p>
        </div>
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Book Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book a New Session</DialogTitle>
            </DialogHeader>
            <BookingForm 
              counsellors={counsellors || []} 
              onSubmit={handleBookSession}
              isLoading={createSessionMutation.isPending}
            />
          </DialogContent>
        </Dialog>
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
                  {sessions?.filter((s: any) => s.status === "pending").length || 0}
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
                  {sessions?.length || 0}
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
                  Counsellor #{session.counsellorId}
                </div>
                
                {session.notes && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">{session.notes}</p>
                  </div>
                )}

                {session.studentNotes && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Your Notes:</p>
                    <p className="text-sm text-blue-700">{session.studentNotes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSession(session)}
                  >
                    View Details
                  </Button>
                  {session.status === "confirmed" && (
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500 mb-4">No sessions found</p>
          <Button onClick={() => setIsBookingModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Book Your First Session
          </Button>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
            </DialogHeader>
            <SessionDetails session={selectedSession} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BookingForm({ counsellors, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    counsellorId: "",
    scheduledAt: "",
    type: "individual",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="counsellorId">Select Counsellor</Label>
        <Select value={formData.counsellorId} onValueChange={(value) => setFormData({...formData, counsellorId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a counsellor" />
          </SelectTrigger>
          <SelectContent>
            {counsellors.map((counsellor: any) => (
              <SelectItem key={counsellor.id} value={counsellor.id}>
                {counsellor.firstName} {counsellor.lastName} ({counsellor.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="scheduledAt">Date & Time</Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
          min={new Date().toISOString().slice(0, 16)}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Session Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual Session</SelectItem>
            <SelectItem value="group">Group Session</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any specific topics or concerns you'd like to discuss..."
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Booking..." : "Book Session"}
      </Button>
    </form>
  );
}

function SessionDetails({ session }: any) {
  const StatusIcon = statusIcons[session.status as keyof typeof statusIcons];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className={statusColors[session.status as keyof typeof statusColors]}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {session.status}
        </Badge>
        <div className="text-sm text-neutral-500">
          {session.type === "individual" ? "Individual Session" : "Group Session"}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-neutral-400" />
          <span className="text-sm">{format(new Date(session.scheduledAt), "PPP")}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-neutral-400" />
          <span className="text-sm">{format(new Date(session.scheduledAt), "p")}</span>
        </div>
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-neutral-400" />
          <span className="text-sm">Counsellor #{session.counsellorId}</span>
        </div>
      </div>

      {session.notes && (
        <div>
          <h4 className="font-medium mb-2">Session Notes:</h4>
          <p className="text-sm text-neutral-600 p-3 bg-neutral-50 rounded">{session.notes}</p>
        </div>
      )}

      {session.studentNotes && (
        <div>
          <h4 className="font-medium mb-2">Your Notes:</h4>
          <p className="text-sm text-neutral-600 p-3 bg-blue-50 rounded">{session.studentNotes}</p>
        </div>
      )}
    </div>
  );
}
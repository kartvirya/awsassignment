import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User } from "lucide-react";

const bookingSchema = z.object({
  counsellorId: z.string().min(1, "Please select a counsellor"),
  scheduledAt: z.string().min(1, "Please select a date and time"),
  type: z.enum(["individual", "group"]),
  notes: z.string().optional(),
});

export default function StudentSessions() {
  const { toast } = useToast();
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/sessions/student"],
  });

  const { data: counsellors = [] } = useQuery({
    queryKey: ["/api/users/role/counsellor"],
  });

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      type: "individual",
      notes: "",
    },
  });

  const bookSessionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookingSchema>) => {
      const scheduledAt = new Date(data.scheduledAt).toISOString();
      await apiRequest("POST", "/api/sessions", {
        ...data,
        scheduledAt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/student"] });
      toast({
        title: "Success",
        description: "Session request submitted successfully",
      });
      setShowBookingForm(false);
      form.reset();
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

  const onSubmit = (data: z.infer<typeof bookingSchema>) => {
    bookSessionMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-neutral-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">My Sessions</h1>
        <p className="text-neutral-600">Manage your counselling appointments</p>
      </div>

      {/* Session Booking Form */}
      {showBookingForm && (
        <Card className="border-neutral-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Book New Session</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="counsellorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Counsellor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a counsellor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {counsellors.map((counsellor: any) => (
                              <SelectItem key={counsellor.id} value={counsellor.id}>
                                {counsellor.firstName} {counsellor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="individual" id="individual" />
                            <label htmlFor="individual" className="text-sm font-medium">
                              Individual
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="group" id="group" />
                            <label htmlFor="group" className="text-sm font-medium">
                              Group
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any specific topics or concerns you'd like to discuss..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={bookSessionMutation.isPending}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {bookSessionMutation.isPending ? "Submitting..." : "Request Session"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!showBookingForm && (
        <div className="mb-6">
          <Button
            onClick={() => setShowBookingForm(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Book New Session
          </Button>
        </div>
      )}

      {/* Session History */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg">Session History</CardTitle>
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
                      View
                    </Button>
                    {session.status === "pending" && (
                      <Button variant="ghost" size="sm" className="text-red-600">
                        Cancel
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
              <p className="text-neutral-600">Book your first session to get started with counselling.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

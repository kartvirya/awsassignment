import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter,
  User,
  Clock,
  Mail,
  Plus,
  Reply,
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CounsellorMessages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", selectedConversation?.id],
    enabled: !!selectedConversation?.id,
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/users/role/student"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return apiRequest("/api/messages", {
        method: "POST",
        body: messageData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStudentName = (studentId: string) => {
    const student = students?.find((s: any) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : `Student ${studentId}`;
  };

  const getConversationStatus = (conversation: any) => {
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
    if (!lastMessage) return "new";
    
    const messageDate = new Date(lastMessage.createdAt);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (lastMessage.status === "sent" && lastMessage.senderId !== conversation.counsellorId) {
      return "unread";
    } else if (diffHours < 24) {
      return "recent";
    } else {
      return "archived";
    }
  };

  const filteredConversations = conversations?.filter((conversation: any) => {
    const studentName = getStudentName(conversation.studentId);
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const conversationStatus = getConversationStatus(conversation);
    const matchesStatus = statusFilter === "all" || conversationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      receiverId: selectedConversation.studentId,
      content: newMessage,
    });
  };

  const conversationStats = {
    total: conversations?.length || 0,
    unread: conversations?.filter((c: any) => getConversationStatus(c) === "unread").length || 0,
    recent: conversations?.filter((c: any) => getConversationStatus(c) === "recent").length || 0,
    archived: conversations?.filter((c: any) => getConversationStatus(c) === "archived").length || 0,
  };

  if (conversationsLoading || studentsLoading) {
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
          <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
          <p className="text-neutral-600">Communicate with your students</p>
        </div>
      </div>

      {/* Message Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Total Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{conversationStats.total}</div>
            <p className="text-sm text-neutral-500">Active conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Unread Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{conversationStats.unread}</div>
            <p className="text-sm text-neutral-500">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{conversationStats.recent}</div>
            <p className="text-sm text-neutral-500">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Archive className="h-4 w-4 mr-2" />
              Archived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-600">{conversationStats.archived}</div>
            <p className="text-sm text-neutral-500">Older conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Conversations
            </CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation: any) => {
                  const conversationStatus = getConversationStatus(conversation);
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                  
                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 ${
                        selectedConversation?.id === conversation.id ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-neutral-400" />
                          <div className="font-medium text-neutral-900">
                            {getStudentName(conversation.studentId)}
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          conversationStatus === "unread" ? "text-red-600 border-red-600" :
                          conversationStatus === "recent" ? "text-green-600 border-green-600" :
                          "text-neutral-600 border-neutral-600"
                        }>
                          {conversationStatus}
                        </Badge>
                      </div>
                      
                      {lastMessage && (
                        <div>
                          <div className="text-sm text-neutral-600 truncate">
                            {lastMessage.content}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {format(new Date(lastMessage.createdAt), "MMM d, h:mm a")}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              {selectedConversation ? (
                <>
                  <User className="h-5 w-5 mr-2" />
                  {getStudentName(selectedConversation.studentId)}
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Select a conversation
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4">
                {/* Messages */}
                <div className="h-96 overflow-y-auto border border-neutral-200 rounded-lg p-4 space-y-4">
                  {messages?.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    messages?.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === selectedConversation.counsellorId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === selectedConversation.counsellorId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-neutral-100 text-neutral-900'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.senderId === selectedConversation.counsellorId
                              ? 'text-primary-foreground/70'
                              : 'text-neutral-500'
                          }`}>
                            {format(new Date(message.createdAt), "MMM d, h:mm a")}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
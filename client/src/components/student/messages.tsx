import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Plus,
  User,
  Clock,
  Search,
  Mail,
  MailOpen
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function StudentMessages() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/messages/conversations"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const { data: counsellors, isLoading: counsellorsLoading } = useQuery({
    queryKey: ["/api/users/role/counsellor"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", selectedConversation?.id],
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time chat
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

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest(`/api/messages/${messageId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  const filteredConversations = conversations?.filter((conv: any) => {
    const otherUser = conv.senderId === user?.id ? conv.receiverName : conv.senderName;
    return otherUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.content.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const groupedConversations = filteredConversations.reduce((acc: any, msg: any) => {
    const otherUserId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
    const otherUserName = msg.senderId === user?.id ? msg.receiverName : msg.senderName;
    
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        id: otherUserId,
        name: otherUserName,
        lastMessage: msg,
        unreadCount: 0,
      };
    }
    
    if (msg.createdAt > acc[otherUserId].lastMessage.createdAt) {
      acc[otherUserId].lastMessage = msg;
    }
    
    if (msg.receiverId === user?.id && msg.status === "sent") {
      acc[otherUserId].unreadCount++;
    }
    
    return acc;
  }, {});

  const conversationList = Object.values(groupedConversations);

  const handleSendMessage = (data: any) => {
    if (selectedConversation) {
      sendMessageMutation.mutate({
        receiverId: selectedConversation.id,
        content: data.content,
      });
    }
  };

  const handleNewMessage = (data: any) => {
    sendMessageMutation.mutate({
      receiverId: data.receiverId,
      content: data.content,
    });
    setNewMessageModalOpen(false);
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      conversation.lastMessage.receiverId === user?.id && 
      markAsReadMutation.mutate(conversation.lastMessage.id);
    }
  };

  if (conversationsLoading || counsellorsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse">
            <CardHeader><div className="h-6 bg-neutral-200 rounded w-3/4"></div></CardHeader>
            <CardContent><div className="h-32 bg-neutral-200 rounded"></div></CardContent>
          </Card>
          <Card className="lg:col-span-2 animate-pulse">
            <CardHeader><div className="h-6 bg-neutral-200 rounded w-1/2"></div></CardHeader>
            <CardContent><div className="h-64 bg-neutral-200 rounded"></div></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
          <p className="text-neutral-600">Communicate with your counsellors</p>
        </div>
        <Dialog open={newMessageModalOpen} onOpenChange={setNewMessageModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <NewMessageForm 
              counsellors={counsellors || []} 
              onSubmit={handleNewMessage}
              isLoading={sendMessageMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Conversations
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {conversationList.length === 0 ? (
                <div className="p-6 text-center text-neutral-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversationList.map((conversation: any) => (
                    <div
                      key={conversation.id}
                      className={`p-3 cursor-pointer hover:bg-neutral-50 border-l-4 ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-primary/5 border-primary'
                          : 'border-transparent'
                      }`}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-neutral-400" />
                          <span className="font-medium text-sm">{conversation.name}</span>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {conversation.lastMessage.content}
                      </p>
                      <div className="flex items-center text-xs text-neutral-400 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(conversation.lastMessage.createdAt), "MMM d, p")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              {selectedConversation ? (
                <>
                  <User className="h-5 w-5 mr-2" />
                  {selectedConversation.name}
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
              <ChatWindow
                conversation={selectedConversation}
                messages={messages || []}
                onSendMessage={handleSendMessage}
                isLoading={sendMessageMutation.isPending}
                currentUserId={user?.id}
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-600">Total Conversations</p>
                <p className="text-xl font-bold text-primary">{conversationList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-600">Unread Messages</p>
                <p className="text-xl font-bold text-orange-600">
                  {conversationList.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MailOpen className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-600">Active Chats</p>
                <p className="text-xl font-bold text-green-600">
                  {conversationList.filter((conv: any) => 
                    new Date(conv.lastMessage.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChatWindow({ conversation, messages, onSendMessage, isLoading, currentUserId }: any) {
  const [messageText, setMessageText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage({ content: messageText.trim() });
      setMessageText("");
    }
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[300px] p-4 border rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUserId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-70">
                      {format(new Date(message.createdAt), "p")}
                    </p>
                    {message.senderId === currentUserId && (
                      <div className="text-xs opacity-70">
                        {message.status === "read" ? "Read" : "Sent"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !messageText.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function NewMessageForm({ counsellors, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    receiverId: "",
    content: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ receiverId: "", content: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="receiverId">Send to</Label>
        <Select value={formData.receiverId} onValueChange={(value) => setFormData({...formData, receiverId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a counsellor" />
          </SelectTrigger>
          <SelectContent>
            {counsellors.map((counsellor: any) => (
              <SelectItem key={counsellor.id} value={counsellor.id}>
                {counsellor.firstName} {counsellor.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="content">Message</Label>
        <Textarea
          id="content"
          placeholder="Type your message..."
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          rows={4}
          required
        />
      </div>

      <Button type="submit" disabled={isLoading || !formData.receiverId || !formData.content} className="w-full">
        {isLoading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
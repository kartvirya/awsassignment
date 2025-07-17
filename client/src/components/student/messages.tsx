import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, User } from "lucide-react";

export default function StudentMessages() {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: counsellors = [] } = useQuery({
    queryKey: ["/api/users/role/counsellor"],
  });

  const { data: messages = [] } = useQuery({
    queryKey: selectedConversation ? ["/api/messages", selectedConversation] : [],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      await apiRequest("POST", "/api/messages", {
        receiverId: selectedConversation,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: { content: string }) => {
    if (!selectedConversation) return;
    sendMessageMutation.mutate(data);
  };

  const getConversationName = (conversation: any) => {
    return `${conversation.senderName || conversation.receiverName}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Messages</h1>
        <p className="text-neutral-600">Connect with your counsellors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2">
                {counsellors.map((counsellor: any) => (
                  <button
                    key={counsellor.id}
                    onClick={() => setSelectedConversation(counsellor.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      selectedConversation === counsellor.id
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">
                        {counsellor.firstName} {counsellor.lastName}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Counsellor
                      </div>
                    </div>
                  </button>
                ))}
                {counsellors.length === 0 && (
                  <div className="text-center py-8 text-neutral-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                    <p>No counsellors available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2 border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedConversation ? "Messages" : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedConversation ? (
              <div className="flex flex-col h-[500px]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === selectedConversation ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === selectedConversation
                              ? "bg-neutral-100 text-neutral-900"
                              : "bg-primary text-white"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-neutral-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start a conversation!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-2">
                    <Input
                      {...register("content", { required: true })}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={sendMessageMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-neutral-500">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-neutral-600">
                    Choose a counsellor to start messaging
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

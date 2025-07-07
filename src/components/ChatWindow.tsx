import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
}

interface ChatProfile {
  id: string;
  username: string;
  profile_image: string;
}

interface ChatWindowProps {
  chatProfile: ChatProfile;
  onBack: () => void;
}

const ChatWindow = ({ chatProfile, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && chatProfile) {
      fetchMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [user, chatProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender.eq.${user.id},receiver.eq.${chatProfile.id}),and(sender.eq.${chatProfile.id},receiver.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel(`messages_${user.id}_${chatProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add message if it's between current user and chat profile
          if ((newMessage.sender === user.id && newMessage.receiver === chatProfile.id) ||
              (newMessage.sender === chatProfile.id && newMessage.receiver === user.id)) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender: user.id,
          receiver: chatProfile.id,
          content: messageContent
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        setNewMessage(messageContent); // Restore message if failed
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
      setNewMessage(messageContent); // Restore message if failed
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card border-b border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="lg:hidden hover:bg-muted rounded-full p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={chatProfile.profile_image} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
            {chatProfile.username[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{chatProfile.username}</h3>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full p-2">
          <MoreVertical size={20} />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[70%] ${
                      message.sender === user?.id
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                        : 'bg-muted rounded-2xl rounded-bl-md'
                    } px-4 py-3 break-words`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === user?.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="rounded-xl px-4 py-3 min-h-[44px] resize-none"
              disabled={sending}
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newMessage.trim() || sending}
            className="rounded-xl px-4 py-3 h-[44px] bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send size={16} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft } from "lucide-react";
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
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarImage src={chatProfile.profile_image} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
            {chatProfile.username[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{chatProfile.username}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Online</p>
        </div>
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
                <p className="text-slate-600 dark:text-slate-400 font-medium">No messages yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">Start the conversation!</p>
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
                        ? 'bg-gradient-to-r from-primary to-primary/90 text-white rounded-2xl rounded-br-md'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md shadow-sm border border-slate-200 dark:border-slate-600'
                    } px-4 py-3 break-words`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === user?.id
                          ? 'text-white/70'
                          : 'text-slate-500 dark:text-slate-400'
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
      <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none min-h-[44px] max-h-32"
              disabled={sending}
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl px-4 py-3 h-[44px] shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
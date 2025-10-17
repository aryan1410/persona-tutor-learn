import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Plus, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

interface ConversationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
}

export function ConversationSelector({ open, onOpenChange, subject }: ConversationSelectorProps) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open, subject]);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get subject ID (case-insensitive)
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', subject)
        .single();

      if (!subjectData) return;

      // Get conversations with message counts
      const { data: convData } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .eq('subject_id', subjectData.id)
        .order('updated_at', { ascending: false });

      if (convData) {
        // Get message counts for each conversation
        const conversationsWithCounts = await Promise.all(
          convData.map(async (conv) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id);

            return {
              ...conv,
              message_count: count || 0,
            };
          })
        );

        setConversations(conversationsWithCounts);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    onOpenChange(false);
    navigate(`/chat/${subject.toLowerCase()}`, { state: { newChat: true } });
  };

  const handleSelectConversation = (conversationId: string) => {
    onOpenChange(false);
    navigate(`/chat/${subject.toLowerCase()}`, { state: { conversationId } });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl capitalize">{subject} Conversations</DialogTitle>
          <DialogDescription>
            Select a conversation to continue or start a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            className="w-full gradient-primary text-white hover:opacity-90 transition-smooth"
            onClick={handleNewChat}
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Conversation
          </Button>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start your first conversation to begin learning!
              </p>
            </Card>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className="p-4 hover:shadow-elegant transition-smooth cursor-pointer"
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate mb-1">{conv.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{conv.message_count} messages</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(conv.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

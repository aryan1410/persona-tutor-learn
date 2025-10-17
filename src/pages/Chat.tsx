import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Sparkles, Users, BookOpen, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

type Persona = "genz" | "personal" | "normal";

interface Message {
  id: string;
  role: string;
  content: string;
  persona?: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { subject } = useParams<{ subject: string }>();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona>("genz");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && subject) {
      initializeConversation();
    }
  }, [user, subject]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
    } else {
      navigate("/login");
    }
  };

  const initializeConversation = async () => {
    // Get subject ID
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", subject)
      .single();

    if (!subjectData) return;

    // Check for existing conversation
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .eq("subject_id", subjectData.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingConv) {
      setConversationId(existingConv.id);
      loadMessages(existingConv.id);
    } else {
      // Create new conversation
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          subject_id: subjectData.id,
          title: `${subject} Learning Session`,
        })
        .select()
        .single();

      if (newConv) {
        setConversationId(newConv.id);
      }
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const personas = [
    {
      id: "genz" as Persona,
      name: "Gen-Z",
      icon: Sparkles,
      color: "gradient-primary",
      description: "Fun & relatable",
    },
    {
      id: "personal" as Persona,
      name: "Personal",
      icon: Users,
      color: "gradient-secondary",
      description: "Tailored to you",
    },
    {
      id: "normal" as Persona,
      name: "Classic",
      icon: BookOpen,
      color: "gradient-accent",
      description: "Traditional style",
    },
  ];

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || loading) return;

    const userMessage = message;
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          conversationId,
          message: userMessage,
          persona: selectedPersona,
          subject: subject,
          userAge: profile?.age,
          userLocation: profile?.location,
        },
      });

      if (error) throw error;

      // Reload messages
      await loadMessages(conversationId);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold capitalize">{subject} Learning</h1>
              <p className="text-sm text-muted-foreground">Choose your learning style below</p>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Selector */}
      <div className="container mx-auto px-4 py-4 border-b relative">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {personas.map((persona) => (
            <Button
              key={persona.id}
              variant={selectedPersona === persona.id ? "default" : "outline"}
              className={`flex items-center gap-2 whitespace-nowrap transition-smooth ${
                selectedPersona === persona.id ? persona.color + " text-white" : ""
              }`}
              onClick={() => setSelectedPersona(persona.id)}
            >
              <persona.icon className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold text-sm">{persona.name}</div>
                <div className="text-xs opacity-80">{persona.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 container mx-auto px-4 relative">
        <div className="py-6 space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-elegant mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Start Your Learning Journey</h3>
              <p className="text-muted-foreground mb-6">
                Ask me anything about {subject}! I'll explain it using your selected persona style.
              </p>
              <div className="grid gap-2 max-w-md mx-auto text-left">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setMessage("Teach me about the Cold War")}
                >
                  "Teach me about the Cold War"
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setMessage("Explain Chapter 2 from my textbook")}
                >
                  "Explain Chapter 2 from my textbook"
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setMessage("What are tectonic plates?")}
                >
                  "What are tectonic plates?"
                </Button>
              </div>
            </Card>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="gradient-primary">
                    <AvatarFallback className="bg-transparent text-white">AI</AvatarFallback>
                  </Avatar>
                )}
                <Card className={`p-4 max-w-2xl ${msg.role === 'user' ? "gradient-primary text-white" : ""}`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </Card>
                {msg.role === 'user' && (
                  <Avatar>
                    <AvatarFallback>{profile?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <Avatar className="gradient-primary">
                <AvatarFallback className="bg-transparent text-white">AI</AvatarFallback>
              </Avatar>
              <Card className="p-4 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/80 backdrop-blur-sm relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              placeholder={`Ask about ${subject}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
              className="flex-1"
              disabled={loading}
            />
            <Button
              className="gradient-primary text-white hover:opacity-90 transition-smooth"
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Sparkles, Users, BookOpen, ClipboardList, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuizDialog } from "@/components/QuizDialog";

type Persona = "genz" | "personal" | "normal";

const Chat = () => {
  const navigate = useNavigate();
  const { subject } = useParams<{ subject: string }>();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona>("genz");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [quizRefreshKey, setQuizRefreshKey] = useState(0);

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
    } else {
      navigate("/login");
    }
  };

  const initializeConversation = async () => {
    try {
      // Get subject ID
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', subject)
        .single();

      if (!subjectData) return;

      // Create or get existing conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('subject_id', subjectData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
        loadMessages(existingConv.id);
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            subject_id: subjectData.id,
            title: `${subject} learning session`,
          })
          .select()
          .single();

        if (newConv) {
          setConversationId(newConv.id);
        }
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map(msg => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
          persona: msg.persona,
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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
    if (!message.trim() || loading) return;
    if (!conversationId) {
      toast({
        title: "Error",
        description: "Conversation not initialized",
        variant: "destructive",
      });
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    const currentMessage = message;
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            ...messages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: currentMessage }
          ],
          persona: selectedPersona,
          subject: subject,
          userId: user.id,
          conversationId: conversationId,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const aiResponse = {
        id: Date.now() + 1,
        text: data.message,
        isUser: false,
        timestamp: new Date(),
        persona: selectedPersona,
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Reload messages to ensure sync
      await loadMessages(conversationId);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      // Remove the user message if failed
      setMessages(messages);
      setMessage(currentMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      // Get subject ID
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', subject)
        .single();

      if (!subjectData) return;

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          subject_id: subjectData.id,
          title: `${subject} learning session`,
        })
        .select()
        .single();

      if (error) throw error;

      if (newConv) {
        setConversationId(newConv.id);
        setMessages([]);
        toast({
          title: "New chat started",
          description: "Ready for a fresh conversation!",
        });
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start new chat",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQuiz = async () => {
    if (!conversationId || messages.length === 0) {
      toast({
        title: "No conversation",
        description: "Chat with the AI first before generating a quiz",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingQuiz(true);
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { conversationId, userId: user?.id }
      });

      if (error) throw error;

      setCurrentQuizId(data.quizId);
      setQuizDialogOpen(true);
      
      toast({
        title: "Quiz Ready!",
        description: `${data.totalQuestions} questions generated based on your conversation`,
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 gradient-hero opacity-5 pointer-events-none" />
      
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
          <Button
            variant="outline"
            onClick={handleNewChat}
            className="hover:scale-105 transition-smooth"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
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
                <Button variant="outline" className="justify-start" onClick={() => setMessage("Teach me about the Cold War")}>
                  "Teach me about the Cold War"
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => setMessage("Explain Chapter 2 from my textbook")}>
                  "Explain Chapter 2 from my textbook"
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => setMessage("What are tectonic plates?")}>
                  "What are tectonic plates?"
                </Button>
              </div>
            </Card>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isUser ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                {!msg.isUser && (
                  <Avatar className="gradient-primary">
                    <AvatarFallback className="bg-transparent text-white">AI</AvatarFallback>
                  </Avatar>
                 )}
                 <Card className={`p-4 max-w-2xl ${msg.isUser ? "gradient-primary text-white" : ""}`}>
                   {msg.isUser ? (
                     <p className="leading-relaxed">{msg.text}</p>
                   ) : (
                     <div className="prose prose-sm max-w-none dark:prose-invert">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                         {msg.text}
                       </ReactMarkdown>
                     </div>
                   )}
                 </Card>
                 {msg.isUser && (
                  <Avatar>
                    <AvatarFallback>{user?.user_metadata?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/80 backdrop-blur-sm relative">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Take Test Button */}
            {messages.length > 0 && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="hover:scale-105 transition-smooth"
                >
                  {generatingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Take Test
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Message Input */}
            <div className="flex gap-2">
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
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Dialog */}
      {currentQuizId && (
        <QuizDialog
          open={quizDialogOpen}
          onOpenChange={setQuizDialogOpen}
          quizId={currentQuizId}
          onComplete={() => setQuizRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
};

export default Chat;

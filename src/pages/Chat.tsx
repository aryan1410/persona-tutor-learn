import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Sparkles, Users, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Persona = "genz" | "personal" | "normal";

const Chat = () => {
  const navigate = useNavigate();
  const { subject } = useParams<{ subject: string }>();
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona>("genz");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    } else {
      navigate("/login");
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
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate AI response (will be replaced with actual Lovable AI integration)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "This is where the AI response will appear. We'll integrate Lovable AI to provide personalized learning experiences based on your selected persona and subject!",
        isUser: false,
        timestamp: new Date(),
        persona: selectedPersona,
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
                <Button variant="outline" className="justify-start">
                  "Teach me about the Cold War"
                </Button>
                <Button variant="outline" className="justify-start">
                  "Explain Chapter 2 from my textbook"
                </Button>
                <Button variant="outline" className="justify-start">
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
                  <p className="leading-relaxed">{msg.text}</p>
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
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              placeholder={`Ask about ${subject}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button
              className="gradient-primary text-white hover:opacity-90 transition-smooth"
              onClick={handleSendMessage}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

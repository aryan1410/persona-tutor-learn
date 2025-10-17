import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Textbook {
  id: string;
  title: string;
  subject_id: string;
  uploaded_at: string;
}

export function TextbookSelector() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedTextbook, setSelectedTextbook] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTextbooks();
    
    // Load saved selection from localStorage
    const saved = localStorage.getItem("selectedTextbookId");
    if (saved) {
      setSelectedTextbook(saved);
    }
  }, []);

  const fetchTextbooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("textbooks")
        .select("id, title, subject_id, uploaded_at")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setTextbooks(data || []);
    } catch (error) {
      console.error("Error fetching textbooks:", error);
      toast({
        title: "Error loading textbooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTextbook = (textbookId: string) => {
    setSelectedTextbook(textbookId);
    localStorage.setItem("selectedTextbookId", textbookId);
    
    const selected = textbooks.find(t => t.id === textbookId);
    toast({
      title: "Textbook selected",
      description: `Using "${selected?.title}" for AI responses`,
    });
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (textbooks.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BookOpen className="w-5 h-5" />
            Current Textbook
          </CardTitle>
          <CardDescription>No textbooks uploaded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload a textbook to get started with AI-powered learning
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BookOpen className="w-5 h-5" />
          Current Textbook
        </CardTitle>
        <CardDescription>Select a textbook for AI responses</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedTextbook} onValueChange={handleSelectTextbook}>
          <div className="space-y-3">
            {textbooks.map((textbook) => (
              <div key={textbook.id} className="flex items-center space-x-2">
                <RadioGroupItem value={textbook.id} id={textbook.id} />
                <Label
                  htmlFor={textbook.id}
                  className="flex-1 cursor-pointer text-foreground hover:text-primary transition-colors"
                >
                  {textbook.title}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        
        {!selectedTextbook && (
          <p className="text-sm text-muted-foreground mt-4">
            Select a textbook to enable context-aware AI responses
          </p>
        )}
      </CardContent>
    </Card>
  );
}

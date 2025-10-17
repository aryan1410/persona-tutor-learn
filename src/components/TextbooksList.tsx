import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Textbook {
  id: string;
  title: string;
  subject_id: string;
  file_url: string;
  uploaded_at: string;
}

export const TextbooksList = ({ onDelete }: { onDelete?: () => void }) => {
  const { toast } = useToast();
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTextbooks();
  }, []);

  const loadTextbooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('textbooks')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setTextbooks(data || []);
    } catch (error: any) {
      console.error('Error loading textbooks:', error);
      toast({
        title: "Error",
        description: "Failed to load textbooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (textbookId: string, fileUrl: string) => {
    setDeleting(textbookId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Extract file path from URL
      const urlParts = fileUrl.split('/textbooks/');
      const filePath = urlParts[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage.from('textbooks').remove([filePath]);
      }

      // Delete from database (cascade will delete chunks)
      const { error } = await supabase
        .from('textbooks')
        .delete()
        .eq('id', textbookId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Textbook deleted successfully",
      });

      setTextbooks(textbooks.filter(t => t.id !== textbookId));
      onDelete?.();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete textbook",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (textbooks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No textbooks uploaded yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {textbooks.map((textbook) => (
        <Card key={textbook.id} className="p-4 flex items-center justify-between hover:shadow-elegant transition-smooth">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold">{textbook.title}</h4>
              <p className="text-sm text-muted-foreground">
                Uploaded {new Date(textbook.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(textbook.id, textbook.file_url)}
            disabled={deleting === textbook.id}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting === textbook.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </Card>
      ))}
    </div>
  );
};

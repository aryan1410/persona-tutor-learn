import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  userId: string;
}

export const FeedbackDialog = ({ open, onOpenChange, conversationId, userId }: FeedbackDialogProps) => {
  const [feedbackType, setFeedbackType] = useState<"persona" | "accuracy">("persona");
  const [personaFeedback, setPersonaFeedback] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (feedbackType === "persona" && !personaFeedback) {
      toast({
        title: "Selection required",
        description: "Please select a persona feedback option",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("conversation_feedback").insert({
        conversation_id: conversationId,
        user_id: userId,
        feedback_type: feedbackType,
        feedback_value: feedbackType === "persona" ? personaFeedback : "inaccurate",
        comments: comments || null,
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Thank you! The AI will adjust based on your feedback.",
      });

      // Reset form
      setFeedbackType("persona");
      setPersonaFeedback("");
      setComments("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription>
            Help us improve your learning experience by providing feedback on this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>What would you like to provide feedback on?</Label>
            <RadioGroup value={feedbackType} onValueChange={(value) => setFeedbackType(value as "persona" | "accuracy")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="persona" id="persona" />
                <Label htmlFor="persona" className="font-normal cursor-pointer">
                  Teaching Style / Persona
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accuracy" id="accuracy" />
                <Label htmlFor="accuracy" className="font-normal cursor-pointer">
                  Content Accuracy
                </Label>
              </div>
            </RadioGroup>
          </div>

          {feedbackType === "persona" && (
            <div className="space-y-3">
              <Label>How should we adjust the teaching style?</Label>
              <RadioGroup value={personaFeedback} onValueChange={setPersonaFeedback}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more_genz" id="more_genz" />
                  <Label htmlFor="more_genz" className="font-normal cursor-pointer">
                    More Gen-Z / Casual
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_genz" id="less_genz" />
                  <Label htmlFor="less_genz" className="font-normal cursor-pointer">
                    Less Gen-Z / More Formal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more_personal" id="more_personal" />
                  <Label htmlFor="more_personal" className="font-normal cursor-pointer">
                    More Personalized to My Background
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less_personal" id="less_personal" />
                  <Label htmlFor="less_personal" className="font-normal cursor-pointer">
                    Less Personalized / More General
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {feedbackType === "accuracy" && (
            <div className="space-y-2">
              <Label>Content Accuracy Issue</Label>
              <p className="text-sm text-muted-foreground">
                We'll adjust to follow your textbook more closely and stick to exact topics and structure.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Any specific details you'd like to share..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

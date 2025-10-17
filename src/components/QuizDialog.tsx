import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
}

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  onComplete: () => void;
}

export function QuizDialog({ open, onOpenChange, quizId, onComplete }: QuizDialogProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (open && quizId) {
      loadQuestions();
    }
  }, [open, quizId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at');

      if (error) throw error;

      const formattedQuestions = (data || []).map(q => ({
        ...q,
        options: q.options as unknown as string[]
      }));

      setQuestions(formattedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setCompleted(false);
      setSelectedAnswer("");
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].id]: selectedAnswer }));
      setSelectedAnswer("");
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevAnswer = answers[questions[currentQuestionIndex - 1].id];
      setSelectedAnswer(prevAnswer || "");
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      toast({
        title: "Answer required",
        description: "Please select an answer before submitting",
        variant: "destructive",
      });
      return;
    }

    // Save the last answer
    const finalAnswers = { ...answers, [questions[currentQuestionIndex].id]: selectedAnswer };
    
    try {
      setSubmitting(true);

      // Update each question with the user's answer
      let correctCount = 0;
      for (const question of questions) {
        const userAnswer = finalAnswers[question.id];
        const isCorrect = userAnswer === question.correct_answer;
        if (isCorrect) correctCount++;

        await supabase
          .from('quiz_questions')
          .update({ 
            user_answer: userAnswer,
            is_correct: isCorrect 
          })
          .eq('id', question.id);
      }

      // Update quiz with completion and score
      await supabase
        .from('quizzes')
        .update({ 
          completed_at: new Date().toISOString(),
          score: correctCount 
        })
        .eq('id', quizId);

      setScore(correctCount);
      setCompleted(true);

      toast({
        title: "Quiz Completed!",
        description: `You scored ${correctCount} out of ${questions.length}`,
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (completed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quiz Complete!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="mb-4">
              {score / questions.length >= 0.7 ? (
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              ) : (
                <XCircle className="w-16 h-16 text-yellow-500 mx-auto" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {score} / {questions.length}
            </h3>
            <p className="text-muted-foreground mb-6">
              {score / questions.length >= 0.7 
                ? "Great job! You've mastered this topic!" 
                : "Keep studying! Review the material and try again."}
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quiz</DialogTitle>
        </DialogHeader>

        {currentQuestion && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
              
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                {currentQuestion.options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                  return (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent transition-colors">
                      <RadioGroupItem value={optionLetter} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium">{optionLetter}.</span> {option}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!selectedAnswer}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

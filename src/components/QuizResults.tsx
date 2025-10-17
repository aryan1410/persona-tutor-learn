import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp } from "lucide-react";

export function QuizResults() {
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0 });

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: quizzes } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          score,
          total_questions,
          completed_at,
          conversations!inner(subject_id, subjects(name))
        `)
        .eq('conversations.user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (quizzes && quizzes.length > 0) {
        setResults(quizzes);
        
        const totalQuizzes = quizzes.length;
        const avgScore = quizzes.reduce((acc, q) => acc + ((q.score || 0) / q.total_questions * 100), 0) / totalQuizzes;
        
        setStats({ total: totalQuizzes, avgScore: Math.round(avgScore) });
      }
    } catch (error) {
      console.error('Error loading quiz results:', error);
    }
  };

  if (results.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No quiz results yet. Take a test to see your progress!
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="gradient-primary w-12 h-12 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Quizzes</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="gradient-secondary w-12 h-12 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Results */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold">Recent Quiz Results</h4>
        {results.map((quiz) => {
          const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
          const subjectName = (quiz.conversations?.subjects as any)?.name || 'Unknown';
          
          return (
            <Card key={quiz.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="font-semibold">{quiz.title}</h5>
                  <p className="text-sm text-muted-foreground">
                    {subjectName} • {new Date(quiz.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${percentage >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {quiz.score}/{quiz.total_questions}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ScoreData {
  date: string;
  score: number;
}

export function QuizScoreTrendChart() {
  const [data, setData] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScoreData();
  }, []);

  const loadScoreData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: quizzes } = await supabase
        .from('quizzes')
        .select(`
          id,
          score,
          total_questions,
          completed_at,
          conversations!inner(user_id)
        `)
        .eq('conversations.user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true })
        .limit(10);

      if (quizzes && quizzes.length > 0) {
        const scoreData: ScoreData[] = quizzes.map((quiz) => ({
          date: new Date(quiz.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round((quiz.score / quiz.total_questions) * 100),
        }));

        setData(scoreData);
      }
    } catch (error) {
      console.error('Error loading quiz score data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="gradient-secondary w-12 h-12 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground">No quiz data yet. Take some quizzes to see your progress!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-secondary w-10 h-10 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Quiz Score Trend</h3>
          <p className="text-sm text-muted-foreground">Your performance over time</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-muted-foreground"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]}
            className="text-muted-foreground"
            fontSize={12}
            label={{ value: 'Score %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [`${value}%`, 'Score']}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="hsl(var(--secondary))" 
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

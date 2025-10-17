import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3 } from "lucide-react";

interface SubjectData {
  subject: string;
  messages: number;
  quizzes: number;
}

export function SubjectDistributionChart() {
  const [data, setData] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjectData();
  }, []);

  const loadSubjectData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (!subjects) return;

      const subjectData: SubjectData[] = [];

      for (const subject of subjects) {
        // Get message count
        const { data: progress } = await supabase
          .from('user_progress')
          .select('total_messages, total_quizzes')
          .eq('user_id', user.id)
          .eq('subject_id', subject.id)
          .maybeSingle();

        subjectData.push({
          subject: subject.name,
          messages: progress?.total_messages || 0,
          quizzes: progress?.total_quizzes || 0,
        });
      }

      setData(subjectData);
    } catch (error) {
      console.error('Error loading subject distribution:', error);
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

  const hasData = data.some(d => d.messages > 0 || d.quizzes > 0);

  if (!hasData) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="gradient-accent w-12 h-12 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground">Start learning to see your subject distribution!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-accent w-10 h-10 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Subject Activity</h3>
          <p className="text-sm text-muted-foreground">Distribution across subjects</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="subject" 
            className="text-muted-foreground"
            fontSize={12}
          />
          <YAxis 
            className="text-muted-foreground"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="messages" 
            fill="hsl(var(--primary))" 
            radius={[8, 8, 0, 0]}
            name="Messages"
          />
          <Bar 
            dataKey="quizzes" 
            fill="hsl(var(--secondary))" 
            radius={[8, 8, 0, 0]}
            name="Quizzes"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

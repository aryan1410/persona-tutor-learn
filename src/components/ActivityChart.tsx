import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity } from "lucide-react";

interface ActivityData {
  date: string;
  messages: number;
  quizzes: number;
}

export function ActivityChart() {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days of activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activities } = await supabase
        .from('user_activity')
        .select('created_at, activity_type')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at');

      // Group by date
      const activityMap = new Map<string, { messages: number; quizzes: number }>();
      
      // Initialize last 7 days with zeros
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        activityMap.set(dateStr, { messages: 0, quizzes: 0 });
      }

      // Populate with actual data
      activities?.forEach((activity) => {
        const date = new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = activityMap.get(date) || { messages: 0, quizzes: 0 };
        
        if (activity.activity_type === 'message') {
          existing.messages += 1;
        } else if (activity.activity_type === 'quiz') {
          existing.quizzes += 1;
        }
        
        activityMap.set(date, existing);
      });

      const chartData: ActivityData[] = Array.from(activityMap.entries()).map(([date, counts]) => ({
        date,
        messages: counts.messages,
        quizzes: counts.quizzes,
      }));

      setData(chartData);
    } catch (error) {
      console.error('Error loading activity data:', error);
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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-primary w-10 h-10 rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">7-Day Activity</h3>
          <p className="text-sm text-muted-foreground">Your learning activity over time</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
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
          <Line 
            type="monotone" 
            dataKey="messages" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="Messages"
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          <Line 
            type="monotone" 
            dataKey="quizzes" 
            stroke="hsl(var(--secondary))" 
            strokeWidth={2}
            name="Quizzes"
            dot={{ fill: 'hsl(var(--secondary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

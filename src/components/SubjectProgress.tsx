import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, MapPin } from "lucide-react";

interface SubjectProgressData {
  subject_id: string;
  subject_name: string;
  total_messages: number;
  topics_count: number;
  icon: any;
}

export function SubjectProgress() {
  const [progress, setProgress] = useState<SubjectProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (!subjects) return;

      // Get progress for each subject
      const progressData: SubjectProgressData[] = [];
      
      for (const subject of subjects) {
        const { data: userProgress } = await supabase
          .from('user_progress')
          .select('total_messages, topics_covered')
          .eq('user_id', user.id)
          .eq('subject_id', subject.id)
          .single();

        const topicsArray = userProgress?.topics_covered as any[] || [];
        const uniqueTopics = new Set(topicsArray.map(t => JSON.stringify(t))).size;

        progressData.push({
          subject_id: subject.id,
          subject_name: subject.name,
          total_messages: userProgress?.total_messages || 0,
          topics_count: uniqueTopics,
          icon: subject.name.toLowerCase() === 'history' ? BookOpen : MapPin,
        });
      }

      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {progress.map((subject) => {
        const Icon = subject.icon;
        // Calculate progress percentage (arbitrary scale: 10 messages = 10%, 10 topics = 40%, max 50%)
        const messageProgress = Math.min((subject.total_messages / 10) * 10, 10);
        const topicProgress = Math.min((subject.topics_count / 10) * 40, 40);
        const totalProgress = Math.min(messageProgress + topicProgress, 50);

        return (
          <Card key={subject.subject_id} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="gradient-primary w-10 h-10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{subject.subject_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {subject.total_messages} messages • {subject.topics_count} topics covered
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{Math.round(totalProgress)}%</p>
              </div>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </Card>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  content_points: number;
  activity_points: number;
  total_points: number;
  rank: number;
  isCurrentUser: boolean;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      const friendIds = friendships?.map(f => 
        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
      ) || [];

      // Include current user
      const allUserIds = [user.id, ...friendIds];

      // Get activity for all users
      const { data: activities } = await supabase
        .from('user_activity')
        .select('user_id, points, activity_type')
        .in('user_id', allUserIds);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allUserIds);

      // Calculate points for each user
      const userScores = new Map<string, { content: number; activity: number }>();
      
      activities?.forEach(activity => {
        const current = userScores.get(activity.user_id) || { content: 0, activity: 0 };
        if (activity.activity_type === 'content_covered') {
          current.content += activity.points || 1;
        } else {
          current.activity += activity.points || 1;
        }
        userScores.set(activity.user_id, current);
      });

      // Build leaderboard
      const entries: LeaderboardEntry[] = profiles?.map(profile => {
        const scores = userScores.get(profile.id) || { content: 0, activity: 0 };
        return {
          user_id: profile.id,
          name: profile.name,
          content_points: scores.content,
          activity_points: scores.activity,
          total_points: scores.content + scores.activity,
          rank: 0,
          isCurrentUser: profile.id === user.id,
        };
      }) || [];

      // Sort and assign ranks
      entries.sort((a, b) => b.total_points - a.total_points);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Add friends to see the leaderboard!</p>
      </Card>
    );
  }

  const renderLeaderboardList = (sortBy: 'total' | 'content' | 'activity') => {
    const sorted = [...leaderboard].sort((a, b) => {
      if (sortBy === 'content') return b.content_points - a.content_points;
      if (sortBy === 'activity') return b.activity_points - a.activity_points;
      return b.total_points - a.total_points;
    });

    // Reassign ranks based on sort
    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return (
      <div className="space-y-2">
        {sorted.map((entry) => (
          <Card 
            key={entry.user_id} 
            className={`p-4 ${entry.isCurrentUser ? 'border-primary' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center">
                {entry.rank === 1 ? (
                  <Trophy className="w-8 h-8 text-yellow-500" />
                ) : entry.rank === 2 ? (
                  <Award className="w-7 h-7 text-gray-400" />
                ) : entry.rank === 3 ? (
                  <Award className="w-6 h-6 text-amber-600" />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <p className="font-semibold">
                  {entry.name} {entry.isCurrentUser && '(You)'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Content: {entry.content_points} • Activity: {entry.activity_points}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {sortBy === 'content' 
                    ? entry.content_points 
                    : sortBy === 'activity'
                    ? entry.activity_points
                    : entry.total_points}
                </p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="text-2xl font-bold">Leaderboard</h3>
      </div>

      <Tabs defaultValue="total" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="total">Overall</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="total" className="mt-4">
          {renderLeaderboardList('total')}
        </TabsContent>
        
        <TabsContent value="content" className="mt-4">
          {renderLeaderboardList('content')}
        </TabsContent>
        
        <TabsContent value="activity" className="mt-4">
          {renderLeaderboardList('activity')}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

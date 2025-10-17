import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, MapPin, Upload } from "lucide-react";
import { UploadTextbookDialog } from "@/components/UploadTextbookDialog";
import { TextbooksList } from "@/components/TextbooksList";
import { QuizResults } from "@/components/QuizResults";
import { SubjectProgress } from "@/components/SubjectProgress";
import { Leaderboard } from "@/components/Leaderboard";
import { FriendsManager } from "@/components/FriendsManager";
import { ActivityChart } from "@/components/ActivityChart";
import { QuizScoreTrendChart } from "@/components/QuizScoreTrendChart";
import { SubjectDistributionChart } from "@/components/SubjectDistributionChart";
import { ConversationSelector } from "@/components/ConversationSelector";
import { AppSidebar } from "@/components/AppSidebar";
import { TextbookSelector } from "@/components/TextbookSelector";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [conversationSelectorOpen, setConversationSelectorOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          navigate("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    } else {
      navigate("/login");
    }
    setLoading(false);
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
    setConversationSelectorOpen(true);
  };

  const subjects = [
    {
      title: "History",
      icon: BookOpen,
      description: "Learn about the past through different perspectives",
      gradient: "gradient-primary",
    },
    {
      title: "Geography",
      icon: MapPin,
      description: "Explore the world with visual learning",
      gradient: "gradient-secondary",
    },
  ];

  const quickActions = [
    {
      title: "Upload Textbook",
      icon: Upload,
      description: "Add new study materials",
      action: () => setUploadDialogOpen(true),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-8 py-6">
          <h2 className="text-3xl font-bold text-foreground">Dashboard for Student</h2>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.user_metadata?.name || "Student"}!</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Subjects */}
          <div>
            <h3 className="text-xl font-bold mb-4">Choose Your Subject</h3>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
              {subjects.map((subject, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-smooth cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleSubjectClick(subject.title)}
                >
                  <div className={`${subject.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                    <subject.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">{subject.title}</h4>
                  <p className="text-sm text-muted-foreground">{subject.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Current Textbook Selection */}
          <div>
            <h3 className="text-xl font-bold mb-4">Select Textbook</h3>
            <div className="max-w-3xl">
              <TextbookSelector />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-1 gap-4 max-w-3xl">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="p-5 hover:shadow-lg transition-smooth cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                  onClick={action.action}
                >
                  <div className="flex items-center gap-4">
                    <action.icon className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-bold mb-1">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div>
            <h3 className="text-xl font-bold mb-4">Learning Analytics</h3>
            <div className="grid lg:grid-cols-2 gap-4 max-w-6xl">
              <ActivityChart />
              <QuizScoreTrendChart />
            </div>
            <div className="mt-4 max-w-6xl">
              <SubjectDistributionChart />
            </div>
          </div>

          {/* Subject Progress */}
          <div>
            <h3 className="text-xl font-bold mb-4">Subject Progress</h3>
            <div className="max-w-3xl">
              <SubjectProgress />
            </div>
          </div>

          {/* Quiz Results */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quiz Performance</h3>
            <div className="max-w-3xl">
              <QuizResults />
            </div>
          </div>

          {/* Leaderboard and Friends */}
          <div>
            <div className="grid lg:grid-cols-2 gap-4 max-w-6xl">
              <Leaderboard />
              <FriendsManager />
            </div>
          </div>

          {/* My Textbooks */}
          <div>
            <h3 className="text-xl font-bold mb-4">My Textbooks</h3>
            <div className="max-w-3xl">
              <TextbooksList key={refreshKey} />
            </div>
          </div>
        </div>
      </main>

      <UploadTextbookDialog 
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      <ConversationSelector
        open={conversationSelectorOpen}
        onOpenChange={setConversationSelectorOpen}
        subject={selectedSubject}
      />
    </div>
  );
};

export default Dashboard;

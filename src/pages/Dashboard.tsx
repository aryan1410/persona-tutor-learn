import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, MapPin, LogOut, Upload } from "lucide-react";
import { UploadTextbookDialog } from "@/components/UploadTextbookDialog";
import { TextbooksList } from "@/components/TextbooksList";
import { QuizResults } from "@/components/QuizResults";
import { SubjectProgress } from "@/components/SubjectProgress";
import { Leaderboard } from "@/components/Leaderboard";
import { FriendsManager } from "@/components/FriendsManager";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const subjects = [
    {
      title: "History",
      icon: BookOpen,
      description: "Learn about the past through different perspectives",
      gradient: "gradient-primary",
      route: "/chat/history",
    },
    {
      title: "Geography",
      icon: MapPin,
      description: "Explore the world with visual learning",
      gradient: "gradient-secondary",
      route: "/chat/geography",
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
    <div className="min-h-screen relative">
      <div className="absolute inset-0 gradient-hero opacity-5 pointer-events-none" />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-primary text-transparent bg-clip-text">
              D-GEN
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="hover:scale-105 transition-smooth"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.name || "Student"}!
          </h2>
          <p className="text-xl text-muted-foreground">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Subjects */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Choose Your Subject</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {subjects.map((subject, index) => (
              <Card
                key={index}
                className="p-8 hover:scale-105 transition-smooth shadow-elegant hover:shadow-glow cursor-pointer animate-fade-in relative z-10"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(subject.route)}
              >
                <div className={`${subject.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-elegant`}>
                  <subject.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-3">{subject.title}</h4>
                <p className="text-muted-foreground">{subject.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-1 gap-6 max-w-4xl">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-elegant transition-smooth cursor-pointer animate-fade-in relative z-10"
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                onClick={action.action}
              >
                <action.icon className="w-10 h-10 mb-4 text-primary" />
                <h4 className="text-lg font-bold mb-2">{action.title}</h4>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Subject Progress */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Subject Progress</h3>
          <div className="max-w-4xl">
            <SubjectProgress />
          </div>
        </div>

        {/* Quiz Results */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Quiz Performance</h3>
          <div className="max-w-4xl">
            <QuizResults />
          </div>
        </div>

        {/* Leaderboard and Friends */}
        <div className="mb-12">
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl">
            <Leaderboard />
            <FriendsManager />
          </div>
        </div>

        {/* My Textbooks */}
        <div>
          <h3 className="text-2xl font-bold mb-6">My Textbooks</h3>
          <div className="max-w-4xl">
            <TextbooksList key={refreshKey} />
          </div>
        </div>
      </div>

      <UploadTextbookDialog 
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};

export default Dashboard;

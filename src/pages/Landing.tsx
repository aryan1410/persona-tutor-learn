import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sparkles, Users, Trophy, BookOpen, MapPin, Clock } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const personas = [
    {
      title: "Gen-Z Mode",
      icon: Sparkles,
      description: "Learn like you're texting your bestie. History becomes gossip, Geography becomes storytelling.",
      gradient: "gradient-primary",
    },
    {
      title: "Personal Mode",
      icon: Users,
      description: "Customized to your age and location. Examples that feel familiar, explanations that click.",
      gradient: "gradient-secondary",
    },
    {
      title: "Classic Mode",
      icon: BookOpen,
      description: "Traditional, professional tutoring. Straight facts, clear explanations.",
      gradient: "gradient-accent",
    },
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Upload Your Textbooks",
      description: "Drop in your History and Geography PDFs, and we'll make them interactive.",
    },
    {
      icon: MapPin,
      title: "Visual Learning",
      description: "Geography comes alive with AI-generated images that explain terrain and concepts.",
    },
    {
      icon: Clock,
      title: "Dynamic Quizzes",
      description: "Take tests on exactly what you just learned. Instant feedback, personalized questions.",
    },
    {
      icon: Trophy,
      title: "Compete with Friends",
      description: "Leaderboards, achievements, and collaborative learning. Make studying social.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-block">
              <h1 className="text-6xl md:text-7xl font-bold mb-4 animate-fade-in text-white drop-shadow-[0_0_30px_rgba(147,134,255,0.8)]">
                D-GEN
              </h1>
              <p className="text-2xl md:text-3xl font-semibold text-foreground/90 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Degeneralize content. Tailor to you.
              </p>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Learn History and Geography your way. Choose how you want to be taught, upload your textbooks, and make learning feel like a game.
            </p>
            
            <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth shadow-elegant text-lg px-8"
                onClick={() => navigate("/signup")}
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 hover:scale-105 transition-smooth"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Personas Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Learning Style</h2>
          <p className="text-xl text-muted-foreground">Switch between three unique teaching personas anytime</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {personas.map((persona, index) => (
            <Card 
              key={index}
              className="p-8 hover:scale-105 transition-smooth shadow-elegant hover:shadow-glow cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`${persona.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-elegant`}>
                <persona.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{persona.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{persona.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Excel</h2>
            <p className="text-xl text-muted-foreground">Powerful features that make learning engaging</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-elegant transition-smooth animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="gradient-hero p-12 text-center text-white shadow-glow">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-xl mb-8 opacity-90">Join students who are making History and Geography actually enjoyable</p>
          <Button 
            size="lg"
            variant="secondary"
            className="text-lg px-8 hover:scale-105 transition-smooth"
            onClick={() => navigate("/signup")}
          >
            Start Learning Now
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Landing;

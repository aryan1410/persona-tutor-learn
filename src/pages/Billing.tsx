import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const Billing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    }
  };

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "5 searches per day",
        "Image-based learning",
        "Basic AI responses",
        "Access to textbook library",
      ],
      current: true,
    },
    {
      name: "Pro",
      price: "$9.99/month",
      description: "Unlock advanced learning features",
      features: [
        "Unlimited messages & prompts",
        "AR/VR visual explanations",
        "Advanced AI responses",
        "Priority support",
        "Interactive 3D models",
        "Custom learning paths",
      ],
      current: false,
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Billing Information</h1>
          <p className="text-muted-foreground mb-8">Choose the plan that works best for you</p>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative bg-card border-border ${
                  plan.name === "Pro" ? "border-primary border-2" : ""
                }`}
              >
                {plan.name === "Pro" && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    Recommended
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-6"
                    variant={plan.current ? "outline" : "default"}
                    disabled={plan.current}
                  >
                    {plan.current ? "Current Plan" : "Upgrade Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Payment Information</CardTitle>
              <CardDescription>No payment method required for Basic plan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upgrade to Pro to unlock AR/VR visual learning experiences and unlimited access to our AI tutoring system.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Billing;


import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Check, Loader2, Crown, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Session } from "@supabase/supabase-js";

type SubscriptionTier = "free" | "pro" | "enterprise";

interface PlanFeature {
  title: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Basic file conversion for casual users",
    features: [
      { title: "Basic file conversions", included: true },
      { title: "5 conversions per day", included: true },
      { title: "Max file size: 10MB", included: true },
      { title: "Basic PDF tools", included: true },
      { title: "Batch processing", included: false },
      { title: "OCR capabilities", included: false },
      { title: "Priority support", included: false },
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    description: "Advanced features for professionals",
    features: [
      { title: "All file conversions", included: true },
      { title: "Unlimited conversions", included: true },
      { title: "Max file size: 100MB", included: true },
      { title: "All PDF tools", included: true },
      { title: "Batch processing", included: true },
      { title: "OCR capabilities", included: true },
      { title: "Priority support", included: false },
    ],
    isPopular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 29.99,
    description: "Complete solution for businesses",
    features: [
      { title: "All file conversions", included: true },
      { title: "Unlimited conversions", included: true },
      { title: "Max file size: 500MB", included: true },
      { title: "All PDF tools", included: true },
      { title: "Batch processing", included: true },
      { title: "OCR capabilities", included: true },
      { title: "Priority support", included: true },
    ]
  }
];

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          // Here you would check the user's subscription status
          // This is a placeholder and should be replaced with actual subscription check
          // For now, we'll default to "free" tier
          setActiveSubscription("free");
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      navigate("/auth");
      return;
    }

    // This would normally call a Supabase Edge Function to create a checkout session
    // For now, we'll just simulate the process
    setProcessingPayment(true);

    try {
      toast({
        title: "Processing subscription",
        description: "Please wait while we process your request..."
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful subscription
      setActiveSubscription(planId);
      toast({
        title: "Subscription successful!",
        description: `You are now subscribed to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`
      });
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        variant: "destructive",
        title: "Subscription failed",
        description: "There was an error processing your subscription. Please try again."
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-xl text-gray-400">Unlock premium features to enhance your document workflow</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className={`h-full flex flex-col ${plan.isPopular ? 'border-primary shadow-lg' : ''}`}>
                {plan.isPopular && (
                  <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {activeSubscription === plan.id && (
                      <span className="bg-green-500/20 text-green-500 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500 ml-2">/month</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <AlertCircle size={16} className="text-gray-400" />
                        )}
                        <span className={!feature.included ? "text-gray-500" : ""}>
                          {feature.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${activeSubscription === plan.id ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    disabled={processingPayment || activeSubscription === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                    variant={plan.isPopular ? "default" : "outline"}
                  >
                    {processingPayment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : activeSubscription === plan.id ? (
                      <>Current Plan</>
                    ) : (
                      <>Subscribe</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>All plans include 30-day money-back guarantee. Cancel anytime.</p>
          <p className="mt-2">Need a custom solution? <a href="#contact" className="text-primary underline">Contact us</a></p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;

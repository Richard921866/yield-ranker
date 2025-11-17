import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";

interface UpgradeToPremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeToPremiumModal = ({ open, onOpenChange }: UpgradeToPremiumModalProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLoggedIn = !!user;
  const isPremium = !!profile;

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      onOpenChange(false);
      navigate("/login", { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    if (isPremium) {
      onOpenChange(false);
      toast({
        title: "You already have Premium!",
        description: "All signed-up users have full access to Favorites and Weighted Rankings.",
      });
      return;
    }

    onOpenChange(false);
    navigate("/login");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <Card
        className="w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary fill-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Premium Feature
              </h3>
              <p className="text-sm text-muted-foreground">
                {!isLoggedIn 
                  ? "Sign up to unlock Customize Rankings, Favorites, and all premium features. All users get Premium access automatically."
                  : "Upgrade to Premium to unlock Customize Rankings, Favorites, and all premium features."
                }
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-4 border-2 border-primary/20">
            <p className="text-sm font-semibold text-primary mb-3">
              Premium benefits include:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Unlimited favorites</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Weighted Ranking customization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Save watchlists across devices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Advanced filtering and alerts</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {!isLoggedIn ? "Sign Up for Free" : "Get Premium Access"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};


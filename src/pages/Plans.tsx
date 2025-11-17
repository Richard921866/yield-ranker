import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Lock, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Plans() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isGuest = !profile;
  const isPremium = !!profile;

  const handleUpgradeToPremium = async () => {
    if (!user) {
      toast({
        title: "Sign up to get Premium",
        description: "Create an account and automatically get premium access.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    toast({
      title: "You already have Premium!",
      description: "All signed-up users have full access to premium features.",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Access powerful ETF research tools and customize your investment analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* FREE Plan */}
            <Card className="relative p-6 bg-white border-2 border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                  <Lock className="w-7 h-7 text-slate-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">FREE</h2>
                  <p className="text-sm font-medium text-slate-500">Basic Access</p>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-700 mb-5">
                Everyone is invited to view the information I use to research Covered Call Option ETFs, including these important metrics: Symbol, Issuer, Description, Pay Day, IPO Price, Price, Price Change, Dividend, #Payments, Annual Dividend, Forward Yield, and Dividend Volatility Index (DVI).
              </p>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Symbol, Issuer, Description</span>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Pay Day, IPO Price, Current Price</span>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Price Change, Dividend, #Payments</span>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Annual Dividend, Forward Yield</span>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Dividend Volatility Index (DVI)</span>
                </li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-red-900 mb-3 uppercase tracking-wide">Not Included</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-red-700">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">FAVORITES</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-red-700">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">WEIGHTED RANKING</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
                I encourage all guests to subscribe to the FREE Premium Plan to obtain these additional features. Click here to upgrade to FREE PREMIUM.
              </p>

              {isGuest && (
                <Button 
                  className="w-full bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold h-11"
                  size="lg"
                  disabled
                >
                  Current Plan
                </Button>
              )}
            </Card>

            {/* PREMIUM Plan */}
            <Card className="relative p-6 bg-gradient-to-br from-primary/10 via-blue-50/50 to-accent/10 border-2 border-primary rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-md">
                  RECOMMENDED
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/20 mt-2">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center shadow-sm border border-primary/30">
                  <Star className="w-7 h-7 text-primary fill-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">PREMIUM</h2>
                  <p className="text-sm font-semibold text-primary">Free</p>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-700 mb-5">
                This plan adds 2 important features to the FREE plan.
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-white/90 rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">FAVORITES</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pl-10">
                    This allows users to select their favorite ETFs to a separate group that is displayed in their own table so that it is easy to analyze away from the full ETF table. Just click on the icon in first column to select. To access, click on Account and then Favorites.
                  </p>
                </div>

                <div className="bg-white/90 rounded-lg p-4 border-2 border-primary/30 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-blue-600 fill-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">WEIGHTED RANKING</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pl-10">
                    Among the most important features of the website. Allows FREE Premium Subscribers to rank each ETF by determining the weight of Yield, Dividend Volatility Index (DVI) and Total Returns. Once the weights have been selected, the program will rank each ETF from top to bottom.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed font-medium">
                It is recommended that all FREE users upgrade to FREE PREMIUM to take advantage of the robust features. Click here to upgrade to FREE PREMIUM.
              </p>

              {isPremium ? (
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11 shadow-md"
                  size="lg"
                  disabled
                >
                  <Check className="w-5 h-5 mr-2" />
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold h-11 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  onClick={handleUpgradeToPremium}
                >
                  <Star className="w-5 h-5 mr-2" />
                  Upgrade to FREE PREMIUM
                </Button>
              )}
            </Card>
          </div>

          <div className="mt-16 text-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/20">
            <p className="text-lg text-slate-700 font-medium mb-4">
              All signed-up users automatically receive Premium access for FREE
            </p>
            <p className="text-base text-slate-600">
              Have questions? <button onClick={() => navigate("/contact")} className="text-primary hover:underline font-semibold">Contact us</button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


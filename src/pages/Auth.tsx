import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { AuthWidget } from "@/auth/AuthWidget";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mode, setMode] = useState<"login" | "register">("login");
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: { pathname: string } } | null;
  const redirectTo =
    state?.from?.pathname && state.from.pathname !== "/login"
      ? state.from.pathname
      : "/";

  useEffect(() => {
    if (!loading && session) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, session, navigate, redirectTo]);

  const handleSuccess = () => {
    navigate(redirectTo, { replace: true });
  };

  const testimonials = [
    {
      quote: "Cut my ETF analysis time in half. Finally found an efficient way to compare covered call strategies.",
      author: "Sarah Bright",
      role: "Investment Advisor"
    },
    {
      quote: "The ranking system makes it easy to spot the best ETFs for my clients. Custom weights are exactly what I needed.",
      author: "Michael Chen",
      role: "Portfolio Manager"
    },
    {
      quote: "This is exactly what I've been looking for. Makes income investing so much simpler.",
      author: "Emily Rodriguez",
      role: "Financial Analyst"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative flex min-h-[calc(100vh-4rem)]">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex">
          <div className="w-full lg:w-1/2 flex items-center py-8 sm:py-12 lg:py-16">
            <div className="w-full max-w-md space-y-6 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  {mode === "login" ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {mode === "login"
                    ? "Sign in to access your portfolio and favorites"
                    : "Start exploring and utilizing all the resources that will help you make informed investment decisions."}
                </p>
              </div>
              <AuthWidget onSuccess={handleSuccess} onModeChange={setMode} />
            </div>
          </div>

          <div className="hidden lg:flex lg:w-1/2"></div>
        </div>

          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[50vw] bg-gradient-to-br from-primary via-blue-600 to-accent">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/30 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative h-full flex items-center justify-center z-10">
            <div className="w-full max-w-2xl px-6 sm:px-8 lg:px-12 space-y-6 sm:space-y-8 py-12 sm:py-16 relative z-10">
              <div className="flex flex-wrap justify-center gap-3">
                <span className="px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm font-medium shadow-lg">
                  Community of investors
                </span>
                <span className="px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm font-medium shadow-lg">
                  Investment resources
                </span>
              </div>

              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
                <p className="text-2xl font-bold text-white leading-relaxed mb-6">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <div>
                  <p className="text-white font-semibold text-lg">{testimonials[currentTestimonial].author}</p>
                  <p className="text-white/80 text-sm mt-1">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 relative z-20">
                <button
                  type="button"
                  onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                  className="w-11 h-11 rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 cursor-pointer relative z-20"
                  aria-label="Previous testimonial"
                >
                  <ArrowLeft className="w-5 h-5 pointer-events-none" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                  className="w-11 h-11 rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 cursor-pointer relative z-20"
                  aria-label="Next testimonial"
                >
                  <ArrowRight className="w-5 h-5 pointer-events-none" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;

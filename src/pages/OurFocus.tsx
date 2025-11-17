import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Shield, Zap, DollarSign } from "lucide-react";
import { Footer } from "@/components/Footer";

const OurFocus = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Covered Call <span className="text-primary">Excellence</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Systematic income generation through professionally managed option
              strategies
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: DollarSign,
                title: "Premium Income",
                description:
                  "Consistent cash flow through strategic call option writing on institutional-grade equity portfolios",
              },
              {
                icon: Shield,
                title: "Downside Buffer",
                description:
                  "Option premiums provide cushion against market volatility while maintaining upside participation",
              },
              {
                icon: Zap,
                title: "Live Analytics",
                description:
                  "Real time performance tracking with customizable weighting for personalized rankings",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="p-10 md:p-16 border-2">
              <h2 className="text-3xl font-bold mb-6">The Mechanics</h2>
              <div className="space-y-6 text-muted-foreground">
                <p className="text-lg leading-loose">
                  Covered call ETFs hold portfolios of stocks while
                  systematically selling call options against those positions.
                  The premiums collected from selling these options generate
                  additional income beyond dividends.
                </p>
                <p className="text-lg leading-loose">
                  This approach trades some upside potential for immediate
                  income. If the underlying stock rises above the strike price,
                  gains are capped but the premium is retained. If the stock
                  declines, the premium provides a modest buffer.
                </p>
              </div>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                label: "Yield Contribution",
                value:
                  "Option premiums enhance base dividend yield by 200-500 basis points",
              },
              {
                label: "Risk Profile",
                value:
                  "Standard deviation quantifies volatility - lower is steadier",
              },
              {
                label: "Total Return",
                value:
                  "Combines price movement and income over trailing 12 months",
              },
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
              >
                <Card className="p-6 bg-gradient-to-br from-slate-50 to-transparent border-2">
                  <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                    {metric.label}
                  </div>
                  <div className="text-base text-muted-foreground leading-relaxed">
                    {metric.value}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OurFocus;

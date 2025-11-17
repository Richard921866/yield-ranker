import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

const Focus = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="relative border-b overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 relative">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
                My{" "}
                <span className="bg-gradient-to-r from-primary via-blue-600 to-accent bg-clip-text text-transparent">
                  Focus
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                Understanding my investment methodology and approach
              </p>
            </div>
          </div>
        </section>

        <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <Card className="p-8 md:p-12 border-2 border-slate-200 shadow-xl">
            <div className="prose prose-lg max-w-none space-y-6 text-slate-700 leading-relaxed">
              <p>
                Dividends and Total Returns is a simple yet powerful program I use to help make logical investment decisions by monitoring TOTAL RETURNS over several time periods. This allows me to see any trends developing that will help (along with other research) to make the decision to buy, sell, or hold a position in that security.
              </p>

              <p>
                Total Return is the combined gain or loss from price appreciation (increase or decrease) plus dividends and interest paid during specific periods of time. If an investment in a $10 stock resulted in a price appreciation of $1 and a dividend of $1, the Total Return is $2 or 20%. However, if that same investment in a $10 stock resulted in a price decrease of $2 and a dividend of $1, then the Total Return was -$1 or -10%.
              </p>

              <p>
                For most income investors, including myself, the goal is to increase the dividends received while maintaining a stable or growing value in their portfolio. Income is the primary goal and portfolio value is secondary. It is ok to see the value of my portfolio decrease temporarily, but losing value permanently is not desired. By focusing on Total Returns in specific investments, I can spot just how successful that investment is and then able to move in or out as trends develop.
              </p>

              <p>
                Making investment decisions based on Income, Yield and Total Return can be very helpful for most investment types; however, my focus will be using these tools with Covered Call ETFs. If successful, I will add Closed End Funds and other investment categories if appropriate.
              </p>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Focus;


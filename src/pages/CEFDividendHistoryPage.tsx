import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DividendHistory } from "@/components/DividendHistory";
import { fetchSingleCEF, fetchCEFDataWithMetadata } from "@/services/cefData";
import { CEF } from "@/types/cef";

const CEFDividendHistoryPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [cef, setCef] = useState<CEF | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cefNotFound, setCefNotFound] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const loadCEF = async () => {
      if (!symbol) return;
      
      setIsLoading(true);
      setCefNotFound(false);
      try {
        const [singleData, metadata] = await Promise.all([
          fetchSingleCEF(symbol),
          fetchCEFDataWithMetadata()
        ]);
        
        if (singleData) {
          setCef(singleData);
        } else {
          setCefNotFound(true);
        }
        
        if (metadata.lastUpdatedTimestamp) {
          const date = new Date(metadata.lastUpdatedTimestamp);
          const formatted = date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          setLastUpdated(formatted);
        } else if (metadata.lastUpdated) {
          setLastUpdated(metadata.lastUpdated);
        }
      } catch (error) {
        console.error("Error loading CEF:", error);
        setCefNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadCEF();
  }, [symbol]);

  if (!symbol) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Invalid symbol</p>
            <Button onClick={() => navigate("/cef")} className="mt-4">
              Back to CEFs
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <Button
            variant="ghost"
            onClick={() => navigate("/cef")}
            className="mb-6 hover:bg-slate-100 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CEFs
          </Button>
        </div>

        {cefNotFound && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-400 delay-100">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This CEF is not currently in our database, but dividend history may still be available.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {cef && (
              <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {cef.symbol} Dividend History
                    </h1>
                    {cef.name && (
                      <p className="text-muted-foreground">{cef.name}</p>
                    )}
                  </div>
                  {lastUpdated && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 md:mt-0">
                      <Clock className="h-4 w-4" />
                      <span>Last updated: {lastUpdated}</span>
                    </div>
                  )}
                </div>
                {cef.dividendHistory && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Dividend Changes: <span className="font-semibold text-foreground">{cef.dividendHistory}</span>
                    </p>
                  </div>
                )}
              </Card>
            )}

            <DividendHistory
              ticker={symbol.toUpperCase()}
              annualDividend={cef?.yearlyDividend || null}
              dvi={cef?.dividendCVPercent || null}
              forwardYield={cef?.forwardYield || null}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CEFDividendHistoryPage;


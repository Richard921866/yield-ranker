import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Shield, Clock } from "lucide-react";
import { getSiteSettings } from "@/services/admin";

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal = ({ onAccept }: DisclaimerModalProps) => {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const hasAcceptedThisSession = sessionStorage.getItem("disclaimer_accepted");
    if (!hasAcceptedThisSession) {
      setOpen(true);
    } else {
      onAccept();
    }

    const loadLastUpdated = async () => {
      try {
        const settings = await getSiteSettings();
        const updateSetting = settings.find(s => s.key === 'data_last_updated');
        if (updateSetting) {
          setLastUpdated(updateSetting.value);
        }
      } catch (error) {
        console.error('Error loading last updated:', error);
      }
    };

    loadLastUpdated();
  }, [onAccept]);

  const handleAccept = () => {
    if (accepted) {
      sessionStorage.setItem("disclaimer_accepted", "true");
      setOpen(false);
      onAccept();
    }
  };

  const formatLastUpdated = (dateStr: string) => {
    if (!dateStr) return "11/19/2025 7:08 AM";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/20">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                Important Legal Disclaimer
              </DialogTitle>
              <p className="text-sm text-slate-600 leading-relaxed">
                Please read and accept this disclaimer to continue accessing the site
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-base mb-2 flex items-center gap-2">
                  End of Day (EOD) Data Notice
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed mb-3">
                  All data on this website is <strong>END OF DAY (EOD)</strong> data and <strong>IS NOT REAL-TIME</strong>. 
                  Price data, dividends, and returns are updated periodically and may be delayed. Do not rely on this 
                  information for intraday trading decisions.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-semibold text-amber-900">Last Updated:</span>
                  <span className="text-xs font-medium text-amber-800">{formatLastUpdated(lastUpdated)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2.5 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                We Are Not Financial Advisors
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                The information on this website is provided for <strong>educational and informational purposes only</strong> and 
                does not constitute financial, investment, tax, or legal advice. We are not licensed financial advisors, 
                broker-dealers, or registered investment advisers.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2.5">
                No Investment Recommendations
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                No content on this site should be interpreted as a recommendation to buy, sell, or hold any security, 
                ETF, stock, or other financial instrument. All investment decisions are your sole responsibility.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">
                  Data Accuracy & Timeliness
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  All data is provided "AS IS" without warranties of any kind. We do not guarantee the accuracy, 
                  completeness, or timeliness of any data. Data may contain errors, omissions, or be outdated.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">
                  Investment Risks
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  All investments involve risk, including the potential loss of principal. Past performance does not 
                  guarantee future results. Covered call ETFs carry specific risks including volatility and dividend cuts.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">
                  Your Responsibility
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  You must conduct your own research and due diligence. Consult with a qualified, licensed financial 
                  professional before making any investment decisions.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">
                  Limitation of Liability
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  We assume no liability for any losses, damages, or adverse consequences arising from your use of 
                  this website or reliance on any information provided herein.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-xl p-5 border-2 border-primary/20">
            <div className="flex items-start gap-4">
              <Checkbox 
                id="accept-disclaimer" 
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label 
                htmlFor="accept-disclaimer"
                className="text-sm text-slate-800 leading-relaxed cursor-pointer select-none flex-1"
              >
                <strong>I acknowledge and agree:</strong> I have read and understood this disclaimer in its entirety. 
                I acknowledge that all data is END OF DAY and not real-time. I understand this is not financial advice 
                and I will consult with a licensed professional before making investment decisions. I agree to use this 
                website at my own risk and hold the site operators harmless from any claims, damages, or losses.
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex justify-end">
          <Button
            onClick={handleAccept}
            disabled={!accepted}
            size="lg"
            className="font-semibold px-10 py-6 text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90"
          >
            I Accept - Continue to Site
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


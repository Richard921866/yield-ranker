import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Terms of Service"
        description="Terms of Service for Dividends & Total Returns. Read our terms and conditions for using our ETF and CEF analysis platform."
        keywords="terms of service, legal terms, ETF platform terms, investing disclaimer"
        noIndex={true}
      />
      <Header />

      <main className="flex-1">
        <section className="relative border-b overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

          <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Terms of Service
              </h1>
              <p className="text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        <section className="container max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <Card className="p-8 md:p-12 border-2 border-slate-200">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                By accessing and using Dividends & Total Returns ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this Service.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">2. Use License</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Permission is granted to temporarily access the materials on Dividends & Total Returns for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose; attempt to decompile or reverse engineer any software contained on the Service; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or "mirror" the materials on any other server.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">3. Disclaimer</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The materials on the Service are provided on an 'as is' basis. Dividends & Total Returns makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>

              <p className="text-muted-foreground mb-6 leading-relaxed font-semibold">
                Investment Disclaimer: The information provided on this Service is for informational purposes only and should not be construed as investment advice. All investments involve risk, and past performance does not guarantee future results. Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">4. Limitations</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                In no event shall Dividends & Total Returns or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Service, even if Dividends & Total Returns or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">5. Accuracy of Materials</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The materials appearing on the Service could include technical, typographical, or photographic errors. Dividends & Total Returns does not warrant that any of the materials on its Service are accurate, complete or current. Dividends & Total Returns may make changes to the materials contained on its Service at any time without notice.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">6. Links</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Dividends & Total Returns has not reviewed all of the sites linked to its Service and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Dividends & Total Returns of the site. Use of any such linked website is at the user's own risk.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">7. Modifications</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Dividends & Total Returns may revise these terms of service for its Service at any time without notice. By using this Service you are agreeing to be bound by the then current version of these terms of service.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">8. Governing Law</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our Contact Us page.
              </p>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;


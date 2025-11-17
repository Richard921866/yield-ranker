import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

const DoNotSell = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="relative border-b overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Do Not Sell My Personal Information
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
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Commitment to Your Privacy</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                At Dividends & Total Returns, we respect your privacy rights and are committed to transparency about our data practices. This page provides information about your rights under various privacy laws, including the California Consumer Privacy Act (CCPA) and other applicable state privacy laws.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">We Do Not Sell Your Personal Information</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed font-semibold text-lg">
                Dividends & Total Returns does not sell, rent, or trade your personal information to third parties.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We have not sold personal information in the past 12 months, and we do not have plans to sell personal information in the future. We value your trust and are committed to protecting your privacy.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                We may collect the following categories of personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 leading-relaxed space-y-2 ml-4">
                <li>Identifiers such as name and email address</li>
                <li>Internet or other electronic network activity information</li>
                <li>Geolocation data</li>
                <li>Professional or employment-related information (if provided)</li>
                <li>Inferences drawn from the above to create a profile about preferences and characteristics</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 leading-relaxed space-y-2 ml-4">
                <li>To provide, maintain, and improve our Service</li>
                <li>To personalize your experience</li>
                <li>To communicate with you about our Service</li>
                <li>To analyze how our Service is used</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">Sharing of Information</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We may share your personal information with service providers who perform services on our behalf, such as hosting providers, analytics providers, and customer support services. These service providers are contractually obligated to use your information only for the purposes of providing services to us and are prohibited from selling your information.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 leading-relaxed space-y-2 ml-4">
                <li><strong>Right to Know:</strong> You have the right to request that we disclose what personal information we collect, use, disclose, and sell</li>
                <li><strong>Right to Delete:</strong> You have the right to request that we delete your personal information</li>
                <li><strong>Right to Opt-Out:</strong> You have the right to opt-out of the sale of your personal information (though we do not sell personal information)</li>
                <li><strong>Right to Non-Discrimination:</strong> You have the right not to receive discriminatory treatment for exercising your privacy rights</li>
                <li><strong>Right to Correction:</strong> You have the right to request correction of inaccurate personal information</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">How to Exercise Your Rights</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                To exercise any of your privacy rights, please contact us through our Contact Us page. We will respond to your request within the timeframes required by applicable law. You may be required to verify your identity before we can process your request.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Authorized Agents</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                You may designate an authorized agent to make requests on your behalf. The authorized agent must provide proof of authorization, and we may require you to verify your identity directly with us.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Notice</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We may update this notice from time to time. We will notify you of any changes by posting the new notice on this page and updating the "Last updated" date.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this notice or our privacy practices, please contact us through our Contact Us page.
              </p>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DoNotSell;


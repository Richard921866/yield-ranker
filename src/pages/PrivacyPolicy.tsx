import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

const PrivacyPolicy = () => {
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
                Privacy Policy
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
              <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Dividends & Total Returns ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed font-semibold">
                Personal Information
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We may collect personal information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products and services, when you participate in activities on the Service, or otherwise when you contact us. This information may include: name, email address, and account preferences.
              </p>

              <p className="text-muted-foreground mb-3 leading-relaxed font-semibold">
                Automatically Collected Information
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We may automatically collect certain information when you visit, use, or navigate the Service. This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, and other technical information.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                We use the information we collect or receive to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 leading-relaxed space-y-2 ml-4">
                <li>Facilitate account creation and authentication</li>
                <li>Send you administrative information and updates</li>
                <li>Provide you with personalized content and recommendations</li>
                <li>Improve and optimize our Service</li>
                <li>Monitor and analyze usage and trends</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Enforce our terms, conditions, and policies</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">Sharing Your Information</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information with service providers who perform services on our behalf, such as hosting, data analysis, email delivery, and customer service. These service providers are authorized to use your personal information only as necessary to provide these services to us.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We may use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with small amounts of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 leading-relaxed space-y-2 ml-4">
                <li>The right to access and receive a copy of your personal information</li>
                <li>The right to correct or update your personal information</li>
                <li>The right to delete your personal information</li>
                <li>The right to restrict or object to the processing of your personal information</li>
                <li>The right to data portability</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Our Service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our Contact Us page.
              </p>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;


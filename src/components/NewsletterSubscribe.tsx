import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { subscribeToNewsletter, unsubscribeFromNewsletter } from "@/services/newsletter";
import { listSubscribers } from "@/services/newsletterAdmin";
import { Loader2, Mail, CheckCircle, X } from "lucide-react";

export const NewsletterSubscribe = () => {
    const { user } = useAuth();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [checkingSubscription, setCheckingSubscription] = useState(true);
    const [unsubscribing, setUnsubscribing] = useState(false);
    const { toast } = useToast();

    const userEmail = user?.email || "";

    // Check subscription status on mount and when user changes
    useEffect(() => {
        const checkSubscription = async () => {
            if (!userEmail) {
                setCheckingSubscription(false);
                setIsSubscribed(false);
                return;
            }

            try {
                const result = await listSubscribers(10000, 0);
                if (result.success && result.subscribers) {
                    const subscribed = result.subscribers.some(
                        (sub) => sub.email.toLowerCase() === userEmail.toLowerCase() && sub.status === 'active'
                    );
                    setIsSubscribed(subscribed);
                    // Pre-fill email if user is logged in
                    if (subscribed) {
                        setEmail(userEmail);
                    }
                }
            } catch (error) {
                console.error('Failed to check subscription:', error);
            } finally {
                setCheckingSubscription(false);
            }
        };

        checkSubscription();
    }, [userEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailToUse = userEmail || email.trim();
        
        if (!emailToUse) {
            toast({
                variant: "destructive",
                title: "Email required",
                description: "Please enter your email address.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const result = await subscribeToNewsletter(emailToUse);

            if (result.success) {
                setIsSubscribed(true);
                setEmail(userEmail); // Keep user email if logged in
                // Dispatch custom event to notify newsletter pages
                window.dispatchEvent(new CustomEvent('newsletter-subscription-changed', { 
                    detail: { isSubscribed: true } 
                }));
                toast({
                    title: "Success!",
                    description: result.message,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Subscription failed",
                    description: result.message,
                });
            }
        } catch {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        if (!userEmail) {
            toast({
                variant: "destructive",
                title: "Email required",
                description: "Please sign in to unsubscribe.",
            });
            return;
        }

        setUnsubscribing(true);

        try {
            const result = await unsubscribeFromNewsletter(userEmail);

            if (result.success) {
                setIsSubscribed(false);
                // Dispatch custom event to notify newsletter pages
                window.dispatchEvent(new CustomEvent('newsletter-subscription-changed', { 
                    detail: { isSubscribed: false } 
                }));
                toast({
                    title: "Unsubscribed",
                    description: result.message || "You have been unsubscribed from the newsletter.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Unsubscribe failed",
                    description: result.message,
                });
            }
        } catch {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong. Please try again.",
            });
        } finally {
            setUnsubscribing(false);
        }
    };

    // Show loading state while checking subscription
    if (checkingSubscription) {
        return (
            <div className="flex items-center gap-2 w-full max-w-md">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking subscription...</span>
            </div>
        );
    }

    // Show unsubscribe button if subscribed
    if (isSubscribed) {
        return (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <div className="flex items-center gap-2 text-green-600 flex-shrink-0">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Subscribed</span>
                </div>
                <Button
                    onClick={handleUnsubscribe}
                    disabled={unsubscribing}
                    variant="outline"
                    className="border-2 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive whitespace-nowrap w-full sm:w-auto"
                >
                    {unsubscribing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Unsubscribing...
                        </>
                    ) : (
                        <>
                            <X className="h-4 w-4 mr-2" />
                            Unsubscribe
                        </>
                    )}
                </Button>
            </div>
        );
    }

    // Show subscribe form if not subscribed
    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
            <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="email"
                    placeholder={userEmail ? userEmail : "Enter your email"}
                    value={userEmail ? userEmail : email}
                    onChange={(e) => !userEmail && setEmail(e.target.value)}
                    className="pl-10 border-2"
                    disabled={isLoading || !!userEmail}
                    readOnly={!!userEmail}
                />
            </div>
            <Button
                type="submit"
                disabled={isLoading || (!userEmail && !email.trim())}
                className="whitespace-nowrap"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subscribing...
                    </>
                ) : (
                    "Subscribe"
                )}
            </Button>
        </form>
    );
};

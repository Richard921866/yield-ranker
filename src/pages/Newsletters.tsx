/**
 * Newsletters Archive Page
 * 
 * Public page for premium users to view newsletter archive
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Mail, Lock } from 'lucide-react';
import { listCampaigns, getCampaign, type Campaign } from '@/services/newsletterAdmin';

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return 'N/A';
    }
};

export default function Newsletters() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [loadingCampaign, setLoadingCampaign] = useState(false);

    const isPremium = profile?.is_premium || user?.user_metadata?.is_premium;

    useEffect(() => {
        if (!isPremium) {
            return;
        }
        loadCampaigns();
    }, [isPremium]);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const result = await listCampaigns(100, 0);
            if (result.success && result.campaigns) {
                // Only show sent campaigns to premium users
                const sentCampaigns = result.campaigns
                    .filter((c) => c.status === 'sent')
                    .sort((a, b) => {
                        const dateA = a.sent_at ? new Date(a.sent_at).getTime() : 0;
                        const dateB = b.sent_at ? new Date(b.sent_at).getTime() : 0;
                        return dateB - dateA; // Newest first
                    });
                setCampaigns(sentCampaigns);
            }
        } catch (error) {
            console.error('Failed to load campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCampaign = async (campaign: Campaign) => {
        if (!campaign.id) return;

        setLoadingCampaign(true);
        try {
            const result = await getCampaign(campaign.id);
            if (result.success && result.campaign) {
                setSelectedCampaign(result.campaign);
            }
        } catch (error) {
            console.error('Failed to load campaign:', error);
        } finally {
            setLoadingCampaign(false);
        }
    };

    if (!isPremium) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-12">
                    <Card className="p-12 text-center">
                        <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Premium Access Required</h1>
                        <p className="text-muted-foreground mb-6">
                            You need a premium account to view newsletter archives.
                        </p>
                        <Button onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Newsletter Archive</h1>
                    <p className="text-muted-foreground">
                        Browse past newsletters and updates
                    </p>
                </div>

                {loading ? (
                    <Card className="p-12">
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    </Card>
                ) : selectedCampaign ? (
                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedCampaign(null)}
                        >
                            ← Back to Archive
                        </Button>
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold mb-2">{selectedCampaign.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    Sent: {formatDate(selectedCampaign.sent_at)}
                                </p>
                            </div>
                            {selectedCampaign.content?.html ? (
                                <div
                                    className="prose max-w-none"
                                    dangerouslySetInnerHTML={{ __html: selectedCampaign.content.html }}
                                />
                            ) : selectedCampaign.content?.plain ? (
                                <div className="whitespace-pre-wrap text-sm">
                                    {selectedCampaign.content.plain}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No content available</p>
                            )}
                        </Card>
                    </div>
                ) : campaigns.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No newsletters available yet</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {campaigns.map((campaign) => (
                            <Card
                                key={campaign.id}
                                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleViewCampaign(campaign)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-2">{campaign.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {campaign.subject}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Sent: {formatDate(campaign.sent_at)}
                                        </p>
                                    </div>
                                    {loadingCampaign && selectedCampaign?.id === campaign.id && (
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}


/**
 * Newsletter Management Component
 * 
 * Admin component for managing newsletters/campaigns
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
    listCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    sendCampaign,
    addSubscriber,
    removeSubscriber,
    type Campaign,
} from '@/services/newsletterAdmin';
import {
    Mail,
    Plus,
    Edit,
    Send,
    Trash2,
    Loader2,
    UserPlus,
    UserMinus,
    RefreshCw,
} from 'lucide-react';

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'N/A';
    }
};

export function NewsletterManagement() {
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubscriberDialogOpen, setIsSubscriberDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [subscriberEmail, setSubscriberEmail] = useState('');
    const [subscriberAction, setSubscriberAction] = useState<'add' | 'remove'>('add');
    const [subscriberLoading, setSubscriberLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        type: 'regular' as 'regular' | 'ab',
        content: { html: '', plain: '' },
        from_name: '',
        from_email: '',
        reply_to: '',
    });

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const result = await listCampaigns(100, 0);
            if (result.success && result.campaigns) {
                setCampaigns(result.campaigns);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to load campaigns',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to load campaigns: ${(error as Error).message}`,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            name: '',
            subject: '',
            type: 'regular',
            content: { html: '', plain: '' },
            from_name: '',
            from_email: '',
            reply_to: '',
        });
        setIsCreateDialogOpen(true);
    };

    const handleEdit = async (campaign: Campaign) => {
        if (!campaign.id) return;
        
        try {
            const result = await getCampaign(campaign.id);
            if (result.success && result.campaign) {
                setEditingCampaign(result.campaign);
                setFormData({
                    name: result.campaign.name,
                    subject: result.campaign.subject,
                    type: result.campaign.type || 'regular',
                    content: result.campaign.content || { html: '', plain: '' },
                    from_name: result.campaign.from_name || '',
                    from_email: result.campaign.from_email || '',
                    reply_to: result.campaign.reply_to || '',
                });
                setIsEditDialogOpen(true);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to load campaign',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to load campaign: ${(error as Error).message}`,
            });
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.subject) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Name and subject are required',
            });
            return;
        }

        setSaving(true);
        try {
            let result;
            if (editingCampaign?.id) {
                result = await updateCampaign(editingCampaign.id, formData);
            } else {
                result = await createCampaign(formData);
            }

            if (result.success) {
                toast({
                    title: 'Success',
                    description: editingCampaign ? 'Campaign updated successfully' : 'Campaign created successfully',
                });
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingCampaign(null);
                await loadCampaigns();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to save campaign',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to save campaign: ${(error as Error).message}`,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async (campaignId: string) => {
        if (!confirm('Are you sure you want to send this newsletter? This action cannot be undone.')) {
            return;
        }

        setSending(true);
        try {
            const result = await sendCampaign(campaignId);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Newsletter sent successfully',
                });
                await loadCampaigns();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to send newsletter',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to send newsletter: ${(error as Error).message}`,
            });
        } finally {
            setSending(false);
        }
    };

    const handleSubscriberAction = async () => {
        if (!subscriberEmail || !subscriberEmail.includes('@')) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please enter a valid email address',
            });
            return;
        }

        setSubscriberLoading(true);
        try {
            let result;
            if (subscriberAction === 'add') {
                result = await addSubscriber(subscriberEmail);
            } else {
                result = await removeSubscriber(subscriberEmail);
            }

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                setSubscriberEmail('');
                setIsSubscriberDialogOpen(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to process subscriber',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to process subscriber: ${(error as Error).message}`,
            });
        } finally {
            setSubscriberLoading(false);
        }
    };

    const getStatusBadge = (status?: string) => {
        const statusColors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700',
            outbox: 'bg-blue-100 text-blue-700',
            sent: 'bg-green-100 text-green-700',
        };
        const color = statusColors[status || 'draft'] || 'bg-gray-100 text-gray-700';
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                {status?.toUpperCase() || 'DRAFT'}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Newsletter Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create, edit, and send newsletters to your subscribers
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsSubscriberDialogOpen(true)}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Manage Subscribers
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Newsletter
                    </Button>
                    <Button variant="outline" onClick={loadCampaigns} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {loading ? (
                <Card className="p-12">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </Card>
            ) : campaigns.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center">
                        <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No newsletters found</p>
                        <Button onClick={handleCreate} className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Newsletter
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                                        {getStatusBadge(campaign.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Subject: {campaign.subject}
                                    </p>
                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                        <span>Created: {formatDate(campaign.created_at)}</span>
                                        {campaign.sent_at && (
                                            <span>Sent: {formatDate(campaign.sent_at)}</span>
                                        )}
                                        {campaign.updated_at && campaign.updated_at !== campaign.created_at && (
                                            <span>Updated: {formatDate(campaign.updated_at)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {campaign.id && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(campaign)}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            {campaign.status !== 'sent' && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => campaign.id && handleSend(campaign.id)}
                                                    disabled={sending}
                                                >
                                                    <Send className="w-4 h-4 mr-2" />
                                                    {sending ? 'Sending...' : 'Send'}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog
                open={isCreateDialogOpen || isEditDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateDialogOpen(false);
                        setIsEditDialogOpen(false);
                        setEditingCampaign(null);
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCampaign ? 'Edit Newsletter' : 'Create New Newsletter'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCampaign
                                ? 'Update the newsletter details below'
                                : 'Fill in the details to create a new newsletter'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Newsletter Name"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Subject *</label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Email Subject Line"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">HTML Content</label>
                            <Textarea
                                value={formData.content.html}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        content: { ...formData.content, html: e.target.value },
                                    })
                                }
                                placeholder="HTML content for the newsletter"
                                className="mt-1 min-h-[200px] font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Plain Text Content</label>
                            <Textarea
                                value={formData.content.plain}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        content: { ...formData.content, plain: e.target.value },
                                    })
                                }
                                placeholder="Plain text content for the newsletter"
                                className="mt-1 min-h-[150px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">From Name</label>
                                <Input
                                    value={formData.from_name}
                                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                                    placeholder="Sender Name"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">From Email</label>
                                <Input
                                    type="email"
                                    value={formData.from_email}
                                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                                    placeholder="sender@example.com"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Reply To</label>
                            <Input
                                type="email"
                                value={formData.reply_to}
                                onChange={(e) => setFormData({ ...formData, reply_to: e.target.value })}
                                placeholder="reply@example.com"
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateDialogOpen(false);
                                setIsEditDialogOpen(false);
                                setEditingCampaign(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Subscriber Management Dialog */}
            <Dialog open={isSubscriberDialogOpen} onOpenChange={setIsSubscriberDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Subscribers</DialogTitle>
                        <DialogDescription>
                            Add or remove subscribers from the newsletter list
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                variant={subscriberAction === 'add' ? 'default' : 'outline'}
                                onClick={() => setSubscriberAction('add')}
                                className="flex-1"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Subscriber
                            </Button>
                            <Button
                                variant={subscriberAction === 'remove' ? 'default' : 'outline'}
                                onClick={() => setSubscriberAction('remove')}
                                className="flex-1"
                            >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Remove Subscriber
                            </Button>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                                type="email"
                                value={subscriberEmail}
                                onChange={(e) => setSubscriberEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubscriberDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubscriberAction} disabled={subscriberLoading}>
                            {subscriberLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : subscriberAction === 'add' ? (
                                'Add Subscriber'
                            ) : (
                                'Remove Subscriber'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


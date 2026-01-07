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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
    listCampaigns,
    getCampaign,
    createCampaign,
    createCampaignWithAttachments,
    updateCampaign,
    sendCampaign,
    addSubscriber,
    removeSubscriber,
    listSubscribers,
    type Campaign,
    type Subscriber,
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
    Users,
    CheckSquare,
    Square,
    Paperclip,
    X,
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

// Default email settings
const DEFAULT_FROM_EMAIL = 'dandtotalreturns@gmail.com';
const DEFAULT_FROM_NAME = 'Dividends and Total Returns';
const DEFAULT_REPLY_TO = 'dandtotalreturns@gmail.com';

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
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);
    const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set());
    const [showSendConfirm, setShowSendConfirm] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [campaignToSend, setCampaignToSend] = useState<string | null>(null);

    // Form state - simplified to single email content
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        emailContent: '', // Single content field
    });
    const [attachments, setAttachments] = useState<File[]>([]);

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

    const loadSubscribers = async () => {
        setLoadingSubscribers(true);
        try {
            const result = await listSubscribers(1000, 0);
            if (result.success && result.subscribers) {
                // Only show active subscribers
                const activeSubscribers = result.subscribers.filter(
                    (s) => s.status === 'active' || s.status === 'subscribed'
                );
                setSubscribers(activeSubscribers);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to load subscribers',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to load subscribers: ${(error as Error).message}`,
            });
        } finally {
            setLoadingSubscribers(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
        // Lazy load subscribers - only load when user interacts with subscriber selection
        // This prevents blocking the initial render
    }, []);

    const handleCreate = () => {
        setFormData({
            name: '',
            subject: '',
            emailContent: '',
        });
        setAttachments([]);
        setIsCreateDialogOpen(true);
    };

    const handleEdit = async (campaign: Campaign) => {
        if (!campaign.id) return;
        
        try {
            const result = await getCampaign(campaign.id);
            if (result.success && result.campaign) {
                setEditingCampaign(result.campaign);
                // Extract content from html or plain
                const content = result.campaign.content?.html || result.campaign.content?.plain || '';
                setFormData({
                    name: result.campaign.name,
                    subject: result.campaign.subject,
                    emailContent: content,
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
        if (!formData.name || !formData.subject || !formData.emailContent) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Name, subject, and email content are required',
            });
            return;
        }

        setSaving(true);
        try {
            // Convert single emailContent to both html and plain for MailerLite
            const campaignData = {
                name: formData.name,
                subject: formData.subject,
                type: 'regular' as const,
                content: {
                    html: formData.emailContent,
                    plain: formData.emailContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
                },
                from_name: DEFAULT_FROM_NAME,
                from_email: DEFAULT_FROM_EMAIL,
                reply_to: DEFAULT_REPLY_TO,
            };

            let result;
            if (editingCampaign?.id) {
                result = await updateCampaign(editingCampaign.id, campaignData);
            } else {
                // If there are attachments, upload them with the campaign
                if (attachments.length > 0) {
                    result = await createCampaignWithAttachments(campaignData, attachments);
                } else {
                    result = await createCampaign(campaignData);
                }
            }

            if (result.success) {
                toast({
                    title: 'Success',
                    description: editingCampaign ? 'Campaign updated successfully' : 'Campaign created successfully',
                });
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingCampaign(null);
                setAttachments([]);
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

    const handleSendClick = (campaignId: string) => {
        setCampaignToSend(campaignId);
        setShowSendConfirm(true);
    };

    const handleSend = async () => {
        if (!campaignToSend) return;
        
        setShowSendConfirm(false);
        try {
            const result = await sendCampaign(campaignToSend);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Newsletter sent successfully to all subscribers',
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
            setCampaignToSend(null);
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
                await loadSubscribers();
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

    const handleOpenSubscriberDialog = async () => {
        setIsSubscriberDialogOpen(true);
        await loadSubscribers();
    };

    const toggleSelectAll = () => {
        if (selectedSubscribers.size === subscribers.length) {
            setSelectedSubscribers(new Set());
        } else {
            setSelectedSubscribers(new Set(subscribers.map(s => s.email)));
        }
    };

    const toggleSubscriber = (email: string) => {
        const newSelected = new Set(selectedSubscribers);
        if (newSelected.has(email)) {
            newSelected.delete(email);
        } else {
            newSelected.add(email);
        }
        setSelectedSubscribers(newSelected);
    };

    const handleBulkRemoveClick = () => {
        if (selectedSubscribers.size === 0) {
            toast({
                variant: 'destructive',
                title: 'No Selection',
                description: 'Please select at least one subscriber to remove',
            });
            return;
        }
        setShowRemoveConfirm(true);
    };

    const handleBulkRemove = async () => {
        if (selectedSubscribers.size === 0) {
            setShowRemoveConfirm(false);
            return;
        }
        
        setShowRemoveConfirm(false);
        setSubscriberLoading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const email of selectedSubscribers) {
                try {
                    const result = await removeSubscriber(email);
                    if (result.success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    console.error(`Error removing subscriber ${email}:`, error);
                    failCount++;
                }
            }
        } catch (error) {
            console.error('Error in bulk remove:', error);
            failCount = selectedSubscribers.size;
        } finally {
            setSubscriberLoading(false);
            const removedCount = selectedSubscribers.size;
            setSelectedSubscribers(new Set());
            await loadSubscribers();

            toast({
                title: successCount > 0 ? 'Success' : 'Error',
                description: `Removed ${successCount} subscriber(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
                variant: failCount > 0 && successCount === 0 ? 'destructive' : 'default',
            });
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Newsletter Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create, edit, and send newsletters to your subscribers
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:gap-2">
                    <Button onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Newsletter
                    </Button>
                    <Button variant="outline" onClick={loadCampaigns} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {/* Manage Subscribers button - inline on desktop */}
                    <div className="hidden md:block">
                        <Button
                            variant="outline"
                            onClick={handleOpenSubscriberDialog}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Manage Subscribers ({subscribers.length})
                        </Button>
                    </div>
                </div>
            </div>
            {/* Manage Subscribers button - on its own row, only on mobile */}
            <div className="md:hidden">
                <Button
                    variant="outline"
                    onClick={handleOpenSubscriberDialog}
                    className="w-full"
                >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Subscribers ({subscribers.length})
                </Button>
            </div>

            {loading ? (
                <Card className="p-12 border-2 border-slate-200">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </Card>
            ) : campaigns.length === 0 ? (
                <Card className="p-12 border-2 border-slate-200">
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
                        <Card key={campaign.id} className="p-6 border-2 border-slate-200">
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
                                                    onClick={() => campaign.id && handleSendClick(campaign.id)}
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                                className="mt-1 border-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Subject *</label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Email Subject Line"
                                className="mt-1 border-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email Content *</label>
                            <Textarea
                                value={formData.emailContent}
                                onChange={(e) => setFormData({ ...formData, emailContent: e.target.value })}
                                placeholder="Enter the email content. You can use HTML formatting."
                                className="mt-1 min-h-[300px] font-mono text-sm border-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                You can use HTML tags for formatting (e.g., &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;)
                            </p>
                        </div>
                        
                        {/* Attachments Section */}
                        <div>
                            <label className="text-sm font-medium">Attachments (Optional)</label>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id="attachment-input"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setAttachments((prev) => [...prev, ...files]);
                                            // Reset input
                                            e.target.value = '';
                                        }}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById('attachment-input')?.click()}
                                        className="border-2"
                                    >
                                        <Paperclip className="w-4 h-4 mr-2" />
                                        Add Attachment
                                    </Button>
                                </div>
                                {attachments.length > 0 && (
                                    <div className="space-y-1 border rounded-lg p-2 bg-slate-50">
                                        {attachments.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-white rounded border"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm truncate" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                                        ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setAttachments((prev) => prev.filter((_, i) => i !== index));
                                                    }}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (Max 10MB per file)
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-muted-foreground">
                                <strong>From:</strong> {DEFAULT_FROM_NAME} &lt;{DEFAULT_FROM_EMAIL}&gt;
                                <br />
                                <strong>Reply To:</strong> {DEFAULT_REPLY_TO}
                            </p>
                        </div>
                        
                        {/* Subscriber Selection */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Select Subscribers</label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        // Lazy load subscribers if not already loaded
                                        if (subscribers.length === 0 && !loadingSubscribers) {
                                            await loadSubscribers();
                                            return; // Return early, will re-render with subscribers
                                        }
                                        // Wait if currently loading
                                        if (loadingSubscribers) {
                                            return;
                                        }
                                        // Toggle selection
                                        if (selectedSubscribers.size === subscribers.length && subscribers.length > 0) {
                                            setSelectedSubscribers(new Set());
                                        } else {
                                            setSelectedSubscribers(new Set(subscribers.map(s => s.email)));
                                        }
                                    }}
                                    disabled={loadingSubscribers}
                                >
                                    {loadingSubscribers ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : selectedSubscribers.size === subscribers.length && subscribers.length > 0 ? (
                                        <>
                                            <CheckSquare className="w-4 h-4 mr-2" />
                                            Deselect All
                                        </>
                                    ) : (
                                        <>
                                            <Square className="w-4 h-4 mr-2" />
                                            Select All ({subscribers.length || 0})
                                        </>
                                    )}
                                </Button>
                            </div>
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
                            className="border-2"
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Subscribers</DialogTitle>
                        <DialogDescription>
                            View, add, and remove newsletter subscribers
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Add/Remove Single Subscriber */}
                        <div className="border-b pb-4">
                            <h3 className="text-sm font-semibold mb-3">Add or Remove Subscriber</h3>
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
                            <div className="mt-3 flex gap-2">
                                <Input
                                    type="email"
                                    value={subscriberEmail}
                                    onChange={(e) => setSubscriberEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="flex-1 border-2"
                                />
                                <Button onClick={handleSubscriberAction} disabled={subscriberLoading}>
                                    {subscriberLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : subscriberAction === 'add' ? (
                                        'Add'
                                    ) : (
                                        'Remove'
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Subscriber List */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold">
                                    All Subscribers ({subscribers.length})
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleSelectAll}
                                        disabled={loadingSubscribers || subscribers.length === 0}
                                    >
                                        {selectedSubscribers.size === subscribers.length && subscribers.length > 0 ? (
                                            <>
                                                <CheckSquare className="w-4 h-4 mr-2" />
                                                Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <Square className="w-4 h-4 mr-2" />
                                                Select All
                                            </>
                                        )}
                                    </Button>
                                    {selectedSubscribers.size > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleBulkRemoveClick}
                                            disabled={subscriberLoading}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remove Selected ({selectedSubscribers.size})
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadSubscribers}
                                        disabled={loadingSubscribers}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loadingSubscribers ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                            {loadingSubscribers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : subscribers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No subscribers found</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg border-slate-200 max-h-96 overflow-y-auto">
                                    <div className="divide-y divide-slate-200">
                                        {subscribers.map((subscriber) => (
                                            <div
                                                key={subscriber.id}
                                                className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
                                                onClick={() => toggleSubscriber(subscriber.email)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubscribers.has(subscriber.email)}
                                                    onChange={() => toggleSubscriber(subscriber.email)}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{subscriber.email}</p>
                                                    {subscriber.subscribed_at && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Subscribed: {formatDate(subscriber.subscribed_at)}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    subscriber.status === 'active' || subscriber.status === 'subscribed'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {subscriber.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubscriberDialogOpen(false)} className="border-2">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Campaign Confirmation Dialog */}
            <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Send Newsletter</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to send this newsletter to all subscribers? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSend}>Send Newsletter</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Subscribers Confirmation Dialog */}
            <AlertDialog open={showRemoveConfirm} onOpenChange={(open) => {
                setShowRemoveConfirm(open);
                if (!open) {
                    // Reset state when dialog is closed
                }
            }}>
                <AlertDialogContent className="z-[101]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Remove Subscribers</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {selectedSubscribers.size} subscriber(s)? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            onClick={() => setShowRemoveConfirm(false)}
                            disabled={subscriberLoading}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleBulkRemove} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={subscriberLoading}
                        >
                            {subscriberLoading ? 'Removing...' : 'Remove Subscribers'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

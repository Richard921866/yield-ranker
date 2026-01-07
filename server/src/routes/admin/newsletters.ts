/**
 * Admin Newsletter Routes
 * 
 * Handles newsletter/campaign management for admins
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getSupabase } from '../../services/database.js';
import { logger } from '../../utils/index.js';
import {
    createCampaign,
    updateCampaign,
    sendCampaign,
    getCampaign,
    listCampaigns,
    addSubscriber,
    removeSubscriber,
    listSubscribers,
    type Campaign,
} from '../../services/mailerlite.js';

const router: Router = Router();

// ============================================================================
// File Upload Configuration for Attachments
// ============================================================================

const attachmentStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const attachmentsDir = path.join(process.cwd(), 'temp', 'newsletter-attachments');
        if (!fs.existsSync(attachmentsDir)) {
            fs.mkdirSync(attachmentsDir, { recursive: true });
        }
        cb(null, attachmentsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `attachment-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const attachmentUpload = multer({
    storage: attachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, PNG, and GIF files are allowed'));
        }
    },
});

function cleanupAttachment(filePath: string | null): void {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            logger.warn('Newsletter Upload', `Failed to cleanup attachment: ${filePath}`);
        }
    }
}

// ============================================================================
// Types
// ============================================================================

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
    profile?: {
        role: string;
    };
}

// ============================================================================
// Middleware
// ============================================================================

async function verifyToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token provided',
            });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = getSupabase();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('Auth', `Token verification error: ${(error as Error).message}`);
        res.status(401).json({
            success: false,
            message: 'Token verification failed',
        });
    }
}

async function requireAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }

        const supabase = getSupabase();
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            logger.error('Admin', `Failed to fetch user profile: ${error?.message || 'Not found'}`);
            res.status(403).json({
                success: false,
                message: 'Failed to verify admin status',
            });
            return;
        }

        if (profile.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
            return;
        }

        req.profile = profile;
        next();
    } catch (error) {
        logger.error('Admin', `Admin check error: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /admin/newsletters - List all campaigns/newsletters
 */
router.get('/', verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await listCampaigns(limit, offset);

        if (result.success) {
            res.json({
                success: true,
                campaigns: result.campaigns || [],
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message || 'Failed to list campaigns',
            });
        }
    } catch (error) {
        logger.error('Admin Newsletters', `Error listing campaigns: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * POST /admin/newsletters - Create a new campaign/newsletter
 * Supports both JSON (no attachments) and multipart/form-data (with attachments)
 */
router.post('/', verifyToken, requireAdmin, attachmentUpload.array('attachments', 5), async (req: Request, res: Response): Promise<void> => {
    const attachmentFiles: Array<{ path: string; originalName: string }> = [];
    
    try {
        let campaignData: Omit<Campaign, 'id' | 'status' | 'created_at' | 'updated_at' | 'sent_at'>;
        
        // Check if request has files (multipart/form-data) or JSON body
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            // Handle multipart/form-data with attachments
            const files = req.files as Express.Multer.File[];
            const campaignJson = req.body.campaign;
            
            if (!campaignJson) {
                // Cleanup uploaded files
                files.forEach(file => cleanupAttachment(file.path));
                res.status(400).json({
                    success: false,
                    message: 'Campaign data is required',
                });
                return;
            }

            try {
                campaignData = JSON.parse(campaignJson);
            } catch (parseError) {
                // Cleanup uploaded files
                files.forEach(file => cleanupAttachment(file.path));
                res.status(400).json({
                    success: false,
                    message: 'Invalid campaign data format',
                });
                return;
            }

            // Store attachment file info
            files.forEach(file => {
                attachmentFiles.push({
                    path: file.path,
                    originalName: file.originalname,
                });
            });
        } else {
            // Handle JSON body (no attachments)
            const { name, subject, type, content, from_name, from_email, reply_to } = req.body;
            campaignData = {
                name,
                subject,
                type: type || 'regular',
                content: content || {},
                from_name,
                from_email,
                reply_to,
            };
        }

        if (!campaignData.name || !campaignData.subject) {
            // Cleanup uploaded files
            attachmentFiles.forEach(att => cleanupAttachment(att.path));
            res.status(400).json({
                success: false,
                message: 'Name and subject are required',
            });
            return;
        }

        const result = await createCampaign(campaignData);

        if (result.success && result.campaign) {
            // Note: Attachments are stored on disk. In a production system, you might want to:
            // 1. Store attachment metadata in a database linked to the campaign
            // 2. Upload to cloud storage (S3, etc.)
            // 3. Attach files when sending via MailerLite API (if supported)
            
            // For now, we'll store the attachment info in the response
            // In production, you should persist this in a database
            res.status(201).json({
                success: true,
                campaign: result.campaign,
                message: result.message,
                attachments: attachmentFiles.length > 0 ? attachmentFiles.map(att => ({
                    name: att.originalName,
                    path: att.path, // In production, return a URL or reference ID instead
                })) : undefined,
            });
        } else {
            // Cleanup uploaded files on failure
            attachmentFiles.forEach(att => cleanupAttachment(att.path));
            res.status(500).json({
                success: false,
                message: result.message || 'Failed to create campaign',
            });
        }
    } catch (error) {
        // Cleanup uploaded files on error
        attachmentFiles.forEach(att => cleanupAttachment(att.path));
        logger.error('Admin Newsletters', `Error creating campaign: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * POST /admin/newsletters/subscribers - Add a subscriber (admin only)
 */
router.post('/subscribers', verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Email is required',
            });
            return;
        }

        const result = await addSubscriber(email.trim());

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                subscriberId: result.subscriberId,
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message,
            });
        }
    } catch (error) {
        logger.error('Admin Newsletters', `Error adding subscriber: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * GET /admin/newsletters/subscribers - List all subscribers (admin only)
 */
router.get('/subscribers', verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 1000;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await listSubscribers(limit, offset);

        if (result.success) {
            res.json({
                success: true,
                subscribers: result.subscribers || [],
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message || 'Failed to list subscribers',
            });
        }
    } catch (error) {
        logger.error('Admin Newsletters', `Error listing subscribers: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * DELETE /admin/newsletters/subscribers/:email - Remove a subscriber (admin only)
 */
router.delete('/subscribers/:email', verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.params;

        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email is required',
            });
            return;
        }

        const result = await removeSubscriber(decodeURIComponent(email));

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message,
            });
        }
    } catch (error) {
        logger.error('Admin Newsletters', `Error removing subscriber: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * GET /admin/newsletters/:id - Get a single campaign
 */
router.get('/:id', verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await getCampaign(id);

        if (result.success && result.campaign) {
            res.json({
                success: true,
                campaign: result.campaign,
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message || 'Campaign not found',
            });
        }
    } catch (error) {
        logger.error('Admin Newsletters', `Error getting campaign: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * PUT /admin/newsletters/:id - Update an existing campaign
 */
router.put('/:id', verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, subject, type, content, from_name, from_email, reply_to } = req.body;

        const updates: Partial<Campaign> = {};
        if (name !== undefined) updates.name = name;
        if (subject !== undefined) updates.subject = subject;
        if (type !== undefined) updates.type = type;
        if (content !== undefined) updates.content = content;
        if (from_name !== undefined) updates.from_name = from_name;
        if (from_email !== undefined) updates.from_email = from_email;
        if (reply_to !== undefined) updates.reply_to = reply_to;

        const result = await updateCampaign(id, updates);

        if (result.success && result.campaign) {
            res.json({
                success: true,
                campaign: result.campaign,
                message: result.message,
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message || 'Failed to update campaign',
            });
        }
    } catch (error) {
        logger.error('Admin Newsletters', `Error updating campaign: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * POST /admin/newsletters/:id/send - Send a campaign
 */
router.post('/:id/send', verifyToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await sendCampaign(id);

        if (result.success && result.campaign) {
            res.json({
                success: true,
                campaign: result.campaign,
                message: result.message || 'Campaign sent successfully',
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message || 'Failed to send campaign',
            });
        }
    } catch (error) {
        logger.error('Admin Newsletters', `Error sending campaign: ${(error as Error).message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

export default router;


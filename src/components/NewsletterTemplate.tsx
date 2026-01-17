/**
 * Newsletter Template Component
 *
 * Professional corporate template for displaying newsletter content
 * with header branding, responsive layout, and attachment support
 */

import { Calendar, Download, FileText, Image, FileSpreadsheet, File } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Attachment {
    name: string;
    url: string;
    type: string;
    size?: number;
}

interface NewsletterTemplateProps {
    title: string;
    subject?: string;
    date?: string;
    content: string;
    attachments?: Attachment[];
}

// Get icon for file type
const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return FileText;
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('gif')) return Image;
    if (lowerType.includes('spreadsheet') || lowerType.includes('excel') || lowerType.includes('xlsx') || lowerType.includes('xls') || lowerType.includes('csv')) return FileSpreadsheet;
    return File;
};

// Format file size
const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Format date for display
const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return null;
    }
};

export const NewsletterTemplate = ({
    title,
    subject,
    date,
    content,
    attachments = [],
}: NewsletterTemplateProps) => {
    const formattedDate = formatDate(date);

    return (
        <div className="newsletter-template bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-lg">
            {/* Professional Header Banner */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 sm:px-8 md:px-12 py-8 sm:py-10">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="relative">
                    {/* Brand Logo/Name */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm tracking-wide">
                                Dividends & Total Returns
                            </h3>
                            <p className="text-slate-400 text-xs">Investment Newsletter</p>
                        </div>
                    </div>

                    {/* Newsletter Title */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                        {title}
                    </h1>

                    {/* Subject line */}
                    {subject && (
                        <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-4">
                            {subject}
                        </p>
                    )}

                    {/* Date */}
                    {formattedDate && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Newsletter Content */}
            <div className="px-6 sm:px-8 md:px-12 py-8 sm:py-10">
                <div
                    className="prose prose-sm sm:prose-base md:prose-lg max-w-none
                        prose-headings:font-bold prose-headings:text-slate-900
                        prose-headings:break-words prose-p:break-words prose-p:leading-relaxed
                        prose-p:text-slate-700
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-all
                        prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:shadow-md
                        prose-table:w-full prose-table:overflow-x-auto prose-table:border-collapse
                        prose-strong:font-semibold prose-strong:text-slate-900
                        prose-ul:list-disc prose-ol:list-decimal
                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:px-4 prose-blockquote:py-2
                        [&_table]:block [&_table]:overflow-x-auto [&_table]:whitespace-nowrap
                        [&_p]:mb-4 [&_h1]:mb-4 [&_h1]:mt-8 [&_h2]:mb-3 [&_h2]:mt-6 [&_h3]:mb-3 [&_h3]:mt-5 [&_ul]:mb-4 [&_ol]:mb-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
                <div className="border-t-2 border-slate-100 px-6 sm:px-8 md:px-12 py-6 bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                        Attachments ({attachments.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {attachments.map((attachment, index) => {
                            const FileIcon = getFileIcon(attachment.type);
                            return (
                                <a
                                    key={index}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-primary/50 hover:shadow-sm transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <FileIcon className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {attachment.name}
                                        </p>
                                        {attachment.size && (
                                            <p className="text-xs text-slate-500">
                                                {formatFileSize(attachment.size)}
                                            </p>
                                        )}
                                    </div>
                                    <Download className="w-4 h-4 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors" />
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Professional Footer */}
            <div className="border-t-2 border-slate-100 px-6 sm:px-8 md:px-12 py-6 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div>
                        <p className="text-sm text-slate-600 font-medium">
                            Dividends & Total Returns LLC
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Investment insights delivered to your inbox
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
                        <span className="text-slate-300">|</span>
                        <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
                        <span className="text-slate-300">|</span>
                        <a href="/do-not-sell" className="hover:text-primary transition-colors">Do Not Sell</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple version without wrapper for embedding in existing layouts
export const NewsletterContent = ({
    content,
    attachments = [],
}: {
    content: string;
    attachments?: Attachment[];
}) => {
    return (
        <>
            <div
                className="prose prose-sm sm:prose-base md:prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-slate-900
                    prose-headings:break-words prose-p:break-words prose-p:leading-relaxed
                    prose-p:text-slate-700
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-all
                    prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:shadow-md
                    prose-table:w-full prose-table:overflow-x-auto prose-table:border-collapse
                    prose-strong:font-semibold prose-strong:text-slate-900
                    prose-ul:list-disc prose-ol:list-decimal
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:px-4 prose-blockquote:py-2
                    [&_table]:block [&_table]:overflow-x-auto [&_table]:whitespace-nowrap
                    [&_p]:mb-4 [&_h1]:mb-4 [&_h1]:mt-8 [&_h2]:mb-3 [&_h2]:mt-6 [&_h3]:mb-3 [&_h3]:mt-5 [&_ul]:mb-4 [&_ol]:mb-4"
                dangerouslySetInnerHTML={{ __html: content }}
            />

            {attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                        Attachments ({attachments.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {attachments.map((attachment, index) => {
                            const FileIcon = getFileIcon(attachment.type);
                            return (
                                <a
                                    key={index}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary/50 hover:shadow-sm transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <FileIcon className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {attachment.name}
                                        </p>
                                        {attachment.size && (
                                            <p className="text-xs text-slate-500">
                                                {formatFileSize(attachment.size)}
                                            </p>
                                        )}
                                    </div>
                                    <Download className="w-4 h-4 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors" />
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default NewsletterTemplate;

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Trash2,
    GripVertical,
    Type,
    Heading1,
    Heading2,
    Heading3,
    Table,
    Calculator,
    MessageSquare,
    ChevronUp,
    ChevronDown,
    MoreVertical,
    Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
export type BlockType = 'text' | 'heading1' | 'heading2' | 'heading3' | 'table' | 'formula' | 'comment';

export type NotebookBlock = {
    id: string;
    type: BlockType;
    content: string;
    metadata?: {
        createdAt: string;
        updatedAt: string;
        author?: string;
        color?: 'yellow' | 'blue' | 'green' | 'red' | 'purple';
        tableData?: {
            headers: string[];
            rows: string[][];
        };
    };
};

export type NotebookData = {
    blocks: NotebookBlock[];
    lastUpdated: string;
    version: number;
};

// Block type config
const BLOCK_TYPES = [
    { type: 'text' as BlockType, label: 'Text', icon: Type },
    { type: 'heading1' as BlockType, label: 'Heading 1', icon: Heading1 },
    { type: 'heading2' as BlockType, label: 'Heading 2', icon: Heading2 },
    { type: 'heading3' as BlockType, label: 'Heading 3', icon: Heading3 },
    { type: 'table' as BlockType, label: 'Table', icon: Table },
    { type: 'formula' as BlockType, label: 'Formula', icon: Calculator },
    { type: 'comment' as BlockType, label: 'Comment/Note', icon: MessageSquare },
];

const COMMENT_COLORS = [
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
    { value: 'green', label: 'Green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    { value: 'red', label: 'Red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
] as const;

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Default empty table data
const createDefaultTableData = () => ({
    headers: ['Column 1', 'Column 2', 'Column 3'],
    rows: [['', '', ''], ['', '', '']],
});

interface NotebookEditorProps {
    initialData?: NotebookData;
    onSave: (data: NotebookData) => Promise<void>;
    saving?: boolean;
    loading?: boolean;
}

export const NotebookEditor: React.FC<NotebookEditorProps> = ({
    initialData,
    onSave,
    saving = false,
    loading = false,
}) => {
    const [blocks, setBlocks] = useState<NotebookBlock[]>(initialData?.blocks || []);
    const [hasChanges, setHasChanges] = useState(false);

    // Update blocks when initialData changes
    useEffect(() => {
        if (initialData?.blocks) {
            setBlocks(initialData.blocks);
            setHasChanges(false);
        }
    }, [initialData]);

    const addBlock = useCallback((type: BlockType, afterBlockId?: string) => {
        const newBlock: NotebookBlock = {
            id: generateId(),
            type,
            content: '',
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                color: type === 'comment' ? 'yellow' : undefined,
                tableData: type === 'table' ? createDefaultTableData() : undefined,
            },
        };

        setBlocks(prev => {
            if (afterBlockId) {
                const index = prev.findIndex(b => b.id === afterBlockId);
                if (index !== -1) {
                    const newBlocks = [...prev];
                    newBlocks.splice(index + 1, 0, newBlock);
                    return newBlocks;
                }
            }
            return [...prev, newBlock];
        });
        setHasChanges(true);
    }, []);

    const updateBlock = useCallback((id: string, updates: Partial<NotebookBlock>) => {
        setBlocks(prev => prev.map(block =>
            block.id === id
                ? {
                    ...block,
                    ...updates,
                    metadata: {
                        ...block.metadata,
                        ...updates.metadata,
                        updatedAt: new Date().toISOString()
                    }
                }
                : block
        ));
        setHasChanges(true);
    }, []);

    const deleteBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(block => block.id !== id));
        setHasChanges(true);
    }, []);

    const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index === -1) return prev;
            if (direction === 'up' && index === 0) return prev;
            if (direction === 'down' && index === prev.length - 1) return prev;

            const newBlocks = [...prev];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
            return newBlocks;
        });
        setHasChanges(true);
    }, []);

    const handleSave = useCallback(async () => {
        const data: NotebookData = {
            blocks,
            lastUpdated: new Date().toISOString(),
            version: (initialData?.version || 0) + 1,
        };
        await onSave(data);
        setHasChanges(false);
    }, [blocks, initialData?.version, onSave]);

    // Keyboard shortcut for save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (!saving && !loading) {
                    handleSave();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, saving, loading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-3 text-muted-foreground">Loading notebook...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground">Add block:</span>
                    {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                        <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => addBlock(type)}
                            className="h-8"
                        >
                            <Icon className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">{label}</span>
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        size="sm"
                    >
                        {saving ? 'Saving...' : 'Save Notebook'}
                    </Button>
                </div>
            </div>

            {/* Blocks */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {blocks.map((block, index) => (
                        <motion.div
                            key={block.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <BlockEditor
                                block={block}
                                onUpdate={(updates) => updateBlock(block.id, updates)}
                                onDelete={() => deleteBlock(block.id)}
                                onMoveUp={() => moveBlock(block.id, 'up')}
                                onMoveDown={() => moveBlock(block.id, 'down')}
                                onAddAfter={(type) => addBlock(type, block.id)}
                                isFirst={index === 0}
                                isLast={index === blocks.length - 1}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty state */}
            {blocks.length === 0 && (
                <Card className="p-8 text-center border-dashed border-2">
                    <div className="text-muted-foreground mb-4">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Your notebook is empty</p>
                        <p className="text-sm">Add blocks using the toolbar above to start documenting.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => addBlock('heading1')}>
                            <Heading1 className="w-4 h-4 mr-1" /> Add Heading
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addBlock('text')}>
                            <Type className="w-4 h-4 mr-1" /> Add Text
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addBlock('table')}>
                            <Table className="w-4 h-4 mr-1" /> Add Table
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

// Individual block editor
interface BlockEditorProps {
    block: NotebookBlock;
    onUpdate: (updates: Partial<NotebookBlock>) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onAddAfter: (type: BlockType) => void;
    isFirst: boolean;
    isLast: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
    block,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onAddAfter,
    isFirst,
    isLast,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const getBlockStyles = () => {
        switch (block.type) {
            case 'heading1':
                return 'text-2xl font-bold';
            case 'heading2':
                return 'text-xl font-semibold';
            case 'heading3':
                return 'text-lg font-medium';
            case 'formula':
                return 'font-mono bg-slate-900 text-green-400 p-4 rounded-lg';
            case 'comment': {
                const colorConfig = COMMENT_COLORS.find(c => c.value === (block.metadata?.color || 'yellow'));
                return `${colorConfig?.bg} ${colorConfig?.border} border-l-4 p-4 rounded-r-lg`;
            }
            default:
                return '';
        }
    };

    const renderContent = () => {
        if (block.type === 'table') {
            return (
                <TableBlock
                    data={block.metadata?.tableData || createDefaultTableData()}
                    onUpdate={(tableData) => onUpdate({ metadata: { ...block.metadata, tableData } })}
                />
            );
        }

        return (
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                className={`min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 ${getBlockStyles()}`}
                onBlur={(e) => onUpdate({ content: e.currentTarget.innerHTML })}
                dangerouslySetInnerHTML={{ __html: block.content || getPlaceholder(block.type) }}
                data-placeholder={getPlaceholder(block.type)}
            />
        );
    };

    return (
        <Card className="group relative border hover:border-primary/30 transition-colors">
            {/* Block controls */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onMoveUp}
                    disabled={isFirst}
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="h-6 w-6 flex items-center justify-center cursor-grab">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onMoveDown}
                    disabled={isLast}
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>

            <div className="p-3">
                {/* Block header */}
                <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            {BLOCK_TYPES.find(t => t.type === block.type)?.label || block.type}
                        </span>
                        {block.type === 'comment' && (
                            <Select
                                value={block.metadata?.color || 'yellow'}
                                onValueChange={(color: typeof COMMENT_COLORS[number]['value']) =>
                                    onUpdate({ metadata: { ...block.metadata, color } })
                                }
                            >
                                <SelectTrigger className="h-6 w-24 text-xs">
                                    <Palette className="w-3 h-3 mr-1" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMMENT_COLORS.map(color => (
                                        <SelectItem key={color.value} value={color.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded ${color.bg} ${color.border} border`} />
                                                {color.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <div className="px-2 py-1 text-xs text-muted-foreground">Add block after</div>
                                {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                                    <DropdownMenuItem key={type} onClick={() => onAddAfter(type)}>
                                        <Icon className="w-4 h-4 mr-2" />
                                        {label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Block content */}
                {renderContent()}
            </div>
        </Card>
    );
};

// Table block component
interface TableBlockProps {
    data: { headers: string[]; rows: string[][] };
    onUpdate: (data: { headers: string[]; rows: string[][] }) => void;
}

const TableBlock: React.FC<TableBlockProps> = ({ data, onUpdate }) => {
    const updateHeader = (index: number, value: string) => {
        const newHeaders = [...data.headers];
        newHeaders[index] = value;
        onUpdate({ ...data, headers: newHeaders });
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = data.rows.map((row, i) =>
            i === rowIndex
                ? row.map((cell, j) => j === colIndex ? value : cell)
                : row
        );
        onUpdate({ ...data, rows: newRows });
    };

    const addRow = () => {
        const newRow = new Array(data.headers.length).fill('');
        onUpdate({ ...data, rows: [...data.rows, newRow] });
    };

    const addColumn = () => {
        const newHeaders = [...data.headers, `Column ${data.headers.length + 1}`];
        const newRows = data.rows.map(row => [...row, '']);
        onUpdate({ headers: newHeaders, rows: newRows });
    };

    const deleteRow = (index: number) => {
        if (data.rows.length <= 1) return;
        const newRows = data.rows.filter((_, i) => i !== index);
        onUpdate({ ...data, rows: newRows });
    };

    const deleteColumn = (index: number) => {
        if (data.headers.length <= 1) return;
        const newHeaders = data.headers.filter((_, i) => i !== index);
        const newRows = data.rows.map(row => row.filter((_, i) => i !== index));
        onUpdate({ headers: newHeaders, rows: newRows });
    };

    return (
        <div className="space-y-2">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-100">
                            {data.headers.map((header, i) => (
                                <th key={i} className="border border-slate-300 px-3 py-2 text-left relative group/header">
                                    <input
                                        type="text"
                                        value={header}
                                        onChange={(e) => updateHeader(i, e.target.value)}
                                        className="w-full bg-transparent font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                                    />
                                    {data.headers.length > 1 && (
                                        <button
                                            onClick={() => deleteColumn(i)}
                                            className="absolute -top-2 right-0 opacity-0 group-hover/header:opacity-100 bg-destructive text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    )}
                                </th>
                            ))}
                            <th className="border border-slate-300 w-10">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={addColumn}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-slate-50' : ''}>
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="border border-slate-300 px-3 py-2">
                                        <input
                                            type="text"
                                            value={cell}
                                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                                            placeholder="..."
                                        />
                                    </td>
                                ))}
                                <td className="border border-slate-300 w-10">
                                    {data.rows.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive"
                                            onClick={() => deleteRow(rowIndex)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
        </div>
    );
};

// Placeholders
const getPlaceholder = (type: BlockType): string => {
    switch (type) {
        case 'heading1':
            return 'Heading 1...';
        case 'heading2':
            return 'Heading 2...';
        case 'heading3':
            return 'Heading 3...';
        case 'text':
            return 'Start typing...';
        case 'formula':
            return '// Enter formula or calculation...';
        case 'comment':
            return 'Add a note or comment...';
        default:
            return 'Start typing...';
    }
};

export default NotebookEditor;

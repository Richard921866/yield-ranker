import React, { useEffect, useState } from 'react';
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
import { ERROR_DIALOG_EVENT } from '@/utils/errorHandler';

interface ErrorDialogData {
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export function GlobalErrorDialog() {
    const [open, setOpen] = useState(false);
    const [dialogData, setDialogData] = useState<ErrorDialogData | null>(null);

    useEffect(() => {
        const handleErrorDialog = (event: Event) => {
            const customEvent = event as CustomEvent<ErrorDialogData>;
            setDialogData(customEvent.detail);
            setOpen(true);
        };

        window.addEventListener(ERROR_DIALOG_EVENT, handleErrorDialog);

        return () => {
            window.removeEventListener(ERROR_DIALOG_EVENT, handleErrorDialog);
        };
    }, []);

    const handleConfirm = () => {
        if (dialogData?.onConfirm) {
            dialogData.onConfirm();
        }
        setOpen(false);
        setDialogData(null);
    };

    const handleCancel = () => {
        if (dialogData?.onCancel) {
            dialogData.onCancel();
        }
        setOpen(false);
        setDialogData(null);
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dialogData?.title || 'Error'}</AlertDialogTitle>
                    <AlertDialogDescription className="whitespace-pre-line">
                        {dialogData?.message || ''}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {dialogData?.onCancel && (
                        <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                    )}
                    <AlertDialogAction onClick={handleConfirm}>
                        {dialogData?.onConfirm ? 'Confirm' : 'OK'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


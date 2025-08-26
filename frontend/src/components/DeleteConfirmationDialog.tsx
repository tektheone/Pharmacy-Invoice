import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { pharmacyDataAPI } from '../services/api';

interface DeleteConfirmationDialogProps {
  open: boolean;
  validationId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmationDialog({
  open,
  validationId,
  onOpenChange
}: DeleteConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!validationId || confirmText !== 'DELETE') {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await pharmacyDataAPI.deleteValidation(validationId);
      onOpenChange(false);
      setConfirmText('');
      // In a real app, you would refresh the validation history here
    } catch (err) {
      setError('Failed to delete validation. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    setError(null);
    onOpenChange(false);
  };

  const isConfirmValid = confirmText === 'DELETE';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>Delete Validation</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will permanently delete the validation record and all associated data including:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Discrepancy analysis results</li>
                <li>Processing history</li>
                <li>Generated reports</li>
                <li>File metadata</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <strong>DELETE</strong> to confirm:
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className={confirmText && !isConfirmValid ? 'border-red-500' : ''}
              disabled={isDeleting}
            />
            {confirmText && !isConfirmValid && (
              <p className="text-sm text-red-600">
                Please type "DELETE" exactly as shown
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Validation Info */}
          {validationId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Validation ID:</p>
              <p className="font-mono text-sm">{validationId}</p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="min-w-24"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
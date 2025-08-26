"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "./utils";
import { buttonVariants } from "./button";

const AlertDialog = (props: any) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
);
AlertDialog.displayName = "AlertDialog";

const AlertDialogTrigger = (props: any) => (
  <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
);
AlertDialogTrigger.displayName = "AlertDialogTrigger";

const AlertDialogPortal = (props: any) => (
  <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
);
AlertDialogPortal.displayName = "AlertDialogPortal";

const AlertDialogOverlay = ({ className, ...props }: any) => (
  <AlertDialogPrimitive.Overlay
    data-slot="alert-dialog-overlay"
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
      className,
    )}
    {...props}
  />
);
AlertDialogOverlay.displayName = "AlertDialogOverlay";

const AlertDialogContent = ({ className, ...props }: any) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      data-slot="alert-dialog-content"
      className={cn(
        "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
);
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = ({ className, ...props }: any) => (
  <div
    data-slot="alert-dialog-header"
    className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({ className, ...props }: any) => (
  <div
    data-slot="alert-dialog-footer"
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = ({ className, ...props }: any) => (
  <AlertDialogPrimitive.Title
    data-slot="alert-dialog-title"
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
);
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = ({ className, ...props }: any) => (
  <AlertDialogPrimitive.Description
    data-slot="alert-dialog-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
);
AlertDialogDescription.displayName = "AlertDialogDescription";

const AlertDialogAction = ({ className, ...props }: any) => (
  <AlertDialogPrimitive.Action
    className={cn(buttonVariants(), className)}
    {...props}
  />
);
AlertDialogAction.displayName = "AlertDialogAction";

const AlertDialogCancel = ({ className, ...props }: any) => (
  <AlertDialogPrimitive.Cancel
    className={cn(buttonVariants({ variant: "outline" }), className)}
    {...props}
  />
);
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};

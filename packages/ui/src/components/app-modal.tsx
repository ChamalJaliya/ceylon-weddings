"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogSize,
} from "./dialog";
import { Icon, type IconComponent } from "./icon";

export type ModalTone = "default" | "warning" | "destructive";

export type AppModalProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconComponent;
  tone?: ModalTone;
  size?: DialogSize;
  children?: React.ReactNode;
  /** Buttons row. Rendered in the bordered modal footer. */
  footer?: React.ReactNode;
  showClose?: boolean;
  className?: string;
  bodyClassName?: string;
  /** Block outside-click dismissal (e.g. unsaved form). Esc and Close still work. */
  preventOutsideClose?: boolean;
};

/**
 * Standard modal for forms and detail views (ported from Kloqra AppModal):
 * icon + title + description header, scrollable body, bordered footer.
 * Use ConfirmDialog / useConfirm for yes/no questions instead.
 */
export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  tone = "default",
  size = "md",
  children,
  footer,
  showClose = true,
  className,
  bodyClassName,
  preventOutsideClose = false,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size={size}
        showClose={showClose}
        className={className}
        onInteractOutside={preventOutsideClose ? (event) => event.preventDefault() : undefined}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <DialogHeader className="flex flex-row items-start gap-3">
          {icon ? (
            <span className={cn("modal__icon", `modal__icon--${tone}`)}>
              <Icon icon={icon} size="sm" lottie={false} />
            </span>
          ) : null}
          <div className="grid min-w-0 gap-1.5">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </div>
        </DialogHeader>
        {children ? <DialogBody className={bodyClassName}>{children}</DialogBody> : null}
        {footer ? <DialogFooter className="modal__footer">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

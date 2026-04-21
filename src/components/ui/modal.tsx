"use client";

import {
  createContext,
  cloneElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { zIndex } from "@/lib/design-tokens";

interface ModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("Modal components must be used within a Modal root.");
  }
  return ctx;
}

export interface ModalRootProps {
  children: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ModalRoot({
  children,
  defaultOpen = false,
  onOpenChange,
}: ModalRootProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  }, [onOpenChange]);

  return (
    <ModalContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </ModalContext.Provider>
  );
}

export interface ModalTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export function ModalTrigger({
  asChild,
  onClick,
  children,
  ...props
}: ModalTriggerProps) {
  const { open } = useModalContext();

  if (asChild && children && typeof children === "object" && "props" in children) {
    const child = children as ReactElement<{ onClick?: React.MouseEventHandler }>;
    return cloneElement(child, {
      onClick: (e: React.MouseEvent<Element, MouseEvent>) => {
        child.props.onClick?.(e as React.MouseEvent<HTMLButtonElement, MouseEvent>);
        open();
        onClick?.(e as React.MouseEvent<HTMLButtonElement, MouseEvent>);
      },
    });
  }

  return (
    <button type="button" onClick={(e) => { open(); onClick?.(e); }} {...props}>
      {children}
    </button>
  );
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  guardrail?: boolean;
  knowledgeBase?: boolean;
}

export function ModalContent({
  className,
  guardrail,
  knowledgeBase,
  onClose,
  children,
  ...props
}: ModalContentProps) {
  const { isOpen, close } = useModalContext();

  const handleClose = useCallback(() => {
    close();
    onClose?.();
  }, [close, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-1400 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        role="presentation"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className={cn(
          `relative z-1401 w-full max-w-lg rounded-lg border border-secondary-200 bg-white ${guardrail || knowledgeBase ? "p-0" : "p-0"} shadow-xl dark:border-secondary-800 dark:bg-secondary-900`,
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalHeader({ className, ...props }: ModalHeaderProps) {
  return (
    <div
      className={cn("mb-4 flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row ",
        className
      )}
      {...props}
    />
  );
}

export interface ModalCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export function ModalClose({
  className,
  children,
  asChild,
  ...props
}: ModalCloseProps) {
  const { close } = useModalContext();

  if (
    asChild &&
    typeof children !== "undefined" &&
    isValidElement(children) &&
    Children.count(children) === 1
  ) {
    const child = children as ReactElement<{ onClick?: React.MouseEventHandler<HTMLButtonElement> }>;
    return cloneElement(child, {
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        child.props?.onClick?.(e);
        close();
      },
    });
  }

  return (
    <button type="button" onClick={close} className={className} {...props}>
      {children ?? "Close"}
    </button>
  );
}

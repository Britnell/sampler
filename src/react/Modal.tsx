import { useRef, type ReactNode, useEffect } from "react";

export const Modal = ({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (isOpen) ref.current.showModal();
    else ref.current.close();

    const callback = () => {
      if (onClose) onClose();
    };
    ref.current.addEventListener("close", callback);
    return () => ref.current?.removeEventListener("close", callback);
  }, [isOpen]);

  return <dialog ref={ref}>{children}</dialog>;
};

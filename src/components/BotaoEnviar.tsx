"use client";

import { useFormStatus } from "react-dom";

export function BotaoEnviar({
  children,
  pendente = "Enviando...",
  className = "btn btn-primario",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendente?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || props.disabled} className={className} {...props}>
      {pending ? pendente : children}
    </button>
  );
}

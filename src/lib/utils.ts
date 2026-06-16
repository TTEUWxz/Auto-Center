import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/** Retorna true se o telefone for celular BR (9 dígitos após DDD). */
export function isCelularBR(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  // Celular: 11 dígitos, terceiro dígito começa com 9
  return digits.length === 11 && digits[2] === "9";
}

/** Gera link wa.me a partir de um número BR. */
export function gerarLinkWhatsApp(phone: string, mensagem?: string): string {
  const digits = phone.replace(/\D/g, "");
  const numero = digits.startsWith("55") ? digits : `55${digits}`;
  const url = `https://wa.me/${numero}`;
  if (mensagem) return `${url}?text=${encodeURIComponent(mensagem)}`;
  return url;
}

export function formatPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

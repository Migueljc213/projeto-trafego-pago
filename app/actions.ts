"use server";

import { prisma } from "@/lib/prisma";

export type WaitlistFormState = {
  success: boolean;
  message: string;
  errors?: {
    email?: string[];
    website?: string[];
  };
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

export async function submitWaitlist(
  prevState: WaitlistFormState,
  formData: FormData
): Promise<WaitlistFormState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const website = formData.get("website")?.toString().trim() ?? "";

  const errors: WaitlistFormState["errors"] = {};

  if (!email) {
    errors.email = ["E-mail obrigatório."];
  } else if (!isValidEmail(email)) {
    errors.email = ["Insira um endereço de e-mail válido."];
  }

  if (!website) {
    errors.website = ["URL do site obrigatória."];
  } else if (!isValidUrl(website)) {
    errors.website = ["Insira uma URL de site válida."];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Por favor, corrija os erros abaixo.", errors };
  }

  const utmSource   = formData.get("utm_source")?.toString().trim() || null;
  const utmMedium   = formData.get("utm_medium")?.toString().trim() || null;
  const utmCampaign = formData.get("utm_campaign")?.toString().trim() || null;
  const utmContent  = formData.get("utm_content")?.toString().trim() || null;
  const utmTerm     = formData.get("utm_term")?.toString().trim() || null;
  const referrer    = formData.get("referrer")?.toString().trim() || null;

  try {
    await prisma.waitlistEntry.upsert({
      where: { email },
      update: { website, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer },
      create: { email, website, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer },
    });
  } catch (err) {
    console.error("[Waitlist] DB error:", err);
  }

  return {
    success: true,
    message:
      "Você está na lista! Entraremos em contato em até 48 horas para agendar seu White Glove onboarding.",
  };
}

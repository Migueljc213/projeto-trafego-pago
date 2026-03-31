"use server";

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

  // In production, save to your database or send to CRM/email service
  // Example: await db.waitlist.create({ data: { email, website } });
  // Example: await sendToMailchimp({ email, website });

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log(`[Waitlist] New signup — Email: ${email} | Website: ${website}`);

  return {
    success: true,
    message:
      "Você está na lista! Entraremos em contato em até 48 horas para agendar seu White Glove onboarding.",
  };
}

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
    errors.email = ["Email is required."];
  } else if (!isValidEmail(email)) {
    errors.email = ["Please enter a valid email address."];
  }

  if (!website) {
    errors.website = ["Website URL is required."];
  } else if (!isValidUrl(website)) {
    errors.website = ["Please enter a valid website URL."];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please fix the errors below.", errors };
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
      "You're on the list! We'll reach out within 48 hours to schedule your White Glove onboarding.",
  };
}

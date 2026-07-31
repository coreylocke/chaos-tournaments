"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { setRegistrationStatus } from "@/services/registrationService";

export async function setRegistrationStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const registrationId = String(formData.get("registration_id") ?? "");
  const status = formData.get("status") === "approved" ? "approved" : "rejected";

  await setRegistrationStatus({ registrationId, status });

  redirect("/admin/registrations");
}

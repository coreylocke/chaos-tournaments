import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Uploads go through the service-role client — the caller (a server
// action) is responsible for validating that the uploader is actually a
// participant in the match before calling this, matching the rest of this
// build's "privileged writes through the service layer" pattern.
export async function uploadMatchEvidence(matchId: string, file: File): Promise<string> {
  const supabase = createServiceRoleClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${matchId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("match-evidence")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;

  const { data } = supabase.storage.from("match-evidence").getPublicUrl(path);
  return data.publicUrl;
}

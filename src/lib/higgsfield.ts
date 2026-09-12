/**
 * Higgsfield client wrapper (Master Build Brief, Section 61).
 *
 * Higgsfield is an AI video/image generation platform (text/image prompt -> short cinematic
 * clip with camera controls, or generated images). Planned use: auto-generated tournament
 * hype clips / highlight recaps and social thumbnail art, triggered from n8n — see
 * docs/wiki/integrations.md. Not required for Phase 1-2; this is a ready-to-fill stub.
 *
 * IMPORTANT: Higgsfield's official API surface moves fast and isn't fully reflected here —
 * confirm the exact endpoint paths and request/response shape against Higgsfield's current
 * API docs before relying on this in production. The request shape below is a reasonable
 * best guess (prompt-in, job-id-out, poll-for-result), matching the common pattern for
 * async generative video APIs, but treat the endpoint constants as placeholders to verify.
 *
 * Server-only: do not import this from client components.
 */

const HIGGSFIELD_BASE_URL =
  process.env.HIGGSFIELD_API_URL?.replace(/\/$/, "") ?? "https://api.higgsfield.ai";

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("higgsfield.ts must only be called from server-side code.");
  }
}

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.HIGGSFIELD_API_KEY ?? ""}`,
  };
}

export type HiggsfieldGenerationJob = {
  success: boolean;
  jobId?: string;
  error?: string;
};

export type HiggsfieldGenerationResult = {
  success: boolean;
  status?: "queued" | "processing" | "completed" | "failed";
  outputUrl?: string;
  error?: string;
};

/**
 * Request a generated video clip (e.g. a tournament hype/recap clip). Returns a job id to
 * poll with getGenerationResult — generation is not synchronous.
 */
export async function requestVideoGeneration(params: {
  prompt: string;
  imageUrl?: string;
  durationSeconds?: number;
}): Promise<HiggsfieldGenerationJob> {
  assertServerOnly();

  // NOTE: verify this endpoint path against current Higgsfield API docs before use.
  const res = await fetch(`${HIGGSFIELD_BASE_URL}/v1/video/generate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt: params.prompt,
      image_url: params.imageUrl,
      duration_seconds: params.durationSeconds ?? 8,
    }),
  });

  if (!res.ok) {
    return {
      success: false,
      error: `Higgsfield video request failed: ${res.status} ${res.statusText}`,
    };
  }

  const data = await res.json();
  return { success: true, jobId: data.job_id ?? data.id };
}

/** Poll for the result of a previously requested generation job. */
export async function getGenerationResult(
  jobId: string
): Promise<HiggsfieldGenerationResult> {
  assertServerOnly();

  const res = await fetch(`${HIGGSFIELD_BASE_URL}/v1/jobs/${jobId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    return {
      success: false,
      error: `Higgsfield job lookup failed: ${res.status} ${res.statusText}`,
    };
  }

  const data = await res.json();
  return { success: true, status: data.status, outputUrl: data.output_url };
}

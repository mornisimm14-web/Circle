/**
 * Wrapper around the local Whisper service (docker-compose.yml's `whisper`
 * service, onerahmet/openai-whisper-asr-webservice running faster-whisper).
 * The audio bytes are posted to this local container only — never to
 * Anthropic or any other external API. Only the resulting transcript text
 * continues into the Capture flow.
 */
import { env } from "@/lib/env";

export async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append("audio_file", new Blob([new Uint8Array(buffer)]), filename);

  // Pinned to English rather than left on auto-detect: the product is
  // English-only for now (see docs/plan.md "UI Language & Hebrew
  // Readiness"), and the small/fast `tiny` model used for local dev can
  // otherwise mis-detect the language on short clips and transliterate
  // English speech into the wrong script entirely. Revisit if/when the
  // product itself goes multi-language.
  const response = await fetch(`${env.WHISPER_SERVICE_URL}/asr?output=text&language=en`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Whisper transcription failed: ${response.status} ${await response.text()}`);
  }

  return (await response.text()).trim();
}

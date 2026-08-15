/**
 * Auth.js route handler — wires the GET/POST handlers from auth.config.ts
 * into the App Router. No logic of its own.
 */
import { handlers } from "@/server/auth/auth.config";

export const { GET, POST } = handlers;

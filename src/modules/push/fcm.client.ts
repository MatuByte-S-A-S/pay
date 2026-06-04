import { readFileSync } from "node:fs";
import { GoogleAuth } from "google-auth-library";
import { env } from "../../config/env.js";

export interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export function getFirebaseServiceAccount(): FirebaseServiceAccount | null {
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const raw = readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8");
      const json = JSON.parse(raw) as FirebaseServiceAccount;
      if (json.project_id && json.client_email && json.private_key) return json;
    } catch {
      return null;
    }
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: env.FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

export function isFcmConfigured(): boolean {
  return getFirebaseServiceAccount() !== null;
}

let authClient: GoogleAuth | null = null;

function getAuth(): GoogleAuth | null {
  const sa = getFirebaseServiceAccount();
  if (!sa) return null;
  if (!authClient) {
    authClient = new GoogleAuth({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
  }
  return authClient;
}

export async function sendFcmToToken(
  token: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
): Promise<void> {
  const sa = getFirebaseServiceAccount();
  const auth = getAuth();
  if (!sa || !auth) return;

  const accessToken = await auth.getAccessToken();
  if (!accessToken) throw new Error("No se pudo obtener token de Firebase");

  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: "HIGH",
          notification: {
            channel_id: "paymatu_payments",
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM ${res.status}: ${text}`);
  }
}

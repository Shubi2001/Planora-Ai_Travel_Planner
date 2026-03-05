import { Resend } from "resend";
import { createLogger } from "@/lib/logger";

const log = createLogger("email");

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}

const FROM = process.env.EMAIL_FROM ?? "AI Travel Planner <noreply@example.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface CollaborationInviteParams {
  to: string;
  inviterName: string;
  tripTitle: string;
  destination: string;
  token: string;
}

export async function sendCollaborationInvite(params: CollaborationInviteParams) {
  const { to, inviterName, tripTitle, destination, token } = params;
  const acceptUrl = `${APP_URL}/invite/${token}`;

  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `${inviterName} invited you to plan "${tripTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 48px;">✈️</span>
                <h1 style="font-size: 24px; font-weight: 700; margin: 8px 0 4px; color: #111827;">AI Travel Planner</h1>
              </div>
              
              <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px;">
                You&apos;ve been invited!
              </h2>
              <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to collaborate on the trip 
                <strong>"${tripTitle}"</strong> to <strong>${destination}</strong>.
              </p>
              
              <a href="${acceptUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; padding: 14px 24px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
                Accept Invitation →
              </a>
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                This invitation expires in 7 days. If you didn't expect this email, you can ignore it.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    log.info({ to, tripTitle }, "Collaboration invite sent");
  } catch (err) {
    log.error({ err, to }, "Failed to send collaboration invite");
    throw err;
  }
}

interface WelcomeEmailParams {
  to: string;
  name: string;
}

export async function sendWelcomeEmail({ to, name }: WelcomeEmailParams) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: "Welcome to AI Travel Planner! 🌍",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, sans-serif; background: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 48px;">✈️</span>
                <h1 style="font-size: 24px; font-weight: 700;">Welcome, ${name}!</h1>
              </div>
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
                You're all set to start planning AI-powered trips. Create your first itinerary in seconds!
              </p>
              <a href="${APP_URL}/trips/new" style="display: block; text-align: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; padding: 14px 24px; font-weight: 600;">
                Plan Your First Trip →
              </a>
            </div>
          </body>
        </html>
      `,
    });
  } catch (err) {
    log.error({ err, to }, "Failed to send welcome email");
  }
}

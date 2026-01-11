/** @format */

import { render } from "@react-email/render";
import { OrganizationInviteEmail } from "@/emails/OrganizationInvite";

interface SendInvitationEmailParams {
  to: string;
  organizationName: string;
  inviterName: string;
  role: "admin" | "editor" | "viewer";
  inviteToken: string;
}

export async function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  role,
  inviteToken,
}: SendInvitationEmailParams) {
  try {
    // Generate the invitation URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/accept?token=${inviteToken}`;

    // Render the email template
    const emailHtml = await render(
      OrganizationInviteEmail({
        organizationName,
        inviterName,
        inviteeEmail: to,
        role,
        inviteUrl,
      })
    );

    // Send email using Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: "EdeaStorm",
          email: "noreply@netgfx.com",
        },
        to: [
          {
            email: to,
            name: to.split("@")[0],
          },
        ],
        subject: `You're invited to join ${organizationName} on EdeaStorm`,
        htmlContent: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Brevo API error: ${error.message || response.statusText}`
      );
    }

    const result = await response.json();
    console.log("✅ Invitation email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending invitation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test function to verify email configuration
export async function testEmailConfiguration() {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not set");
    }

    // Test API key by fetching account info
    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API key validation failed: ${response.statusText}`);
    }

    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
}

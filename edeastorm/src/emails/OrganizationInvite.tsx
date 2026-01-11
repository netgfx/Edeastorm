/** @format */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface OrganizationInviteEmailProps {
  organizationName: string;
  inviterName: string;
  inviteeEmail: string;
  role: "admin" | "editor" | "viewer";
  inviteUrl: string;
}

export const OrganizationInviteEmail = ({
  organizationName = "MyOrganization",
  inviterName = "John Doe",
  inviteeEmail = "user@example.com",
  role = "viewer",
  inviteUrl = "https://example.com/invite/accept?token=abc123",
}: OrganizationInviteEmailProps) => {
  const roleDescriptions = {
    admin: "full access to manage the organization",
    editor: "ability to edit and collaborate on all boards",
    viewer: "ability to view boards and participate in discussions",
  };

  return (
    <Html>
      <Head />
      <Preview>
        Join {organizationName} on EdeaStorm - Collaborative Ideation Platform
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Section style={header}>
            <Heading style={h1}>
              <span style={logo}>💡</span> EdeaStorm
            </Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h2}>
              You're invited to join {organizationName}
            </Heading>

            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{organizationName}</strong> on EdeaStorm, the
              collaborative ideation platform where teams brainstorm, organize
              ideas, and turn concepts into action.
            </Text>

            <Section style={roleBox}>
              <Text style={roleText}>
                <strong>Your Role:</strong>{" "}
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
              <Text style={roleDescription}>
                You'll have {roleDescriptions[role]}.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={paragraph}>
              Or copy and paste this link into your browser:
            </Text>
            <Text style={link}>
              <Link href={inviteUrl} style={linkText}>
                {inviteUrl}
              </Link>
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              This invitation was sent to <strong>{inviteeEmail}</strong>. If
              you weren't expecting this invitation, you can safely ignore this
              email.
            </Text>

            <Text style={footer}>
              Questions? Contact us at{" "}
              <Link href="mailto:support@edeastorm.app" style={linkText}>
                support@edeastorm.app
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              © {new Date().getFullYear()} EdeaStorm. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://edeastorm.vercel.app/" style={footerLink}>
                Visit our website
              </Link>
              {" • "}
              <Link
                href="https://edeastorm.vercel.app/privacy"
                style={footerLink}
              >
                Privacy Policy
              </Link>
              {" • "}
              <Link
                href="https://edeastorm.vercel.app/terms"
                style={footerLink}
              >
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrganizationInviteEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 40px",
  backgroundColor: "#6366f1",
  textAlign: "center" as const,
};

const logo = {
  fontSize: "32px",
  marginRight: "8px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  marginBottom: "16px",
};

const content = {
  padding: "0 40px",
};

const paragraph = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "1.6",
  marginBottom: "16px",
};

const roleBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #e5e7eb",
};

const roleText = {
  color: "#1a1a1a",
  fontSize: "16px",
  margin: "0 0 8px 0",
};

const roleDescription = {
  color: "#525252",
  fontSize: "14px",
  margin: "0",
};

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
};

const link = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "12px",
  fontSize: "14px",
  marginBottom: "24px",
  wordBreak: "break-all" as const,
};

const linkText = {
  color: "#6366f1",
  textDecoration: "none",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#737373",
  fontSize: "14px",
  lineHeight: "1.6",
  marginBottom: "12px",
};

const footerSection = {
  padding: "0 40px",
  marginTop: "32px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#737373",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "4px 0",
};

const footerLink = {
  color: "#6366f1",
  textDecoration: "none",
};

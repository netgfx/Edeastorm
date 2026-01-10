// @ts-nocheck
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        console.log("Attempting sign in for:", credentials.email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });

        if (error || !data.user) {
          console.error(
            "Credentials auth error for",
            credentials.email,
            ":",
            error
          );
          throw new Error(error?.message || "Invalid email or password");
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name:
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0],
          image: data.user.user_metadata?.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        const supabase = supabaseAdmin();

        // Check if user exists in profiles
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email)
          .single();

        if (!existingProfile) {
          // Extract domain from email
          const domain = user.email.split("@")[1];

          // Check if domain is in any organization's allowed_domains
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .contains("allowed_domains", [domain])
            .single();

          // Use the Auth User ID if it's a valid UUID (Supabase Auth), otherwise generate one
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              user.id
            );
          const userId = isUuid ? user.id : crypto.randomUUID();

          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: user.email,
              full_name: user.name || user.email.split("@")[0],
              avatar_url: user.image,
              organization_id: org?.id || null,
              role: "contributor",
            });

          if (insertError) {
            console.error(
              "Error creating profile in signIn callback:",
              insertError
            );
          }
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Still allow sign in, profile creation can be retried
      }
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Fetch additional user data from Supabase
      if (token.email) {
        try {
          const supabase = supabaseAdmin();
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", token.email)
            .single();

          if (userProfile) {
            token.supabaseId = userProfile.id;
            token.role = userProfile.role;
            token.organizationId = userProfile.organization_id;
          } else {
            // Profile not found - this shouldn't happen if signIn callback worked
            console.error("No profile found for email:", token.email);
          }
        } catch (error) {
          console.error("Error fetching user profile in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Use supabaseId if available, fallback to NextAuth id if it looks like a UUID
        const isUuid = (id: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id
          );

        session.user.id = (token.supabaseId ||
          (isUuid(token.id) ? token.id : null)) as string;
        session.user.role = (token.role || "contributor") as string;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

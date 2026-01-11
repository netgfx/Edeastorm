// @ts-nocheck
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

// Configure fetch with timeout for OAuth providers
const fetchWithTimeout = async (
  url: string,
  options: any = {},
  timeout = 10000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

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
      // Increase timeout for token exchange
      token: {
        async request(context) {
          try {
            const response = await fetchWithTimeout(
              context.provider.token?.url!,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams(context.params),
              },
              15000 // 15 second timeout
            );
            return await response.json();
          } catch (error) {
            console.error("Google token exchange error:", error);
            throw error;
          }
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

        // First, check if user exists in Supabase Auth
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        let supabaseUser = authUsers.users.find((u) => u.email === user.email);

        // If user doesn't exist in Supabase Auth, create them
        if (!supabaseUser) {
          console.log("Creating Supabase Auth user for:", user.email);

          const { data: newUser, error: authError } =
            await supabase.auth.admin.createUser({
              email: user.email,
              email_confirm: true, // Auto-confirm since they've authenticated via OAuth
              user_metadata: {
                full_name: user.name || user.email.split("@")[0],
                avatar_url: user.image,
                provider: account?.provider || "unknown",
              },
            });

          if (authError) {
            console.error("Error creating Supabase Auth user:", authError);
            console.error("Auth error details:", {
              message: authError.message,
              status: authError.status,
              code: authError.code,
            });

            // If user already exists, try to find them
            if (
              authError.message?.includes("already") ||
              authError.status === 422
            ) {
              console.log("User might already exist, trying to find them...");
              const { data: existingUsers } =
                await supabase.auth.admin.listUsers();
              supabaseUser = existingUsers.users.find(
                (u) => u.email === user.email
              );

              if (supabaseUser) {
                console.log("Found existing Supabase user:", supabaseUser.id);
              } else {
                console.error("Could not find existing user, failing sign in");
                return false;
              }
            } else {
              return false;
            }
          } else {
            supabaseUser = newUser.user;
            console.log(
              "Created Supabase Auth user with ID:",
              supabaseUser?.id
            );
          }

          supabaseUser = newUser.user;
          console.log("Created Supabase Auth user with ID:", supabaseUser?.id);
        }

        if (!supabaseUser) {
          console.error("Failed to get or create Supabase user");
          return false;
        }

        // Update the NextAuth user ID to match the Supabase user ID
        user.id = supabaseUser.id;

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email)
          .single();

        if (!existingProfile) {
          console.log("Creating basic profile for:", user.email);

          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: supabaseUser.id, // Use the Supabase Auth user ID
              email: user.email,
              full_name: user.name || user.email.split("@")[0],
              avatar_url: user.image,
              role: "contributor",
              // organization_id is left null, will be set during onboarding or invitation acceptance
            });

          if (insertError) {
            console.error(
              "Error creating profile in signIn callback:",
              insertError
            );
            // Don't fail sign in on profile creation error, but log it
            // It might be fixed in the subsequent flow
          } else {
            console.log("Profile created successfully for:", user.email);
          }
        }

        console.log(
          "Sign in successful for:",
          user.email,
          "with Supabase ID:",
          user.id
        );

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Don't fail sign in on errors - allow the user to sign in
        // Profile and other data can be created/fixed later
        return true;
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
        // Always use the Supabase user ID (set in signIn callback)
        session.user.id = (token.supabaseId || token.id) as string;
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
  events: {
    async signIn({ user, account }) {
      console.log("✓ Sign in successful:", {
        email: user.email,
        provider: account?.provider,
      });
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

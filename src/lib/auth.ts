import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import type { Account } from "next-auth";

// Get Azure AD settings from database
const getAzureADSettings = async () => {
  try {
    const settings = await db.settings.findFirst();
    if (!settings?.azureClientId || !settings?.azureClientSecret || !settings?.azureTenantId) {
      throw new Error("Azure AD is not configured");
    }
    return {
      clientId: settings.azureClientId,
      clientSecret: settings.azureClientSecret,
      tenantId: settings.azureTenantId,
    };
  } catch (error) {
    console.error("Failed to get Azure AD settings:", error);
    return null;
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
          } as const,
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        // Log successful login
        await db.auditLog.create({
          data: {
            action: "LOGIN",
            userId: user.id,
            details: {
              method: "credentials",
              email: user.email,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "azure-ad" && profile?.email) {
        const email = profile.email.toLowerCase();
        
        // Check if user exists with this email
        const existingUser = await db.user.findUnique({
          where: { email },
          include: {
            accounts: {
              select: {
                provider: true,
              },
            },
          },
        });

        if (existingUser) {
          // Check if this provider is already linked
          const hasProvider = existingUser.accounts.some(acc => acc.provider === "azure-ad");
          
          if (!hasProvider) {
            // Link the Azure AD account to existing user
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                id_token: account.id_token,
                refresh_token: account.refresh_token,
                scope: account.scope,
                token_type: account.token_type,
                session_state: account.session_state,
              },
            });
          }

          // Update user name if it changed in Azure AD
          if (existingUser.name !== user.name) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { name: user.name },
            });
          }

          // Log successful login
          await db.auditLog.create({
            data: {
              action: "LOGIN",
              userId: existingUser.id,
              details: {
                method: "azure-ad",
                email: existingUser.email,
                timestamp: new Date().toISOString(),
              },
            },
          });

          // Use existing user's data
          user.id = existingUser.id;
          user.role = existingUser.role;
          return true;
        }

        // Create new user if they don't exist
        const newUser = await db.user.create({
          data: {
            name: user.name,
            email: email,
            role: "USER",
          },
        });

        // Log successful login
        await db.auditLog.create({
          data: {
            action: "LOGIN",
            userId: newUser.id,
            details: {
              method: "azure-ad",
              email: newUser.email,
              timestamp: new Date().toISOString(),
            },
          },
        });

        user.id = newUser.id;
        user.role = newUser.role;
      }
      return true;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await db.auditLog.create({
          data: {
            action: "LOGOUT",
            userId: token.id as string,
            details: {
              timestamp: new Date().toISOString(),
            },
          },
        });
      }
    },
  },
};

// Dynamically add Azure AD provider if settings are available
getAzureADSettings().then((settings) => {
  if (settings) {
    authOptions.providers.push(
      AzureADProvider({
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
        tenantId: settings.tenantId,
        authorization: {
          params: {
            scope: "openid profile email User.Read"
          }
        },
        httpOptions: {
          timeout: 10000,
        },
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email || profile.preferred_username,
            role: "USER" as Role,
          };
        },
      })
    );
  }
}); 
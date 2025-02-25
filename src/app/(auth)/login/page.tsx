"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/inventory";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "login">("email");

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      // Move to login step regardless of whether user exists
      setStep("login");
    } catch (error) {
      console.error("Error checking email:", error);
      toast.error("Failed to check email. Please try again.");
      // Still move to login step on error
      setStep("login");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
      } else {
        // Successful login
        toast.success("Login successful");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      await signIn("azure-ad", { 
        callbackUrl: callbackUrl,
        redirect: true
      });
    } catch (error) {
      console.error("Microsoft login error:", error);
      toast.error("Failed to login with Microsoft");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={step === "email" ? checkEmail : handleCredentialsLogin} className="space-y-4">
            {/* Email field - always shown */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={step !== "email"}
              />
            </div>

            {/* Password field - only shown in login step */}
            {step === "login" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Submit button - changes based on step */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading 
                ? (step === "email" ? "Checking..." : "Logging in...") 
                : (step === "email" ? "Continue" : "Login")}
            </Button>

            {/* OR divider and Microsoft login - only in login step */}
            {step === "login" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      OR
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-50 text-black dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white flex items-center justify-center gap-2"
                  onClick={handleMicrosoftLogin}
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Sign in with Microsoft
                </Button>
              </>
            )}

            {/* Use different email link - only in login step */}
            {step === "login" && (
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                }}
              >
                Use a different email
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
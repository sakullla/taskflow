import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export function LoginPage() {
  const { t } = useTranslation(["navigation", "common"]);
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const isRegister = mode === "register";
  const submitLabel = useMemo(
    () => (isRegister ? t("navigation:register") || "Register" : t("navigation:login") || "Login"),
    [isRegister, t]
  );

  const getErrorMessage = (error: unknown) => {
    const fallback = t("common:error.title") || "Request failed";
    if (typeof error !== "object" || error === null) return fallback;
    const maybeResponse = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    return (
      maybeResponse.response?.data?.error?.message ||
      maybeResponse.message ||
      fallback
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? { email, password, name: name.trim() || undefined }
        : { email, password };

      const response = (await api.post<AuthResponse>(endpoint, payload)) as unknown as AuthResponse;
      if (!response.success) {
        throw new Error("Authentication failed");
      }

      setUser(response.data.user);
      setToken(response.data.token);
      toast(
        isRegister
          ? t("navigation:register") || "Register"
          : t("navigation:login") || "Login",
        "success"
      );
      navigate("/", { replace: true });
    } catch (error) {
      toast(getErrorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">TaskFlow</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("common:app.tagline")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? `${submitLabel}...` : submitLabel}
            </Button>
          </form>

          <Button
            variant="link"
            className="w-full mt-2"
            onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
          >
            {isRegister
              ? t("navigation:login") || "Login"
              : t("navigation:register") || "Register"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;

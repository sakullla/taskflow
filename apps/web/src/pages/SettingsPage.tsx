import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Moon, Sun, Globe, User, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTaskStore } from "@/stores/taskStore";

type Theme = "light" | "dark" | "system";
type Language = "en" | "zh-CN";

export function SettingsPage() {
  const { t, i18n } = useTranslation(["navigation", "settings", "common"]);
  const { setCurrentView } = useTaskStore();

  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const currentLanguage = i18n.language as Language;

  useEffect(() => {
    setCurrentView("settings" as never);

    // Load saved theme and apply it
    const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, [setCurrentView]);

  const handleThemeChange = (theme: Theme) => {
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  };

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">{t("navigation:settings")}</h1>
        </div>
        <p className="text-muted-foreground">
          {t("settings:subtitle") || "Manage your preferences and account settings"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              <CardTitle>{t("settings:appearance") || "Appearance"}</CardTitle>
            </div>
            <CardDescription>
              {t("settings:appearanceDesc") || "Customize how the app looks"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {t("settings:theme") || "Theme"}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={currentTheme === "light" ? "default" : "outline"}
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-xs">{t("settings:light") || "Light"}</span>
                </Button>
                <Button
                  variant={currentTheme === "dark" ? "default" : "outline"}
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-xs">{t("settings:dark") || "Dark"}</span>
                </Button>
                <Button
                  variant={currentTheme === "system" ? "default" : "outline"}
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleThemeChange("system")}
                >
                  <div className="flex">
                    <Sun className="h-5 w-5" />
                    <Moon className="h-5 w-5 -ml-1" />
                  </div>
                  <span className="text-xs">{t("settings:system") || "System"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>{t("settings:language") || "Language"}</CardTitle>
            </div>
            <CardDescription>
              {t("settings:languageDesc") || "Choose your preferred language"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={currentLanguage === "en" ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleLanguageChange("en")}
              >
                <span className="mr-2">🇺🇸</span>
                English
              </Button>
              <Button
                variant={currentLanguage === "zh-CN" ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleLanguageChange("zh-CN")}
              >
                <span className="mr-2">🇨🇳</span>
                简体中文
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>{t("settings:notifications") || "Notifications"}</CardTitle>
            </div>
            <CardDescription>
              {t("settings:notificationsDesc") || "Configure notification preferences"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings:dueDateReminders") || "Due date reminders"}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings:dueDateRemindersDesc") || "Get notified when tasks are due"}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings:weeklyDigest") || "Weekly digest"}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings:weeklyDigestDesc") || "Receive a summary of your tasks"}
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{t("settings:account") || "Account"}</CardTitle>
            </div>
            <CardDescription>
              {t("settings:accountDesc") || "Manage your account information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Demo User</p>
                <p className="text-sm text-muted-foreground">demo@example.com</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" disabled>
                {t("settings:editProfile") || "Edit Profile"}
              </Button>
              <Button variant="outline" disabled>
                {t("settings:changePassword") || "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Todo App v2.0.0</p>
              <p className="mt-1">{t("settings:madeWith") || "Made with ❤️ for productivity"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

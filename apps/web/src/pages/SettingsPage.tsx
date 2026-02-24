import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Moon, Sun, Globe, User, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/components/ui/toast";
import type { User as UserType } from "@/types";

type Theme = "light" | "dark" | "system";
type Language = "en" | "zh-CN";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function SettingsPage() {
  const { t, i18n } = useTranslation(["navigation", "settings", "common"]);
  const { setCurrentView } = useTaskStore();
  const { user, setUser } = useAuthStore();

  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const [profileName, setProfileName] = useState("");
  const [dueDateReminders, setDueDateReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const currentLanguage = i18n.language as Language;
  const isAdmin = useMemo(() => user?.role === "admin", [user?.role]);

  useEffect(() => {
    setCurrentView("settings" as never);
    const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
    void loadMe();
  }, [setCurrentView]);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name || "");
    setDueDateReminders(user.dueDateReminders ?? true);
    setWeeklyDigest(user.weeklyDigest ?? false);
  }, [user]);

  useEffect(() => {
    if (isAdmin) void loadUsers();
  }, [isAdmin]);

  const loadMe = async () => {
    try {
      const res = (await api.get<ApiResponse<UserType>>("/users/me")) as unknown as ApiResponse<UserType>;
      if (res.success) setUser(res.data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = (await api.get<ApiResponse<UserType[]>>("/users")) as unknown as ApiResponse<UserType[]>;
      if (res.success) setUsers(res.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast(t("settings:userLoadFailed") || "Failed to load users", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const patchMyProfile = async (payload: Partial<UserType>) => {
    const res = (await api.patch<ApiResponse<UserType>>("/users/me", payload)) as unknown as ApiResponse<UserType>;
    if (res.success) setUser(res.data);
    return res;
  };

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
      return;
    }
    root.classList.toggle("dark", theme === "dark");
  };

  const handleLanguageChange = async (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    try {
      await patchMyProfile({ locale: lang });
    } catch (error) {
      console.error("Failed to sync locale:", error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await patchMyProfile({
        name: profileName.trim(),
        locale: i18n.language,
        theme: currentTheme,
      });
      toast(t("settings:profileUpdated") || "Profile updated", "success");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast(t("settings:profileUpdateError") || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveNotificationSettings = async (next: {
    dueDateReminders: boolean;
    weeklyDigest: boolean;
  }) => {
    setIsSavingNotifications(true);
    try {
      await patchMyProfile(next);
      toast(t("settings:notificationsSaved") || "Notification settings saved", "success");
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      toast(t("settings:notificationsSaveError") || "Failed to save notification settings", "error");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleToggleDueDateReminders = async (checked: boolean) => {
    setDueDateReminders(checked);
    await saveNotificationSettings({ dueDateReminders: checked, weeklyDigest });
  };

  const handleToggleWeeklyDigest = async (checked: boolean) => {
    setWeeklyDigest(checked);
    await saveNotificationSettings({ dueDateReminders, weeklyDigest: checked });
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast(t("settings:passwordRequired") || "Please fill current and new password", "error");
      return;
    }
    if (newPassword.length < 6) {
      toast(t("settings:passwordTooShort") || "New password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast(t("settings:passwordMismatch") || "Passwords do not match", "error");
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.patch("/users/me/password", { currentPassword, newPassword });
      setPasswordDialogOpen(false);
      resetPasswordForm();
      toast(t("settings:passwordChanged") || "Password changed", "success");
    } catch (error) {
      console.error("Failed to change password:", error);
      toast(t("settings:passwordChangeError") || "Failed to change password", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              <CardTitle>{t("settings:appearance") || "Appearance"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>{t("settings:language") || "Language"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={currentLanguage === "en" ? "default" : "outline"}
                className="justify-start"
                onClick={() => void handleLanguageChange("en")}
              >
                English
              </Button>
              <Button
                variant={currentLanguage === "zh-CN" ? "default" : "outline"}
                className="justify-start"
                onClick={() => void handleLanguageChange("zh-CN")}
              >
                简体中文
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <Switch
                checked={dueDateReminders}
                onCheckedChange={(checked) => void handleToggleDueDateReminders(checked)}
                disabled={isSavingNotifications}
                aria-label={t("settings:dueDateReminders") || "Due date reminders"}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings:weeklyDigest") || "Weekly digest"}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings:weeklyDigestDesc") || "Receive a summary of your tasks"}
                </p>
              </div>
              <Switch
                checked={weeklyDigest}
                onCheckedChange={(checked) => void handleToggleWeeklyDigest(checked)}
                disabled={isSavingNotifications}
                aria-label={t("settings:weeklyDigest") || "Weekly digest"}
              />
            </div>
          </CardContent>
        </Card>

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
            <div className="grid gap-3">
              <label className="text-sm font-medium">{t("settings:email") || "Email"}</label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium">{t("settings:name") || "Name"}</label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={t("settings:namePlaceholder") || "Your display name"}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => void handleSaveProfile()} disabled={isSavingProfile}>
                {isSavingProfile ? t("settings:saving") || "Saving..." : t("settings:saveProfile") || "Save Profile"}
              </Button>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                {t("settings:changePassword") || "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>{t("settings:userManagement") || "User Management"}</CardTitle>
              </div>
              <CardDescription>{t("settings:userManagementDesc") || "View all users in current environment."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={() => void loadUsers()} disabled={isLoadingUsers}>
                  {isLoadingUsers ? t("settings:loading") || "Loading..." : t("settings:refresh") || "Refresh"}
                </Button>
              </div>
              <div className="space-y-2">
                {users.map((item) => (
                  <div key={item.id} className="border rounded-md p-3">
                    <p className="font-medium">{item.name || (t("settings:unnamedUser") || "Unnamed user")}</p>
                    <p className="text-sm text-muted-foreground">{item.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(t("settings:role") || "Role")}: {item.role || "user"}
                    </p>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("settings:noUsers") || "No users found."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        isOpen={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          resetPasswordForm();
        }}
        title={t("settings:passwordDialogTitle") || "Change Password"}
        description={t("settings:passwordDialogDesc") || "Update your password to keep your account secure."}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              {t("common:actions.cancel") || "Cancel"}
            </Button>
            <Button onClick={() => void handleChangePassword()} disabled={isSavingPassword}>
              {isSavingPassword ? t("settings:updating") || "Updating..." : t("settings:updatePassword") || "Update Password"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("settings:currentPassword") || "Current password"}
          />
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("settings:newPassword") || "New password"}
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("settings:confirmPassword") || "Confirm new password"}
          />
        </div>
      </Dialog>
    </div>
  );
}

export default SettingsPage;

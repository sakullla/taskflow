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
type Role = "admin" | "user";

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
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("user");

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

  const resetCreateUserForm = () => {
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("user");
  };

  const handleCreateUser = async () => {
    const email = newUserEmail.trim();
    if (!email || !newUserPassword) {
      toast(t("settings:createUserRequired") || "Email and password are required", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast(t("settings:createUserInvalidEmail") || "Please enter a valid email", "error");
      return;
    }

    if (newUserPassword.length < 6) {
      toast(t("settings:createUserPasswordTooShort") || "Password must be at least 6 characters", "error");
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = (await api.post<ApiResponse<UserType>>("/users", {
        name: newUserName.trim() || undefined,
        email,
        password: newUserPassword,
        role: newUserRole,
      })) as unknown as ApiResponse<UserType>;

      if (res.success) {
        setUsers((prev) => [res.data, ...prev]);
        resetCreateUserForm();
        setCreateUserDialogOpen(false);
        toast(t("settings:userCreated") || "User created", "success");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      toast(t("settings:userCreateFailed") || "Failed to create user", "error");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (item: UserType) => {
    setUpdatingUserId(item.id);
    try {
      const res = (await api.patch<ApiResponse<UserType>>(`/users/${item.id}/status`, {
        isActive: !(item.isActive ?? true),
      })) as unknown as ApiResponse<UserType>;

      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === res.data.id ? res.data : u)));
        toast(
          res.data.isActive
            ? t("settings:userEnabled") || "User enabled"
            : t("settings:userDisabled") || "User disabled",
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast(t("settings:userStatusUpdateFailed") || "Failed to update user status", "error");
    } finally {
      setUpdatingUserId(null);
    }
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>{t("settings:userManagement") || "User Management"}</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    {t("settings:userManagementDesc") || "View all users in current environment."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => setCreateUserDialogOpen(true)}
                    data-testid="open-create-user-dialog"
                  >
                    {t("settings:createUser") || "Create User"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void loadUsers()} disabled={isLoadingUsers}>
                    {isLoadingUsers ? t("settings:loading") || "Loading..." : t("settings:refresh") || "Refresh"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((item) => (
                  <div key={item.id} className="border rounded-md p-3" data-testid={`user-row-${item.id}`}>
                    <p className="font-medium">{item.name || (t("settings:unnamedUser") || "Unnamed user")}</p>
                    <p className="text-sm text-muted-foreground">{item.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(t("settings:role") || "Role")}: {item.role || "user"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(t("settings:status") || "Status")}: {(item.isActive ?? true)
                        ? (t("settings:userStatusActive") || "Active")
                        : (t("settings:userStatusDisabled") || "Disabled")}
                    </p>
                    {item.id !== user?.id && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleToggleUserStatus(item)}
                          disabled={updatingUserId === item.id}
                          data-testid={`toggle-user-status-${item.email}`}
                        >
                          {updatingUserId === item.id
                            ? t("settings:updating") || "Updating..."
                            : (item.isActive ?? true)
                              ? t("settings:disableUser") || "Disable User"
                              : t("settings:enableUser") || "Enable User"}
                        </Button>
                      </div>
                    )}
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

      <Dialog
        isOpen={createUserDialogOpen}
        onClose={() => {
          setCreateUserDialogOpen(false);
          resetCreateUserForm();
        }}
        title={t("settings:createUser") || "Create User"}
        description={t("settings:userManagementDesc") || "View all users in current environment."}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCreateUserDialogOpen(false);
                resetCreateUserForm();
              }}
            >
              {t("common:actions.cancel") || "Cancel"}
            </Button>
            <Button onClick={() => void handleCreateUser()} disabled={isCreatingUser} data-testid="create-user-submit">
              {isCreatingUser
                ? t("settings:creatingUser") || "Creating..."
                : t("settings:createUser") || "Create User"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder={t("settings:newUserName") || "User name (optional)"}
            data-testid="create-user-name"
          />
          <Input
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder={t("settings:newUserEmail") || "User email"}
            type="email"
            data-testid="create-user-email"
          />
          <Input
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            placeholder={t("settings:newUserPassword") || "Initial password"}
            type="password"
            data-testid="create-user-password"
          />
          <div className="flex gap-2">
            <Button
              variant={newUserRole === "user" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setNewUserRole("user")}
            >
              {t("settings:userRoleUser") || "User"}
            </Button>
            <Button
              variant={newUserRole === "admin" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setNewUserRole("admin")}
            >
              {t("settings:userRoleAdmin") || "Admin"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SettingsPage;

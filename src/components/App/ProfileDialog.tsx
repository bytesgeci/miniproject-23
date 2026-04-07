"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { FileText, Loader2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];
const ALLOWED_PROFILE_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_CACHE_TTL_MS = 60_000;

interface ProfileFormState {
  name: string;
  username: string;
  department: string;
  email: string;
  phone: string;
  experience: string;
  profileImageUrl: string;
  resumeUrl: string;
  resumeFileName: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_FORM: ProfileFormState = {
  name: "",
  username: "",
  department: "",
  email: "",
  phone: "",
  experience: "",
  profileImageUrl: "",
  resumeUrl: "",
  resumeFileName: "",
};

const EMPTY_PASSWORD_FORM: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

type ProfileApiUser = {
  name?: string;
  username?: string;
  department?: string;
  email?: string;
  phone?: string;
  experience?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
};

const profileDialogCache = new Map<
  string,
  { user: ProfileApiUser; expiresAt: number }
>();

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index < 0) {
    return "";
  }
  return fileName.slice(index).toLowerCase();
}

function deriveResumeFileName(url: string) {
  if (!url) {
    return "";
  }

  const parts = url.split("/").filter(Boolean);
  const encodedName = parts[parts.length - 1] || "";
  const decoded = decodeURIComponent(encodedName);
  const firstUnderscore = decoded.indexOf("_");
  if (firstUnderscore > 0) {
    return decoded.slice(firstUnderscore + 1);
  }
  return decoded;
}

export function ProfileDialog() {
  const auth = useAuth();
  const user = auth.user;
  const updateUserProfile =
    typeof auth.updateUserProfile === "function"
      ? auth.updateUserProfile
      : (patch: Record<string, unknown>) => {
          if (!user) {
            return;
          }

          const nextUser = {
            ...user,
            ...patch,
          };

          if (typeof window !== "undefined") {
            localStorage.setItem("auth_user", JSON.stringify(nextUser));
          }
        };
  const isAdminUser =
    user?.role === "admin" || user?.roles?.includes("admin") === true;
  const [open, setOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(EMPTY_PASSWORD_FORM);
  const [updateMode, setUpdateMode] = useState<"profile" | "password">(
    isAdminUser ? "password" : "profile",
  );
  const profileRequestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setUpdateMode(isAdminUser ? "password" : "profile");
    }
  }, [isAdminUser, open]);

  const applyProfileData = useCallback((dataUser: ProfileApiUser) => {
    setForm({
      name: dataUser.name ?? "",
      username: dataUser.username ?? "",
      department: dataUser.department ?? "",
      email: dataUser.email ?? "",
      phone: dataUser.phone ?? "",
      experience: dataUser.experience ?? "",
      profileImageUrl: dataUser.profileImageUrl ?? "",
      resumeUrl: dataUser.resumeUrl ?? "",
      resumeFileName:
        dataUser.resumeFileName ??
        deriveResumeFileName(dataUser.resumeUrl ?? ""),
    });
  }, []);

  const loadProfile = useCallback(async () => {
    if (!open || !user?.id || isAdminUser) {
      return;
    }

    const cacheKey = String(user.id);
    const cached = profileDialogCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      applyProfileData(cached.user);
      return;
    }

    profileRequestControllerRef.current?.abort();
    const controller = new AbortController();
    profileRequestControllerRef.current = controller;

    setLoadingProfile(true);
    try {
      const startedAt = performance.now();
      const response = await fetch(
        `/api/profile?userId=${encodeURIComponent(user.id)}`,
        {
          signal: controller.signal,
        },
      );
      const data = (await response.json()) as {
        error?: string;
        user?: ProfileApiUser;
      };

      if (!response.ok || !data.user) {
        toast.error(data.error || "Failed to load profile");
        return;
      }

      profileDialogCache.set(cacheKey, {
        user: data.user,
        expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
      });
      applyProfileData(data.user);

      const clientDurationMs =
        Math.round((performance.now() - startedAt) * 100) / 100;
      const serverTiming = response.headers.get("Server-Timing") || "";
      if (clientDurationMs > 900) {
        console.warn("Slow profile load observed in client", {
          clientDurationMs,
          serverTiming,
          responseTimeHeader: response.headers.get("X-Response-Time-Ms"),
          cacheHeader: response.headers.get("X-Profile-Cache"),
        });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      console.error("Profile load error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [applyProfileData, isAdminUser, open, user?.id]);

  useEffect(() => {
    void loadProfile();

    return () => {
      profileRequestControllerRef.current?.abort();
    };
  }, [loadProfile]);

  useEffect(() => {
    if (!user?.id || isAdminUser) {
      return;
    }

    const cacheKey = String(user.id);
    const cached = profileDialogCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return;
    }

    let cancelled = false;

    const prefetchProfile = async () => {
      try {
        const startedAt = performance.now();
        const response = await fetch(
          `/api/profile?userId=${encodeURIComponent(user.id)}`,
        );
        const data = (await response.json()) as {
          user?: ProfileApiUser;
        };

        if (!response.ok || !data.user || cancelled) {
          return;
        }

        profileDialogCache.set(cacheKey, {
          user: data.user,
          expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
        });

        const clientDurationMs =
          Math.round((performance.now() - startedAt) * 100) / 100;
        if (clientDurationMs > 900) {
          console.warn("Slow profile prefetch observed in client", {
            clientDurationMs,
            serverTiming: response.headers.get("Server-Timing"),
            responseTimeHeader: response.headers.get("X-Response-Time-Ms"),
          });
        }
      } catch {
        // Ignore prefetch errors; on-demand load handles UX.
      }
    };

    const browserWindow = typeof window !== "undefined" ? window : null;
    let idleScheduler: number | null = null;
    let timeoutScheduler: ReturnType<typeof setTimeout> | null = null;

    if (browserWindow && "requestIdleCallback" in browserWindow) {
      idleScheduler = browserWindow.requestIdleCallback(() => {
        void prefetchProfile();
      });
    } else {
      timeoutScheduler = globalThis.setTimeout(() => {
        void prefetchProfile();
      }, 300);
    }

    return () => {
      cancelled = true;
      if (timeoutScheduler) {
        globalThis.clearTimeout(timeoutScheduler);
        return;
      }
      if (
        browserWindow &&
        idleScheduler !== null &&
        "cancelIdleCallback" in browserWindow
      ) {
        browserWindow.cancelIdleCallback(idleScheduler);
      }
    };
  }, [isAdminUser, user?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) {
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: form.name.trim(),
          email: normalizedEmail,
          phone: form.phone.trim(),
          experience: form.experience.trim(),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        user?: ProfileApiUser;
      };
      if (!response.ok) {
        toast.error(data.error || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully");
      if (data.user) {
        updateUserProfile({
          name: data.user.name ?? form.name.trim(),
          email: data.user.email ?? normalizedEmail,
        });
      }
      profileDialogCache.delete(String(user.id));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id) {
      return;
    }

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error || "Failed to update password");
        return;
      }

      setPasswordForm(EMPTY_PASSWORD_FORM);
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Failed to update password");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || !user?.id) {
      return;
    }

    const extension = getFileExtension(file.name);
    if (!ALLOWED_RESUME_EXTENSIONS.includes(extension)) {
      toast.error("Only PDF, DOC, or DOCX files are allowed");
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      toast.error("Resume size should be less than 5MB");
      return;
    }

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("resume", file);

      const response = await fetch("/api/profile/resume", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        resumeUrl?: string;
        resumeFileName?: string;
      };

      if (!response.ok || !data.resumeUrl) {
        toast.error(data.error || "Failed to upload resume");
        return;
      }

      setForm((prev) => ({
        ...prev,
        resumeUrl: data.resumeUrl || "",
        resumeFileName: data.resumeFileName || file.name,
      }));
      profileDialogCache.delete(String(user.id));
      toast.success("Resume uploaded successfully");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Resume upload error:", error);
      toast.error("Failed to upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleProfileImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || !user?.id) {
      return;
    }

    const extension = getFileExtension(file.name);
    if (!ALLOWED_PROFILE_IMAGE_EXTENSIONS.includes(extension)) {
      toast.error("Only PNG, JPG, JPEG, WEBP, or GIF files are allowed");
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      toast.error("Profile image size should be less than 3MB");
      return;
    }

    setUploadingProfileImage(true);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("image", file);

      const response = await fetch("/api/profile/image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        profileImageUrl?: string;
      };

      if (!response.ok || !data.profileImageUrl) {
        toast.error(data.error || "Failed to upload profile image");
        return;
      }

      setForm((prev) => ({
        ...prev,
        profileImageUrl: data.profileImageUrl || "",
      }));
      updateUserProfile({ profileImageUrl: data.profileImageUrl || "" });

      profileDialogCache.delete(String(user.id));
      toast.success("Profile image updated successfully");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      toast.error("Failed to upload profile image");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!user?.id}>
          <UserRound className="h-4 w-4 mr-2" />
          Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>
            {isAdminUser
              ? "For admin accounts, only password updates are allowed."
              : updateMode === "password"
                ? "Update your account password."
                : "Edit your contact details, profile picture, experience, and resume."}
          </DialogDescription>
        </DialogHeader>

        {!isAdminUser ? (
          <div className="space-y-2">
            <Label htmlFor="profile-update-mode">Update Option</Label>
            <Select
              value={updateMode}
              onValueChange={(value) =>
                setUpdateMode(value as "profile" | "password")
              }
            >
              <SelectTrigger id="profile-update-mode">
                <SelectValue placeholder="Select what to update" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">Profile Details</SelectItem>
                <SelectItem value="password">Password</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {!isAdminUser && !loadingProfile ? (
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4 rounded-lg border p-3">
              {form.profileImageUrl ? (
                <img
                  src={form.profileImageUrl}
                  alt={`${form.name || form.username || "User"} profile`}
                  className="h-16 w-16 rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-lg font-semibold text-white">
                  {(form.name || form.username || "U")
                    .split(" ")
                    .map((part) => part[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}

              <div>
                <Label
                  htmlFor="profile-image"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {uploadingProfileImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Picture
                    </>
                  )}
                </Label>
                <Input
                  id="profile-image"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.gif"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  disabled={uploadingProfileImage}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Allowed formats: PNG, JPG, JPEG, WEBP, GIF (max 3MB)
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {loadingProfile && !isAdminUser ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : isAdminUser || updateMode === "password" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-current-password">Current Password</Label>
              <Input
                id="profile-current-password"
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-new-password">New Password</Label>
              <Input
                id="profile-new-password"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-confirm-password">
                Confirm New Password
              </Label>
              <Input
                id="profile-confirm-password"
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={form.department} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone Number</Label>
              <Input
                id="profile-phone"
                type="text"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-experience">Experience</Label>
              <Textarea
                id="profile-experience"
                placeholder="e.g., 6 years in machine learning and curriculum design"
                rows={3}
                value={form.experience}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, experience: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Resume</Label>
              <div className="border rounded-lg p-3 space-y-3">
                {form.resumeUrl ? (
                  <a
                    href={form.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    {form.resumeFileName || "View uploaded resume"}
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">
                    No resume uploaded yet.
                  </p>
                )}

                <div>
                  <Label
                    htmlFor="profile-resume"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {uploadingResume ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Resume
                      </>
                    )}
                  </Label>
                  <Input
                    id="profile-resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploadingResume}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Allowed formats: PDF, DOC, DOCX (max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={savingProfile || uploadingResume || uploadingProfileImage}
          >
            Close
          </Button>
          {isAdminUser || updateMode === "password" ? (
            <Button onClick={handleChangePassword} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSaveProfile}
              disabled={
                loadingProfile ||
                savingProfile ||
                uploadingResume ||
                uploadingProfileImage
              }
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

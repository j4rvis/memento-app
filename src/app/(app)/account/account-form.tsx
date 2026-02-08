"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/types";

export function AccountForm({
  user,
  profile,
}: {
  user: User;
  profile: Tables<"profiles"> | null;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const getAvatarUrl = useCallback(
    (path: string) => {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase]
  );

  const [avatarPreview, setAvatarPreview] = useState(
    avatarUrl ? getAvatarUrl(avatarUrl) : ""
  );

  useEffect(() => {
    if (avatarUrl) {
      setAvatarPreview(getAvatarUrl(avatarUrl));
    }
  }, [avatarUrl, getAvatarUrl]);

  async function handleAvatarUpload(): Promise<string | null> {
    if (!avatarFile) return avatarUrl;

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (error) {
      setMessage("Error uploading avatar: " + error.message);
      return null;
    }

    return filePath;
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const uploadedAvatarUrl = await handleAvatarUpload();

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      username,
      avatar_url: uploadedAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage("Error updating profile: " + error.message);
    } else {
      if (uploadedAvatarUrl) {
        setAvatarUrl(uploadedAvatarUrl);
      }
      setMessage("Profile updated!");
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={updateProfile} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback>
                {fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

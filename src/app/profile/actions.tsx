'use server'
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePasswordAction(
  email: string,
  currentPassword: string,
  newPassword: string
) {
  const supabase = await createClient();

  if (!email || !currentPassword || !newPassword) {
    throw new Error("Email, current password, and new password are required");
  }

  // Try to sign in with current password to verify it
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (authError || !authData.session) {
    throw new Error("Current password is incorrect");
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new Error("Failed to update password: " + updateError.message);
  }

  // Optional: Revalidate path if you're using server components
  revalidatePath("/profile");

  return { success: true, message: "Password updated successfully" };
}

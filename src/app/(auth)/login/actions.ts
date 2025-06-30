"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function authenticate(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email?.trim()) {
    throw new Error("Email is required");
  }

  try {
    await signIn("email", {
      email: email.trim(),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "EmailSignInError":
          throw new Error("Failed to send email");
        default:
          throw new Error("Something went wrong");
      }
    }
    throw error;
  }
}

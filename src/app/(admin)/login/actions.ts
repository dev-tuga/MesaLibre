"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";

export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return "Correo o contraseña incorrectos.";
    }
    // signIn redirects on success by throwing; let Next.js handle it.
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";

/**
 * Redirects are issued manually with relative paths instead of letting
 * NextAuth build absolute URLs: when the dev server is bound to 0.0.0.0
 * for LAN testing, inferred absolute URLs would point the browser at an
 * unreachable host. Relative redirects always stay on the host the
 * browser is already using (localhost on the PC, the LAN IP on a phone).
 */
export async function authenticate(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Correo o contraseña incorrectos.";
    }
    throw error;
  }
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await signOut({ redirect: false });
  redirect("/login");
}

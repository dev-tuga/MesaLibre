import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-muted/40 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Panel del restaurante</CardTitle>
          <CardDescription>Ingresa con tu cuenta de administración.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}

import { setRequestLocale } from "next-intl/server";
import { AuthBranding } from "@/components/auth/auth-branding";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <AuthBranding />
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

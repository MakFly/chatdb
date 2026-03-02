import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("errors.notFound");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Button asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </div>
  );
}

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-muted dark:bg-black/30">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col-reverse items-center gap-3 px-6 py-4 md:flex-row md:justify-between">
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CryptoCompete
        </span>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t("privacyPolicy")}
          </Link>
          <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t("termsOfService")}
          </Link>
          <Link href="/imprint" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t("imprint")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
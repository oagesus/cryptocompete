import Link from "next/link";
import { getUser } from "@/lib/auth/get-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileMenuPublic } from "@/components/mobile-menu-public";

export async function Navbar() {
  const user = await getUser();

  const activeProfile = user?.profiles.find((p) => p.publicId === user.activeProfileId);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm px-6">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between">
        <Link href="/" className="text-2xl font-thin">
          CryptoCompete
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href={`/account/profiles/${activeProfile?.publicId}/portfolio`}>Portfolio</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/trade">Trade</Link>
              </Button>
              <div className="hidden md:block">
                <UserMenu user={user} />
              </div>
              <div className="md:hidden">
                <MobileMenu user={user} />
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/trade">Trade</Link>
              </Button>
              <div className="hidden md:block w-px h-5 bg-border" />
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <div className="md:hidden">
                <MobileMenuPublic />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
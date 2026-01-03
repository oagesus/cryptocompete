import Link from "next/link";
import { getUser } from "@/lib/auth/get-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

export async function Navbar() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm px-6">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between">
        <Link href="/" className="text-2xl font-thin">
          CryptoCompete
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <LogoutButton />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
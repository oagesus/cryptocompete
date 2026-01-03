import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-thin tracking-tight sm:text-5xl">
            CryptoCompete
          </h1>
        </div>

        <p className="max-w-md text-lg text-muted-foreground">
          Build your virtual crypto portfolio and compete against others. 
          Track your performance, climb the leaderboard, and prove your trading skills.
        </p>

        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
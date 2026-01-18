import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getUser } from "@/lib/auth/get-user";
import { SellLink } from "./sell-link";

export default async function TradePage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Link
        href="/trade/buy"
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
      >
        <PlusCircle className="h-12 w-12" />
        <span className="text-xl font-semibold">Buy</span>
      </Link>
      <SellLink isAuthenticated={isAuthenticated} />
    </div>
  );
}
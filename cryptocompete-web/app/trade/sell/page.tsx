import { Card, CardContent } from "@/components/ui/card";

export default function SellPage() {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground">
          Select a cryptocurrency from your holdings to sell.
        </p>
      </CardContent>
    </Card>
  );
}
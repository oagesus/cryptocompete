import { Card, CardContent } from "@/components/ui/card";

export default function TradePage() {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground">
          Select a cryptocurrency from the sidebar to view its live price and trade.
        </p>
      </CardContent>
    </Card>
  );
}
import { Button } from "../../ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onBack: () => void;
}

export function BackButton({ onBack }: BackButtonProps) {
  return (
    <Button variant="outline" onClick={onBack}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Faculty List
    </Button>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (response: string) => void;
  itemType: "file" | "report";
}

export function ResponseDialog({ open, onOpenChange, onSubmit, itemType }: ResponseDialogProps) {
  const [response, setResponse] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (response.trim()) {
      onSubmit(response);
      setResponse("");
      onOpenChange(false);
      toast.success("Response submitted successfully");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to Admin Review</DialogTitle>
          <DialogDescription>
            Submit your response or clarification regarding the admin feedback on this {itemType}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="response">Your Response</Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your response, clarification, or action plan..."
              rows={6}
              required
              className="mt-2"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Submit Response
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

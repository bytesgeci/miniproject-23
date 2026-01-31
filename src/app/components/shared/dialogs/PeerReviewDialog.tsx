import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface PeerReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (review: string) => void;
  itemType: "file" | "report";
  itemName: string;
}

export function PeerReviewDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  itemType,
  itemName 
}: PeerReviewDialogProps) {
  const [review, setReview] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (review.trim()) {
      onSubmit(review);
      setReview("");
      onOpenChange(false);
      toast.success("Peer review submitted successfully");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Peer Review</DialogTitle>
          <DialogDescription>
            Provide your professional feedback on: <strong>{itemName}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="review">Your Review</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your insights, suggestions, and constructive feedback..."
              rows={6}
              required
              className="mt-2"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Submit Review
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

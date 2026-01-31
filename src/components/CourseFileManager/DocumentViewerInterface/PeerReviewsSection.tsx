import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import { MessageSquare, Plus } from "lucide-react";
import { PeerReview } from "./types";

interface PeerReviewsSectionProps {
  reviews: PeerReview[];
  selectedReview: PeerReview | null;
  onSelectReview: (review: PeerReview | null) => void;
  onAddReview: () => void;
}

export function PeerReviewsSection({
  reviews,
  selectedReview,
  onSelectReview,
  onAddReview,
}: PeerReviewsSectionProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Peer Reviews</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddReview}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </Button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-4">
          No peer reviews yet. Be the first to review!
        </p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {reviews.map((review) => (
            <AccordionItem key={review.id} value={review.id} className="border-b">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.reviewerAvatar} />
                    <AvatarFallback>
                      {review.reviewerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {review.reviewerName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {review.reviewDate}
                    </p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-3">
                <p className="text-sm text-gray-700">{review.comment}</p>
                {review.facultyResponse && (
                  <div className="bg-blue-50 border-l-4 border-blue-200 p-3 rounded">
                    <p className="text-xs font-semibold text-blue-900 mb-1">
                      Faculty Response
                    </p>
                    <p className="text-sm text-blue-700">
                      {review.facultyResponse}
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Card>
  );
}

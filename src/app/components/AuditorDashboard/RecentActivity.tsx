import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { RecentReview } from "./types";

interface RecentActivityProps {
  reviews: RecentReview[];
}

export function RecentActivity({ reviews }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Review Activity</CardTitle>
        <CardDescription>Your latest review actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className="h-2 w-2 rounded-full bg-orange-600 mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{review.action}</span> {review.item}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {review.faculty} • {review.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Button } from "../../ui/button";
import { PeerReviewDialog } from "../../shared/dialogs/PeerReviewDialog";
import { ResponseDialog } from "../../shared/dialogs/ResponseDialog";
import { DocumentHeader } from "./DocumentHeader";
import { DocumentPreview } from "./DocumentPreview";
import { FileInfoSidebar } from "./FileInfoSidebar";
import { AdminReviewSection } from "./AdminReviewSection";
import { PeerReviewsSection } from "./PeerReviewsSection";
import { CourseFile, PeerReview, DocumentViewerInterfaceProps } from "./types";

export function DocumentViewerInterface({
  file,
  onBack,
}: DocumentViewerInterfaceProps) {
  const [isPeerReviewOpen, setIsPeerReviewOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PeerReview | null>(null);
  const [reviews, setReviews] = useState<PeerReview[]>(file.peerReviews || []);

  const handlePeerReviewSubmit = (review: string) => {
    const newReview: PeerReview = {
      id: Date.now().toString(),
      reviewerName: "Current User", // In a real app, get from current user context
      comment: review,
      reviewDate: new Date().toLocaleDateString(),
      facultyResponse: undefined,
      reviewerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    };
    setReviews([...reviews, newReview]);
    setIsPeerReviewOpen(false);
  };

  const handleResponseSubmit = (response: string) => {
    if (selectedReview) {
      setReviews(
        reviews.map((review) =>
          review.id === selectedReview.id
            ? { ...review, facultyResponse: response }
            : review
        )
      );
      setSelectedReview(null);
      setIsResponseOpen(false);
    }
  };

  const handleDownloadDocument = (file: CourseFile) => {
    console.log("Downloading:", file.fileName);
    // Download logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DocumentHeader
        file={file}
        onBack={onBack}
        onDownload={handleDownloadDocument}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            <DocumentPreview file={file} />
            <AdminReviewSection file={file} />
            <PeerReviewsSection
              reviews={reviews}
              selectedReview={selectedReview}
              onSelectReview={setSelectedReview}
              onAddReview={() => setIsPeerReviewOpen(true)}
            />
          </div>

          {/* Sidebar */}
          <div>
            <FileInfoSidebar file={file} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {isPeerReviewOpen && (
        <PeerReviewDialog
          open={isPeerReviewOpen}
          onOpenChange={setIsPeerReviewOpen}
          onSubmit={handlePeerReviewSubmit}
          itemType="file"
          itemName={file.fileName}
        />
      )}

      {selectedReview && isResponseOpen && (
        <ResponseDialog
          open={isResponseOpen}
          onOpenChange={setIsResponseOpen}
          onSubmit={handleResponseSubmit}
          itemType="file"
        />
      )}
    </div>
  );
}

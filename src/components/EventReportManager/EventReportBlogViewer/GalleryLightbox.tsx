import { Button } from "../../ui/button";

interface GalleryLightboxProps {
  selectedImage: string | null;
  onClose: () => void;
}

export function GalleryLightbox({
  selectedImage,
  onClose,
}: GalleryLightboxProps) {
  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <img
        src={selectedImage}
        alt="Gallery"
        className="max-w-full max-h-full object-contain rounded-lg"
      />
      <Button
        variant="outline"
        className="absolute top-4 right-4"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );
}

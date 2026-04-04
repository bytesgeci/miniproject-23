"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent } from "../../ui/card";
import { X, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CourseFile } from "./types";
import { useAuth } from "@/context/AuthContext";
import { sendMessage } from "@/lib/messageClient";

interface AuditorMessage {
  id: string;
  facultyId: string;
  auditorId?: string;
  entityType: string;
  entityId: string;
  threadId?: string;
  senderRole?: string;
  senderName?: string;
  message: string;
  status?: string;
  createdAt?: string;
}

interface FileMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: CourseFile | null;
  facultyId?: string;
}

export function FileMessagesDialog({
  open,
  onOpenChange,
  file,
  facultyId,
}: FileMessagesDialogProps) {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<AuditorMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load messages for this file
  useEffect(() => {
    if (open && file && facultyId) {
      loadMessages();
    }
  }, [open, file, facultyId]);

  const loadMessages = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/messages?facultyId=${encodeURIComponent(facultyId || "")}&entityType=course-file&entityId=${encodeURIComponent(file.id)}`,
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !file || !facultyId || !user?.id) {
      toast.error("Please enter a reply");
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        facultyId,
        auditorId: user.id,
        entityType: "course-file",
        entityId: file.id,
        threadId: `course-file:${file.id}`,
        senderRole: "faculty",
        senderName: user.name,
        message: replyText,
      });

      toast.success("Reply sent successfully");
      setReplyText("");
      await loadMessages();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error sending reply",
      );
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearMessages = async () => {
    if (userRole !== "admin" || !file) return;

    if (
      !window.confirm(
        "Are you sure you want to clear all messages for this file? This cannot be undone.",
      )
    ) {
      return;
    }

    setIsSending(true);
    try {
      const threadId = `course-file:${file.id}`;
      const response = await fetch(
        `/api/messages?threadId=${encodeURIComponent(threadId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to clear messages");
        return;
      }

      toast.success("All messages cleared");
      setMessages([]);
      onOpenChange(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard:data-updated"));
      }
    } catch (error) {
      toast.error("Failed to clear messages");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const isAdmin = userRole === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg">
                Messages - {file?.fileName}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {file?.courseName}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm mt-1">
                Messages from auditors will appear here
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAuditor = msg.senderRole === "auditor";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAuditor ? "justify-start" : "justify-end"}`}
                >
                  <Card
                    className={`max-w-xs ${
                      isAuditor
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-700">
                            {isAuditor ? "Auditor" : "Your Reply"}
                          </p>
                          <p className="text-sm text-gray-900 mt-2">
                            {msg.message}
                          </p>
                          {msg.createdAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Section */}
        <div className="border-t bg-gray-50 p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Send Reply
            </label>
            <Textarea
              placeholder="Type your reply to the auditor..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendReply}
              disabled={isSending || !replyText.trim()}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Reply"}
            </Button>

            {isAdmin && (
              <Button
                onClick={handleClearMessages}
                disabled={isSending || messages.length === 0}
                variant="destructive"
                title="Clear all messages (Admin only)"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

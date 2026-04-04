export type MessagePayload = {
  facultyId: string;
  auditorId?: string;
  entityType: string;
  entityId: string;
  threadId?: string;
  senderRole?: string;
  senderName?: string;
  message: string;
  status?: string;
};

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export async function sendMessage(payload: MessagePayload) {
  const trimmedMessage = payload.message.trim();
  if (!payload.facultyId) {
    throw new Error("Faculty ID is required");
  }
  if (!payload.entityType || !payload.entityId) {
    throw new Error("Message target is required");
  }
  if (!trimmedMessage) {
    throw new Error("Message cannot be empty");
  }

  const body = {
    ...payload,
    threadId: payload.threadId || `${payload.entityType}:${payload.entityId}`,
    message: trimmedMessage,
  };

  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error || "Failed to send message");
  }

  return data;
}

export async function sendMessagesBatch(payloads: MessagePayload[]) {
  const results = await Promise.allSettled(
    payloads.map((payload) => sendMessage(payload)),
  );

  const failed = results.filter(
    (result) => result.status === "rejected",
  ) as PromiseRejectedResult[];
  const sent = results.length - failed.length;

  return {
    sent,
    failed: failed.length,
    errors: failed.map((result) =>
      String(
        result.reason?.message || result.reason || "Failed to send message",
      ),
    ),
  };
}

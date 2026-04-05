import { EventReportManager } from "@/components/EventReportManager";
import { FacultySectionTabs } from "@/components/faculty/FacultySectionTabs";
import type { EventReport } from "@/components/EventReportManager/types";
import { readJsonFile } from "@/lib/jsonDb";

export const revalidate = 20;

export default async function FacultyReportsPage() {
  const reports = await readJsonFile<EventReport[]>("eventReports.json");
  const communities = (await readJsonFile<string[]>("reports/communities.json"))
    .map((community) => String(community || "").trim())
    .filter(Boolean);

  return (
    <main className="space-y-6">
      <FacultySectionTabs>
        <EventReportManager
          initialReports={reports}
          communities={communities}
        />
      </FacultySectionTabs>
    </main>
  );
}

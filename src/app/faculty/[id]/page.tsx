import { notFound } from "next/navigation";
import type { FacultyMember } from "@/types/faculty";
import { getAllUsers } from "@/lib/userStore";
import { FacultyProfileView } from "@/components/faculty/FacultyProfileView";

interface FacultyProfilePageProps {
  params: Promise<{ id: string }>;
}

// Disable caching to always show fresh data when files are uploaded
export const revalidate = 0;

function normalizeIdentity(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getUserIdentityVariants(user: {
  id?: string;
  username?: string;
  email?: string;
  firebaseUid?: string;
}) {
  const variants = new Set<string>();

  [user.id, user.username, user.email, user.firebaseUid].forEach((value) => {
    const normalized = normalizeIdentity(value);
    if (normalized) {
      variants.add(normalized);
    }
  });

  return variants;
}

export default async function FacultyProfilePage({
  params,
}: FacultyProfilePageProps) {
  const { id } = await params;

  // Get all users
  const users = await getAllUsers();
  const lookup = normalizeIdentity(id);

  console.log(
    `[Faculty Profile] Looking for faculty with ID: "${id}" (normalized: "${lookup}")`,
  );

  const user = users.find((u) => {
    const isFaculty =
      (u.role === "faculty" || u.roles?.includes("faculty")) &&
      u.role !== "admin";
    if (!isFaculty) {
      return false;
    }

    const identities = getUserIdentityVariants({
      id: String(u.id ?? ""),
      username: String(u.username ?? ""),
      email: String(u.email ?? ""),
      firebaseUid: String(u.firebaseUid ?? ""),
    });
    return identities.has(lookup);
  });

  if (!user) {
    console.error(`[Faculty Profile] Faculty not found for ID: "${id}"`);
    notFound();
  }

  console.log(`[Faculty Profile] Found faculty: ${user.name}`);

  // Convert user to FacultyMember
  const faculty: FacultyMember = {
    id: String(user.id),
    name: user.name,
    department: user.department ?? "N/A",
    role: user.role,
    roles: user.roles,
    isStaffAdvisor: user.roles?.includes("staff-advisor") ?? false,
    email: user.email ?? user.username ?? "N/A",
    phone: user.phone ?? "N/A",
    courses: Array.isArray(user.courses) ? user.courses : [],
    specialization: user.specialization ?? "General",
    experience: user.experience ?? "",
    profileImageUrl: user.profileImageUrl,
    resumeUrl: user.resumeUrl,
    resumeFileName: user.resumeFileName,
  };

  const hydratedFaculty: FacultyMember = {
    ...faculty,
    courses: Array.isArray(faculty.courses) ? faculty.courses : [],
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <FacultyProfileView
          faculty={hydratedFaculty}
          courseFiles={[]}
          eventReports={[]}
        />
      </div>
    </main>
  );
}

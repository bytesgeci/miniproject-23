const express = require("express");
const router = express.Router();
const UploadedFile = require("../models/UploadedFile");
const User = require("../models/User");
const Student = require("../models/Student");
const EventReport = require("../models/EventReport");
const mongoose = require("mongoose");
const { verifyToken } = require("../middleware/auth.middleware");

const LEGACY_PENDING_STATUSES = ["pending", "submitted"];

function normalizeStatusValue(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized) return "";
  if (normalized === "in review") return "in_review";
  if (
    ["pending", "submitted", "approved", "rejected", "in_review"].includes(
      normalized,
    )
  ) {
    return normalized;
  }

  return normalized;
}

function buildStatusOrQuery(statusValues) {
  const normalizedValues = Array.isArray(statusValues)
    ? statusValues.map(normalizeStatusValue).filter(Boolean)
    : [normalizeStatusValue(statusValues)].filter(Boolean);

  if (!normalizedValues.length) {
    return {};
  }

  const legacyValues = normalizedValues.flatMap((status) => {
    const titleCase = status.replace(/_/g, " ");
    return [
      status,
      titleCase,
      titleCase.charAt(0).toUpperCase() + titleCase.slice(1),
    ];
  });

  return {
    $or: [
      { "review.status": { $in: normalizedValues } },
      { status: { $in: legacyValues } },
    ],
  };
}

function getFileStatus(file) {
  return normalizeStatusValue(file?.review?.status || file?.status);
}

function withCompatibilityFields(file) {
  const status = getFileStatus(file);
  return {
    ...file,
    id: String(file?._id || file?.id || ""),
    status,
    review: {
      ...(file?.review || {}),
      status,
    },
  };
}

function buildAdvisorQuery(advisorId) {
  if (!advisorId) {
    return {};
  }

  if (mongoose.isValidObjectId(advisorId)) {
    return { advisorId: new mongoose.Types.ObjectId(advisorId) };
  }

  return {
    $expr: {
      $eq: [{ $toString: "$advisorId" }, String(advisorId)],
    },
  };
}

/**
 * GET /api/dashboard/faculty-list
 * Get all faculty users for dashboard
 */
router.get("/faculty-list", async (req, res) => {
  try {
    const faculty = await User.find({
      $or: [{ role: "faculty" }, { roles: "faculty" }],
    })
      .select("-password")
      .lean();

    const courseFiles = await UploadedFile.find({})
      .select("facultyId courseCode courseName semester academicYear")
      .lean();

    // Build courses by faculty
    const coursesByFaculty = new Map();
    for (const file of courseFiles) {
      const fId = file.facultyId?.toString();
      if (!fId) continue;

      if (!coursesByFaculty.has(fId)) {
        coursesByFaculty.set(fId, new Set());
      }

      const courseLabel = [file.courseCode, file.courseName]
        .filter(Boolean)
        .join(" - ");

      if (courseLabel) {
        coursesByFaculty.get(fId).add(courseLabel);
      }
    }

    // Format faculty members
    const facultyMembers = faculty.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      department: user.department || "",
      role: user.role,
      roles: Array.isArray(user.roles) ? user.roles : [],
      isStaffAdvisor: Array.isArray(user.roles)
        ? user.roles.includes("staff-advisor")
        : false,
      email: user.email || user.username,
      phone: user.phone || "",
      courses: Array.from(
        coursesByFaculty.get(user._id.toString()) || [],
      ).sort(),
      specialization: user.specialization || "",
      experience: user.experience || "",
      profileImageUrl: user.profileImageUrl || "",
      resumeUrl: user.resumeUrl || "",
      resumeFileName: user.resumeFileName || "",
    }));

    res.json({
      facultyMembers,
      total: facultyMembers.length,
    });
  } catch (error) {
    console.error("Error fetching faculty list:", error);
    res.status(500).json({ error: "Failed to fetch faculty list" });
  }
});

/**
 * GET /api/dashboard/faculty-stats/:facultyId
 * Get faculty dashboard stats
 */
router.get("/faculty-stats/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.json({
        stats: {
          totalFiles: 0,
          totalReports: 0,
          pendingReports: 0,
          totalParticipants: 0,
          recentActivity: [],
        },
      });
    }

    const facultyObjectId = new mongoose.Types.ObjectId(facultyId);

    const files = await UploadedFile.find({
      facultyId: facultyObjectId,
    }).lean();
    const pendingFiles = await UploadedFile.countDocuments({
      facultyId: facultyObjectId,
      ...buildStatusOrQuery(LEGACY_PENDING_STATUSES),
    });

    const totalReports = await EventReport.countDocuments({
      $or: [{ facultyId }, { facultyId: String(facultyId) }],
    });

    const totalParticipants = files.reduce(
      (sum, f) => sum + (f.participants || 0),
      0,
    );

    const recentActivity = files
      .sort(
        (a, b) =>
          (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0),
      )
      .slice(0, 5)
      .map((file) => ({
        action: "Uploaded",
        item: file.originalFileName,
        time: formatTimeAgo(file.uploadedAt),
      }));

    res.json({
      stats: {
        totalFiles: files.length,
        totalReports,
        pendingReports: pendingFiles,
        totalParticipants,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching faculty stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * GET /api/dashboard/all-files
 * Get all course files for dashboard
 */
router.get("/all-files", async (req, res) => {
  try {
    const files = await UploadedFile.find({})
      .select(
        "fileName originalFileName courseCode courseName semester academicYear review.status status uploadedAt facultyId",
      )
      .lean();

    const normalizedFiles = files.map(withCompatibilityFields);

    // Group by faculty
    const grouped = {};
    for (const file of normalizedFiles) {
      const fId = file.facultyId?.toString() || "unknown";
      if (!grouped[fId]) {
        grouped[fId] = [];
      }
      grouped[fId].push(file);
    }

    res.json({ files: grouped, total: normalizedFiles.length });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

/**
 * GET /api/dashboard/engagements
 * Get engagement data across all users
 */
router.get("/engagements", async (req, res) => {
  try {
    const files = await UploadedFile.find({})
      .select("facultyId review.status status uploadedAt")
      .lean();

    // Keep per-faculty aggregates only for faculty who uploaded at least one file.
    const uploadsByFacultyId = new Map();
    const approvedByFacultyId = new Map();
    for (const file of files) {
      const facultyId = file?.facultyId?.toString();
      if (!facultyId) continue;

      uploadsByFacultyId.set(
        facultyId,
        (uploadsByFacultyId.get(facultyId) || 0) + 1,
      );
      if (getFileStatus(file) === "approved") {
        approvedByFacultyId.set(
          facultyId,
          (approvedByFacultyId.get(facultyId) || 0) + 1,
        );
      }
    }

    const faculty = await User.find({
      $and: [
        { $or: [{ role: "faculty" }, { roles: "faculty" }] },
        {
          $or: [{ verified: true }, { role: "auditor" }, { roles: "auditor" }],
        },
      ],
      status: "active",
      deletedAt: null,
    })
      .select("_id name")
      .lean();

    const engagements = faculty
      .map((user) => {
        const facultyId = user._id.toString();
        const uploadsCount = uploadsByFacultyId.get(facultyId) || 0;
        const approvedCount = approvedByFacultyId.get(facultyId) || 0;

        return {
          facultyId,
          facultyName: user.name,
          uploadsCount,
          score:
            uploadsCount > 0
              ? Math.round((approvedCount / uploadsCount) * 100)
              : 0,
        };
      })
      .filter((engagement) => engagement.uploadsCount > 0);

    res.json({ engagements });
  } catch (error) {
    console.error("Error fetching engagements:", error);
    res.status(500).json({ error: "Failed to fetch engagements" });
  }
});

/**
 * GET /api/dashboard/pending-audit-faculty
 * Get faculty with pending items that require auditing
 */
router.get("/pending-audit-faculty", async (req, res) => {
  try {
    const pendingQuery = buildStatusOrQuery(LEGACY_PENDING_STATUSES);

    const [pendingFiles, pendingReports] = await Promise.all([
      UploadedFile.find(pendingQuery).select("facultyId").lean(),
      EventReport.find({ ...pendingQuery, deletedAt: null })
        .select("facultyId")
        .lean(),
    ]);

    const pendingByFaculty = new Map();

    for (const file of pendingFiles) {
      const facultyId = file?.facultyId?.toString();
      if (!facultyId) continue;

      const current = pendingByFaculty.get(facultyId) || {
        pendingFiles: 0,
        pendingReports: 0,
      };
      current.pendingFiles += 1;
      pendingByFaculty.set(facultyId, current);
    }

    for (const report of pendingReports) {
      const facultyId = report?.facultyId?.toString();
      if (!facultyId) continue;

      const current = pendingByFaculty.get(facultyId) || {
        pendingFiles: 0,
        pendingReports: 0,
      };
      current.pendingReports += 1;
      pendingByFaculty.set(facultyId, current);
    }

    const pendingFaculty = Array.from(pendingByFaculty.entries()).map(
      ([facultyId, counts]) => ({
        facultyId,
        pendingFiles: counts.pendingFiles,
        pendingReports: counts.pendingReports,
        totalPending: counts.pendingFiles + counts.pendingReports,
      }),
    );

    res.json({
      pendingFaculty,
      totalFaculty: pendingFaculty.length,
    });
  } catch (error) {
    console.error("Error fetching pending audit faculty:", error);
    res.status(500).json({ error: "Failed to fetch pending audit faculty" });
  }
});

/**
 * GET /api/dashboard/students
 * Get student data
 */
router.get("/students", async (req, res) => {
  try {
    const advisorId = String(req.query.advisorId || "").trim();
    const query = advisorId ? buildAdvisorQuery(advisorId) : {};

    const students = await Student.find(query).sort({ createdAt: -1 }).lean();

    const normalizedStudents = students.map((student) => ({
      ...student,
      id: String(student.id || student._id),
    }));

    res.json({ students: normalizedStudents });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

/**
 * Helper: Format time ago
 */
function formatTimeAgo(date) {
  if (!date) return "Just now";
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

module.exports = router;

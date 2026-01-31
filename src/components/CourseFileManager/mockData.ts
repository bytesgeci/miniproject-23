import { CourseFile, PeerReview } from "./types";

export const mockCourseFiles: CourseFile[] = [
  {
    id: "1",
    fileName: "CS101_Syllabus_Fall2024.pdf",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    fileType: "Syllabus",
    uploadDate: "2024-08-15",
    semester: "Fall",
    academicYear: "2024-2025",
    size: "1.2 MB",
    status: "Approved",
    adminRemarks: "Excellent syllabus with comprehensive learning objectives.",
    reviewedBy: "Dr. Michael Chen (Department Head)",
    reviewedDate: "2024-08-16",
    facultyName: "Dr. Jane Smith",
    department: "Computer Science",
    peerReviews: [
      {
        id: "pr1",
        reviewerName: "Dr. Robert Brown",
        reviewDate: "2024-08-17",
        comment: "Very well-structured syllabus. The learning outcomes are clearly defined and measurable."
      }
    ]
  }
];

export const fileCategories = [
  "Syllabus",
  "Lesson Plan",
  "Assignment",
  "Reading Material",
  "Presentation",
  "Other"
];

export const fileTypes = [
  "Syllabus",
  "Lesson Plan",
  "Assignment",
  "Reading Material",
  "Presentation",
  "Other"
];

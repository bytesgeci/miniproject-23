import { DashboardStats, CareerStats, Student, FacultyStatus } from "./types";

export const mockStats: DashboardStats = {
  totalStudents: 45,
  batchYear: "2021-2025",
  placedStudents: 28,
  inProcess: 12,
  averageCGPA: 8.2,
  averageAttendance: 85,
  totalFaculty: 6,
  approvedFiles: 32,
  approvedReports: 20
};

export const mockCareerStats: CareerStats = {
  totalInternships: 35,
  activeInternships: 18,
  completedProjects: 67,
  skillWorkshops: 12,
  campusInterviews: 8
};

export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    rollNumber: "21CS001",
    email: "rajesh.kumar@college.edu",
    phone: "+91 98765 43210",
    department: "Computer Science",
    semester: "8th",
    cgpa: 8.7,
    attendance: 92,
    careerInterest: "Software Development",
    skillsAcquired: ["Java", "Python", "React", "Node.js"],
    placementStatus: "Placed",
    companyName: "Tech Corp",
    activityPoints: 50,
    activities: [
      { id: "1", name: "Hackathon", community: "Tech Club", points: 20, date: "2023-05-15" },
      { id: "2", name: "Project Presentation", community: "Project Team", points: 15, date: "2023-06-20" },
      { id: "3", name: "Internship", community: "Tech Corp", points: 15, date: "2023-07-01" }
    ]
  }
];

export const mockFacultyStatus: FacultyStatus[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    department: "Computer Science",
    filesUploaded: 8,
    filesRequired: 8,
    reportsUploaded: 5,
    reportsRequired: 5,
    lastUpdate: "2024-01-20",
    status: "Complete"
  }
];

import { EventReport } from "./types";

export const mockEventReports: EventReport[] = [
  {
    id: "1",
    eventName: "Community Health Awareness Campaign",
    community: "Health & Wellness",
    eventDate: "2024-11-15",
    location: "Local Community Center",
    participants: 45,
    duration: "4 hours",
    description: "Organized a comprehensive health awareness campaign focusing on preventive healthcare and nutrition. The event brought together healthcare professionals, nutritionists, and community members to discuss healthy lifestyle choices. Interactive sessions covered topics such as balanced diet, importance of regular exercise, mental health awareness, and disease prevention strategies. Participants received health information materials and free health screenings.",
    objectives: "The primary objective was to educate community members about healthy lifestyle choices and disease prevention. We aimed to create awareness about common health issues and provide practical solutions that can be easily implemented in daily life.",
    outcomes: "Successfully reached 45 community members from diverse age groups. Distributed comprehensive health information materials. Conducted free health screenings for blood pressure, blood sugar, and BMI. Received positive feedback with participants expressing increased awareness about health issues.",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=400&fit=crop"
    ],
    status: "Approved",
    submittedDate: "2024-11-20",
    facultyCoordinator: "Dr. Sarah Johnson",
    department: "Health Sciences",
    eventType: "Community Service",
    adminRemarks: "Outstanding community outreach initiative. The event showed excellent planning and execution. The health materials were comprehensive and age-appropriate. Consider expanding this program to neighboring communities.",
    reviewedBy: "Dr. Patricia Williams (Academic Dean)",
    reviewedDate: "2024-11-22"
  },
  {
    id: "2",
    eventName: "Women Empowerment Workshop",
    community: "Women Empowerment",
    eventDate: "2024-10-20",
    location: "University Convention Center",
    participants: 80,
    duration: "5 hours",
    description: "A comprehensive workshop focused on women's rights, financial literacy, and career development.",
    objectives: "Empower women with knowledge and skills for personal and professional growth.",
    outcomes: "Reached 80 participants, provided career counseling, distributed educational materials.",
    status: "Approved",
    submittedDate: "2024-10-25",
    facultyCoordinator: "Dr. Maya Patel",
    department: "Social Sciences",
    eventType: "Women Empowerment"
  }
];

export const communities = [
  "Community Service",
  "Educational Outreach",
  "Environmental Initiative",
  "Health & Wellness",
  "Cultural Exchange",
  "Technical Workshop",
  "Women Empowerment",
  "Rural Development",
  "Youth Development",
  "Senior Citizen Support",
  "Other"
];

import { Gig, Profile } from "@/types";
export const profiles: Profile[] = [
  { id: "1", name: "Areeba Khan", role: "Student", initials: "AK", institute: "LUMS · Computer Science", skills: ["Product design", "Figma", "Research"], activity: 96, completedProjects: 18, verified: true, badge: "Talash" },
  { id: "2", name: "Hamza Ahmed", role: "Student", initials: "HA", institute: "NUST · Software Engineering", skills: ["React", "Next.js", "TypeScript"], activity: 82, completedProjects: 11, verified: true, badge: "Blue Tick" },
  { id: "3", name: "Maham Siddiqui", role: "Student", initials: "MS", institute: "IBA Karachi · Marketing", skills: ["Copywriting", "Brand strategy"], activity: 74, completedProjects: 9, verified: false }
];
export const gigs: Gig[] = [
  { id: "1", title: "I will design a bold brand identity for your startup", creator: "Areeba Khan", price: 85, category: "Design", rating: 4.9, image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80", avatar: "AK" },
  { id: "2", title: "I will build your responsive Next.js landing page", creator: "Hamza Ahmed", price: 120, category: "Development", rating: 5, image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80", avatar: "HA" },
  { id: "3", title: "I will make your social content sound human", creator: "Maham Siddiqui", price: 45, category: "Writing", rating: 4.8, image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80", avatar: "MS" }
];
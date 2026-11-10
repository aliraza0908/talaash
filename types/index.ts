export type Role = "Student" | "Client" | "Professor" | "Admin";
export type AppView = "Feed" | "Gigs" | "Requests" | "Messages" | "Profile" | "Admin";
export type Profile = { id: string; name: string; role: Role; initials: string; institute: string; skills: string[]; activity: number; completedProjects: number; verified: boolean; badge?: string };
export type Gig = { id: string; title: string; creator: string; price: number; category: string; rating: number; image: string; avatar: string };
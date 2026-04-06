import type { CurrentUser } from "@/shared/lib/get-user";

/** Category item for grid/filter display */
export interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
}

/** Master-specific dashboard stats */
export interface MasterStats {
  responsesCount: number;
  activeTasksCount: number;
  rating: number;
  reviewsCount: number;
}

/** Dashboard stats */
export interface DashboardStats {
  myTasksCount: number;
  openResponsesCount: number;
  unreadNotificationsCount: number;
  masterStats: MasterStats | null;
}

/** Dashboard page props (typed from RSC data loading) */
export interface DashboardPageData {
  user: CurrentUser;
  categories: CategoryItem[];
  stats: DashboardStats;
}

/** Task card data (for feed display) */
export interface TaskCardData {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  address: string | null;
  createdAt: Date;
  category: {
    name: string;
  };
  customer: {
    firstName: string;
    avatar: string | null;
  };
}

/** Nearby task with distance (PostGIS) */
export interface NearbyTaskCard extends TaskCardData {
  distance: number;
}

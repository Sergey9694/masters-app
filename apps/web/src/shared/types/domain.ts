import type { CurrentUser } from "@/shared/lib/get-user";

/** Category item for grid/filter display */
export interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
}

/** Provider-specific dashboard stats */
export interface ProviderStats {
  responsesCount: number;
  pendingResponsesCount: number;
  activeTasksCount: number;
  rating: number;
  reviewsCount: number;
}

/** Dashboard stats */
export interface DashboardStats {
  myTasksCount: number;
  openTasksCount: number;
  activeTasksCount: number;
  openResponsesCount: number;
  unreadNotificationsCount: number;
  masterStats: ProviderStats | null;
}

/** Dashboard page props (typed from RSC data loading) */
export interface DashboardPageData {
  user: CurrentUser;
  categories: CategoryItem[];
  stats: DashboardStats;
}

/** Order card data (for feed display) */
export interface OrderCardData {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  address: string | null;
  createdAt: Date;
  category: {
    name: string;
  };
  client: {
    firstName: string;
    avatar: string | null;
  };
  status: string;
}

/** Nearby order with distance (PostGIS) */
export interface NearbyOrderCard extends OrderCardData {
  distance: number;
}

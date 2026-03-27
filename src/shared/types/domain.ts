import type { CurrentUser } from "@/shared/lib/get-user";

/** Category item for grid/filter display */
export interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
}

/** Dashboard page props (typed from RSC data loading) */
export interface DashboardPageData {
  user: CurrentUser;
  categories: CategoryItem[];
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

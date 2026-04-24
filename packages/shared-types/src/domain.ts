export interface OrderCard {
  id: string;
  orderNumber?: number;
  slug?: string | null;
  title: string;
  description?: string;
  budget: number | null;
  address: string | null;
  status: string;
  createdAt: Date;
  category: {
    name: string;
    slug: string;
  };
  client?: {
    firstName: string;
    avatar: string | null;
  };
  city: {
    name: string;
    slug: string;
  };
  images?: string[];
  proposalCount: number;
  distance?: number;
}

export type OrderCardData = OrderCard;

export interface NearbyOrderCard extends OrderCard {
  distance: number;
}

export interface ListingCard {
  id: string;
  title: string;
  price: number | null;
  priceUnit: string;
  imageUrl: string | null;
  category: string;
  providerName: string;
  rating: number;
}

export interface ProviderCard {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  rating: number;
  reviewCount: number;
  categories: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
}

export interface DashboardStats {
  unreadNotificationsCount: number;
  openProposalsCount: number;
  activeOrdersCount: number;
  myOrdersCount: number;
  providerStats?: {
    rating: number;
    reviewsCount: number;
    activeOrdersCount: number;
    pendingProposalsCount: number;
  } | null;
}

export interface DashboardPageData {
  user: {
    id: string;
    firstName: string;
    avatar: string | null;
    providerProfile?: { id: string } | null;
  };
  hasEmail: boolean;
  categories: Category[];
  stats: DashboardStats;
  recentOrders: OrderCard[];
}

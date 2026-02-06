
export enum NavTab {
  Discovery = 'discovery',
  Shelf = 'shelf',
  Station = 'station',
  Community = 'community'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  nickname: string;
  location: string;
  status: 'available' | 'traveling' | 'reserved';
  daysInTravel?: number;
  recommendBy?: {
    name: string;
    role: string;
    avatar: string;
  };
  travelCount?: number;
}

export interface TravelNode {
  department: string;
  date: string;
  user: string;
  type: 'start' | 'transit' | 'current';
  note?: string;
}

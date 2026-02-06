
import { Book, TravelNode } from './types';

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: '午夜图书馆',
    author: 'Matt Haig',
    cover: 'https://picsum.photos/seed/book1/400/600',
    nickname: '回声寻找者',
    location: '产品部 - 4F',
    status: 'available',
    travelCount: 48
  },
  {
    id: '2',
    title: '原子习惯',
    author: 'James Clear',
    cover: 'https://picsum.photos/seed/book2/400/600',
    nickname: '习惯大师',
    location: '人力资源部 - 2F',
    status: 'traveling',
    daysInTravel: 3,
    travelCount: 32
  },
  {
    id: '3',
    title: '沙丘',
    author: 'Frank Herbert',
    cover: 'https://picsum.photos/seed/book3/400/600',
    nickname: '香料之路',
    location: '技术部 - 5F',
    status: 'available',
    travelCount: 15
  }
];

export const MOCK_RECOMMENDATIONS: Book[] = [
  {
    id: '4',
    title: '设计心理学',
    author: '唐纳德·诺曼',
    cover: 'https://picsum.photos/seed/book4/400/600',
    nickname: '造物主视角',
    location: '1F 咖啡驿站',
    status: 'available',
    recommendBy: {
      name: 'Chen',
      role: '设计总监',
      avatar: 'https://picsum.photos/seed/avatar1/100/100'
    }
  },
  {
    id: '5',
    title: '创新自信力',
    author: '汤姆·凯利',
    cover: 'https://picsum.photos/seed/book5/400/600',
    nickname: '破局者',
    location: '3F 休闲区',
    status: 'available',
    recommendBy: {
      name: 'Sarah',
      role: '产品副总裁',
      avatar: 'https://picsum.photos/seed/avatar2/100/100'
    }
  }
];

export const TRAVEL_HISTORY: TravelNode[] = [
  { department: '行政部', date: '1月1日', user: 'Sarah Jenkins', type: 'start' },
  { department: '技术部', date: '2月15日', user: 'David Chen', type: 'transit' },
  { department: '市场部', date: '3月10日', user: 'Mia Wong', type: 'current', note: '在午后的咖啡时光里享受阅读！码头尽头那束绿光依然让人感怀。' }
];

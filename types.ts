
export enum WeatherType {
  SUNNY = '맑음',
  RAINY = '비',
  SNOWY = '눈',
  CLOUDY = '흐림'
}

export interface CritiqueHistory {
  artId: string;
  artTitle: string;
  text: string;
}

export interface Guest {
  id: string;
  name: string;
  avatar: string; // 프로필 이미지
  fullBodyImage: string; // 전신 이미지
  personality: string;
  speechStyle: string;
  affinity: number; // 호감도 (0-100)
  ownedArtworks: string[]; // 소유한 작품 제목들
  recentCritique?: string; // 최근 남긴 감상평
  isCritiqueActive: boolean; // 감상평 생성 온/오프
  initialFacing: 'left' | 'right'; // 초기 이미지 방향
  critiqueHistory: CritiqueHistory[]; // 감상평 기록
}

export interface Artwork {
  id: string;
  indexNumber: number; // 001, 002...
  title: string;
  artist: string;
  imageUrl: string;
  description: string;
  cast: string[];
  owner: string;
  price: number;
  estAuctionPrice: number;
  isApproved: boolean;
  critiques: { guestName: string; text: string }[];
  musicUrl?: string; // 유튜브 URL
  audioFile?: string; // 로컬 오디오 파일 Blob URL
  registeredAt: number; // 타임스탬프
  
  // 컨디션 시스템
  lastCleanedAt: number;
  dailyClickCount: number;
  lastClickDate: string; // YYYY-MM-DD
  
  // 통계
  totalViewTime: number; // ms 단위 총 감상 시간
}

export interface UserState {
  username: string;
  profilePic: string;
  balance: number;
  collection: Artwork[];
  backgrounds: {
    day: string | null;
    night: string | null;
  };
}

export interface AuctionItem {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  description: string;
  category: string;
  views: number;
  likes: number;
  viewTime: number;
  uploadDate: string;
  price: number;
  currentBid: number;
  highestBidder: string;
  timeLeft: number;
}

export type UserRole = 'listener' | 'artist' | 'band';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  contactInfo?: string;
  followersCount: number;
  monthlyListeners: number;
  isVerified: boolean;
  createdAt: any;
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  audioUrl: string;
  coverUrl?: string;
  playsCount: number;
  createdAt: any;
}

export interface Post {
  id: string;
  artistId: string;
  artistName: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

export interface Follow {
  id: string;
  listenerId: string;
  artistId: string;
  createdAt: any;
}

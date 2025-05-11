import { Timestamp } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

export interface RoomSettings {
  maxMembers?: number;
  isPrivate?: boolean;
  metadata?: Record<string, any>;
  initialState?: Record<string, any>;
  [key: string]: any;
}

export interface RoomData {
  createdAt: Timestamp;
  createdBy: string;
  members: string[];
  state: Record<string, any>;
  settings: {
    maxMembers: number;
    isPrivate: boolean;
    metadata: Record<string, any>;
    [key: string]: any;
  };
  memberData?: Record<string, MemberData>;
}

export interface MemberData {
  joinedAt: Timestamp;
  displayName: string;
  photoURL: string | null;
  isHost?: boolean;
  [key: string]: any;
}

export interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: any;
  type: string;
  timestamp: Timestamp;
}

export type EventType = 'authStateChanged' | 'roomStateChanged' | 'dataReceived';
export type EventListener = (data: any) => void;
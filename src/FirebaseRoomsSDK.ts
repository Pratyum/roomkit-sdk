import { FirebaseApp, initializeApp } from 'firebase/app';
import {
    Auth,
    createUserWithEmailAndPassword,
    signInAnonymously as firebaseSignInAnonymously,
    signOut as firebaseSignOut,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    User,
    UserCredential
} from 'firebase/auth';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    Firestore,
    getDoc,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
    updateDoc
} from 'firebase/firestore';
import { EventType, FirebaseConfig, RoomData, RoomMessage, RoomSettings } from './types';

class FirebaseRoomsSDK {
    private app: FirebaseApp;
    private auth: Auth;
    private db: Firestore;
    private currentUser: User | null = null;
    private currentRoom: string | null = null;
    private unsubscribeRoom: Unsubscribe | null = null;
    private unsubscribeMessages: Unsubscribe | null = null;
    private listeners: Record<EventType, EventListener[]> = {
      authStateChanged: [],
      roomStateChanged: [],
      dataReceived: []
    };
  
    constructor(firebaseConfig: FirebaseConfig) {
      if (!firebaseConfig) {
        throw new Error('Firebase configuration is required');
      }
      
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      
      // Setup auth state listener
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this._notifyListeners('authStateChanged', user);
      });
    }
    
    // =========== Authentication Methods ===========
    
    /**
     * Sign in with email and password
     * @param email User email
     * @param password User password
     * @returns Promise resolving to user credentials
     */
    async signInWithEmail(email: string, password: string): Promise<UserCredential> {
      return signInWithEmailAndPassword(this.auth, email, password);
    }
    
    /**
     * Create a new user with email and password
     * @param email User email
     * @param password User password
     * @returns Promise resolving to user credentials
     */
    async createUserWithEmail(email: string, password: string): Promise<UserCredential> {
      return createUserWithEmailAndPassword(this.auth, email, password);
    }
    
    /**
     * Sign in anonymously
     * @returns Promise resolving to user credentials
     */
    async signInAnonymously(): Promise<UserCredential> {
      return firebaseSignInAnonymously(this.auth);
    }
    
    /**
     * Sign out the current user
     * @returns Promise that resolves when sign-out is complete
     */
    async signOut(): Promise<void> {
      if (this.currentRoom) {
        await this.leaveRoom();
      }
      return firebaseSignOut(this.auth);
    }
    
    /**
     * Check if a user is signed in
     * @returns boolean indicating if user is signed in
     */
    isSignedIn(): boolean {
      return !!this.currentUser;
    }
    
    /**
     * Get the current signed-in user
     * @returns The current Firebase user or null
     */
    getCurrentUser(): User | null {
      return this.currentUser;
    }
    
    // =========== Room Methods ===========
    
    /**
     * Create a new room with specified settings
     * @param settings Room settings
     * @returns Promise resolving to room ID
     */
    async createRoom(settings: RoomSettings = {}): Promise<string> {
      this._requireAuth();
      
      const roomData: RoomData = {
        createdAt: serverTimestamp() as Timestamp,
        createdBy: this.currentUser!.uid,
        members: [this.currentUser!.uid],
        state: settings.initialState || {},
        settings: {
          maxMembers: settings.maxMembers || 10,
          isPrivate: settings.isPrivate || false,
          metadata: settings.metadata || {},
          ...settings
        }
      };
      
      const roomsCollection = collection(this.db, 'rooms');
      const roomRef = await addDoc(roomsCollection, roomData);
      await this._joinRoomById(roomRef.id);
      return roomRef.id;
    }
    
    /**
     * Join a room by ID
     * @param roomId The ID of the room to join
     * @returns Promise resolving to room data
     */
    async joinRoom(roomId: string): Promise<RoomData> {
      this._requireAuth();
      
      // Check if room exists
      const roomRef = doc(this.db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error(`Room with ID ${roomId} does not exist`);
      }
      
      return this._joinRoomById(roomId);
    }
    
    /**
     * Leave the current room
     * @returns Promise that resolves when room is left
     */
    async leaveRoom(): Promise<void> {
      this._requireAuth();
      
      if (!this.currentRoom) {
        return;
      }
      
      // Unsubscribe from listeners
      if (this.unsubscribeRoom) {
        this.unsubscribeRoom();
        this.unsubscribeRoom = null;
      }
      
      if (this.unsubscribeMessages) {
        this.unsubscribeMessages();
        this.unsubscribeMessages = null;
      }
      
      // Remove user from room members
      const roomRef = doc(this.db, 'rooms', this.currentRoom);
      await updateDoc(roomRef, {
        members: arrayRemove(this.currentUser!.uid)
      });
      
      this.currentRoom = null;
    }
    
    /**
     * Get the current room state
     * @returns Promise resolving to room data
     */
    async getRoomState(): Promise<RoomData | null> {
      this._requireAuth();
      
      if (!this.currentRoom) {
        return null;
      }
      
      const roomRef = doc(this.db, 'rooms', this.currentRoom);
      const docSnapshot = await getDoc(roomRef);
      
      if (!docSnapshot.exists()) {
        return null;
      }
      
      return docSnapshot.data() as RoomData;
    }
    
    /**
     * Update the state of the current room
     * @param updates Partial state updates to apply
     * @returns Promise that resolves when update is complete
     */
    async updateRoomState(updates: Record<string, any>): Promise<void> {
      this._requireAuth();
      this._requireRoom();
      
      const roomRef = doc(this.db, 'rooms', this.currentRoom!);
      return updateDoc(roomRef, {
        state: updates
      });
    }
    
    /**
     * Send data to all members in the room
     * @param data The data to broadcast
     * @param type The type/category of the data
     * @returns Promise resolving to message ID
     */
    async broadcastData(data: any, type: string = 'data'): Promise<string> {
      this._requireAuth();
      this._requireRoom();
      
      const message = {
        senderId: this.currentUser!.uid,
        senderName: this.currentUser!.displayName || 'Anonymous',
        content: data,
        type: type,
        timestamp: serverTimestamp()
      };
      
      const messagesCollection = collection(this.db, 'rooms', this.currentRoom!, 'messages');
      const docRef = await addDoc(messagesCollection, message);
      return docRef.id;
    }
    
    /**
     * Check if user is currently in a room
     * @returns boolean indicating if user is in a room
     */
    isInRoom(): boolean {
      return !!this.currentRoom;
    }
    
    /**
     * Get the ID of the current room
     * @returns The current room ID or null
     */
    getCurrentRoomId(): string | null {
      return this.currentRoom;
    }
    
    // =========== Event Listeners ===========
    
    /**
     * Register an event listener
     * @param event The event type to listen for
     * @param callback The callback function
     */
    on(event: EventType, callback: EventListener): void {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      
      this.listeners[event].push(callback);
    }
    
    /**
     * Remove an event listener
     * @param event The event type
     * @param callback The callback function to remove
     */
    off(event: EventType, callback: EventListener): void {
      if (!this.listeners[event]) {
        return;
      }
      
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    
    // =========== Private Methods ===========
    
    /**
     * Internal method to join a room
     * @param roomId Room ID to join
     * @returns Promise resolving to room data
     */
    private async _joinRoomById(roomId: string): Promise<RoomData> {
      // Leave current room if any
      if (this.currentRoom) {
        await this.leaveRoom();
      }
      
      const roomRef = doc(this.db, 'rooms', roomId);
      
      // Add user to members
      await updateDoc(roomRef, {
        members: arrayUnion(this.currentUser!.uid),
        [`memberData.${this.currentUser!.uid}`]: {
          joinedAt: serverTimestamp(),
          displayName: this.currentUser!.displayName || 'Anonymous',
          photoURL: this.currentUser!.photoURL || null
        }
      });
      
      // Set current room and subscribe to changes
      this.currentRoom = roomId;
      
      // Subscribe to room changes
      this.unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
        const roomData = docSnap.data() as RoomData;
        this._notifyListeners('roomStateChanged', roomData);
      });
      
      // Subscribe to real-time messages
      const messagesCollection = collection(this.db, 'rooms', roomId, 'messages');
      const messagesQuery = query(
        messagesCollection,
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      this.unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const message = {
              id: change.doc.id,
              ...change.doc.data()
            } as RoomMessage;
            
            this._notifyListeners('dataReceived', message);
          }
        });
      });
      
      // Return room data
      const docSnap = await getDoc(roomRef);
      return docSnap.data() as RoomData;
    }
    
    /**
     * Notify all listeners for a specific event
     * @param event The event type
     * @param data The event data
     */
    private _notifyListeners(event: EventType, data: any): void {
      if (!this.listeners[event]) {
        return;
      }
      
      for (const callback of this.listeners[event]) {
        callback(data);
      }
    }
    
    /**
     * Check if user is authenticated and throw if not
     */
    private _requireAuth(): void {
      if (!this.currentUser) {
        throw new Error('Authentication required. Please sign in first.');
      }
    }
    
    /**
     * Check if user is in a room and throw if not
     */
    private _requireRoom(): void {
      if (!this.currentRoom) {
        throw new Error('Room required. Please join or create a room first.');
      }
    }
  }
  
  export default FirebaseRoomsSDK;
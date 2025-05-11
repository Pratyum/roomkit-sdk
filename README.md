# Firebase Rooms SDK

A TypeScript SDK for creating and managing real-time rooms using Firebase. This SDK provides simple methods for authentication, room creation/joining, state management, and real-time data sharing between room members.

## Features

- 🔐 **Authentication**: Email/password, anonymous sign-in
- 👤 **User Management**: Nickname customization, auto-generated names for anonymous users
- 🚪 **Room Management**: Create, join, and leave rooms
- 👑 **Host Controls**: Kick members, promote members to hosts
- 🔄 **Real-time State**: Get and update room state
- 📡 **Data Broadcasting**: Share data with all room members
- 📊 **Event System**: Subscribe to auth, room state, and data events


## Installation

```bash
# Using npm
npm install firebase-rooms-sdk firebase

# Using yarn
yarn add firebase-rooms-sdk firebase

# Using pnpm
pnpm add firebase-rooms-sdk firebase
```

**Note**: Firebase is a peer dependency. You need to install it separately.

## Firebase Configuration

You need to set up the following in your Firebase project:

1. Enable Authentication (Email/Password and Anonymous methods)
2. Create a Firestore database with the following security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null && 
        (resource.data.members.hasAny([request.auth.uid]) || 
         !resource.data.settings.isPrivate);
      
      match /messages/{messageId} {
        allow read: if request.auth != null && 
          get(/databases/$(database)/documents/rooms/$(roomId)).data.members.hasAny([request.auth.uid]);
        allow create: if request.auth != null && 
          get(/databases/$(database)/documents/rooms/$(roomId)).data.members.hasAny([request.auth.uid]);
      }
    }
  }
}
```

## Usage

### Authentication and User Management

```typescript
// Sign in with email and password
await roomsSDK.signInWithEmail('user@example.com', 'password123');

// Create a new user
await roomsSDK.createUserWithEmail('newuser@example.com', 'newpassword123');

// Sign in anonymously (gets an auto-generated nickname)
await roomsSDK.signInAnonymously();

// Update nickname
await roomsSDK.updateNickname('CoolUser42');

// Sign out
await roomsSDK.signOut();
```

### Room Management

```typescript
// Create a new room
const roomId = await roomsSDK.createRoom({
  maxMembers: 5,
  isPrivate: true,
  metadata: {
    name: 'My Room',
    topic: 'General'
  },
  initialState: {
    gameStarted: false,
    score: 0
  }
});

// Join an existing room
await roomsSDK.joinRoom('roomId123');

// Leave the current room
await roomsSDK.leaveRoom();

// Get the current room state
const roomState = await roomsSDK.getRoomState();

// Get all room members
const members = await roomsSDK.getRoomMembers();
```

### Host Controls

```typescript
// Check if current user is a host
const isHost = await roomsSDK.isHost();

// Kick a user from the room (host only)
await roomsSDK.kickMember('userId123');

// Promote a user to host (host only)
await roomsSDK.promoteToHost('userId456');
```

### Room State and Communication

```typescript
// Update room state
await roomsSDK.updateRoomState({
  gameStarted: true,
  score: 100,
  currentPlayer: 'user123'
});

// Broadcast data to all room members
await roomsSDK.broadcastData({
  message: 'Hello everyone!',
  timestamp: new Date().toISOString()
}, 'chat');
```

### Event Listeners

```typescript
// Listen for authentication changes
roomsSDK.on('authStateChanged', (user) => {
  console.log('Auth state changed:', user);
});

// Listen for room state changes
roomsSDK.on('roomStateChanged', (roomData) => {
  console.log('Room state updated:', roomData);
  
  // Access member data
  Object.entries(roomData.memberData).forEach(([userId, memberData]) => {
    console.log(`${memberData.displayName} is ${memberData.isHost ? 'a host' : 'a regular member'}`);
  });
});

// Listen for incoming data from room members
roomsSDK.on('dataReceived', (message) => {
  if (message.type === 'system') {
    // Handle system events (kicks, promotions, etc.)
    const { action, userId } = message.content;
    console.log(`System event: ${action}`);
  } else {
    console.log(`Message from ${message.senderName}: ${message.content}`);
  }
});

// Remove event listeners
const myCallback = (data) => console.log(data);
roomsSDK.off('dataReceived', myCallback);
```

## API Reference

### Authentication Methods

- `signInWithEmail(email: string, password: string)`: Sign in with email/password
- `createUserWithEmail(email: string, password: string)`: Create a new user
- `signInAnonymously()`: Sign in without credentials (auto-generates a fun nickname)
- `updateNickname(nickname: string)`: Update user's display name
- `signOut()`: Sign out the current user
- `isSignedIn()`: Check if a user is signed in
- `getCurrentUser()`: Get the current user object

### Room Methods

- `createRoom(settings?: RoomSettings)`: Create a new room
- `joinRoom(roomId: string)`: Join an existing room
- `leaveRoom()`: Leave the current room
- `getRoomState()`: Get the current room state
- `updateRoomState(updates: Record<string, any>)`: Update room state
- `broadcastData(data: any, type?: string)`: Send data to all room members
- `isInRoom()`: Check if user is in a room
- `getCurrentRoomId()`: Get the current room ID
- `getRoomMembers()`: Get all members in the current room

### Host Control Methods

- `isHost()`: Check if current user is the host
- `kickMember(userId: string)`: Remove a user from the room (host only)
- `promoteToHost(userId: string)`: Give another user host privileges (host only)

### Event Methods

- `on(event: EventType, callback: EventListener)`: Register an event listener
- `off(event: EventType, callback: EventListener)`: Remove an event listener

## TypeScript Interfaces

The SDK provides the following TypeScript interfaces:

- `FirebaseConfig`: Firebase configuration
- `RoomSettings`: Room creation settings
- `RoomData`: Room state structure
- `MemberData`: Room member information (including host status)
- `RoomMessage`: Message/data structure
- `EventType`: Available event types ('authStateChanged', 'roomStateChanged', 'dataReceived')
- `EventListener`: Event callback function type

## Error Handling

The SDK throws errors in the following situations:

- Missing Firebase configuration
- Authentication required for an operation
- Room required for an operation
- Host privileges required for an operation
- Room does not exist
- Other Firebase errors

Always wrap SDK calls in try/catch blocks for proper error handling.

## License

MIT
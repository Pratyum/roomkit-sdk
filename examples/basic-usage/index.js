// Example usage of the Firebase Rooms SDK
const { FirebaseRoomsSDK } = require('firebase-rooms-sdk');

// Your Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize the SDK
const roomsSDK = new FirebaseRoomsSDK(firebaseConfig);

// Add event listeners
roomsSDK.on('authStateChanged', (user) => {
  console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
});

roomsSDK.on('roomStateChanged', (roomData) => {
  console.log('Room state updated:', roomData);
});

roomsSDK.on('dataReceived', (message) => {
  console.log('New data received:', message);
});

// Example async function to demonstrate the SDK usage
async function runExample() {
  try {
    // 1. Sign in anonymously (will get a generated nickname)
    console.log('Signing in anonymously...');
    await roomsSDK.signInAnonymously();
    console.log(`Signed in as: ${roomsSDK.getCurrentUser()?.displayName}`);
    
    // 2. Change nickname
    console.log('Updating nickname...');
    await roomsSDK.updateNickname('CoolUser42');
    console.log(`Nickname updated to: ${roomsSDK.getCurrentUser()?.displayName}`);
    
    // 3. Create a room as host
    console.log('Creating a room...');
    const roomId = await roomsSDK.createRoom({
      maxMembers: 5,
      isPrivate: false,
      metadata: {
        name: 'Example Room',
        description: 'A test room for nickname and kick features'
      }
    });
    console.log(`Room created with ID: ${roomId}`);
    
    // 4. Check if user is host (should be true)
    const isHost = await roomsSDK.isHost();
    console.log(`Is current user a host? ${isHost}`);
    
    // 5. Get room members
    const members = await roomsSDK.getRoomMembers();
    console.log('Room members:', members);
    
    // 6. Simulate another user joining (in real app, this would be done by another user)
    console.log('\nSimulating another user joining...');
    console.log('In a real application, this would be a separate user connecting');
    console.log('For demo purposes, imagine user "GuestUser123" with ID "guest-123" joined the room');
    
    // 7. Simulate kicking a user (in real app, this would be a valid user ID)
    console.log('\nSimulating kicking a user...');
    try {
      // This will fail since user doesn't exist, but shows the API usage
      await roomsSDK.kickMember('guest-123');
    } catch (error) {
      console.log('Kick failed as expected in this demo since user does not exist');
      console.log('In a real app with actual users, this would kick the specified user');
    }
    
    // 8. Wait for a moment to see events
    console.log('\nWaiting for events...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 9. Leave the room and sign out
    console.log('\nLeaving room and signing out...');
    await roomsSDK.leaveRoom();
    await roomsSDK.signOut();
    console.log('Completed successfully');
    
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
runExample();
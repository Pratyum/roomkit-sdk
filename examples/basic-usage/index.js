// Example usage of the Firebase Rooms SDK
const { FirebaseRoomsSDK } = require('firebase-rooms-sdk');

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBRtZuv-lX960GLgt7pp9ml_NGXurXRY_Y",
    authDomain: "superfight-online.firebaseapp.com",
    projectId: "superfight-online",
    storageBucket: "superfight-online.firebasestorage.app",
    messagingSenderId: "765035471548",
    appId: "1:765035471548:web:4048e1d48fb6acdfa1e6b9",
    measurementId: "G-TQTYJRLSE6"
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
    // 1. Sign in anonymously
    console.log('Signing in anonymously...');
    await roomsSDK.signInAnonymously();
    console.log('Signed in successfully!');
    
    // 2. Create a room
    console.log('Creating a room...');
    const roomId = await roomsSDK.createRoom({
      maxMembers: 5,
      isPrivate: false,
      metadata: {
        name: 'Example Room',
        description: 'A test room created from the example'
      },
      initialState: {
        messages: [],
        lastActivity: new Date().toISOString()
      }
    });
    console.log(`Room created with ID: ${roomId}`);
    
    // 3. Send a message to the room
    console.log('Sending a message...');
    await roomsSDK.broadcastData({
      text: 'Hello from the example app!',
      timestamp: new Date().toISOString()
    }, 'chat');
    console.log('Message sent successfully');
    
    // 4. Update room state
    console.log('Updating room state...');
    await roomsSDK.updateRoomState({
      lastActivity: new Date().toISOString(),
      activeUsers: 1
    });
    console.log('Room state updated');
    
    // 5. Wait for a moment to see events
    console.log('Waiting for events...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Leave the room
    console.log('Leaving room...');
    await roomsSDK.leaveRoom();
    console.log('Left room successfully');
    
    // 7. Sign out
    console.log('Signing out...');
    await roomsSDK.signOut();
    console.log('Signed out successfully');
    
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
runExample();
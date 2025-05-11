export const generateRoomCode = (length: number = 6): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
  
export const isValidRoomId = (roomId: string): boolean => {
// Basic validation - check if string is non-empty and matches expected format
return Boolean(roomId && /^[A-Za-z0-9]{1,50}$/.test(roomId));
};

export const generateNickname = (): string => {
  const adjectives = [
      'Happy', 'Swift', 'Clever', 'Brave', 'Calm', 'Eager', 'Gentle', 'Jolly',
      'Lively', 'Proud', 'Wise', 'Lucky', 'Witty', 'Zany', 'Daring', 'Mighty',
      'Noble', 'Fancy', 'Nimble', 'Radiant', 'Vibrant', 'Sunny', 'Epic', 'Cosmic',
      'Quirky', 'Bouncy', 'Spiffy', 'Stellar'
  ];

  const nouns = [
      'Panda', 'Tiger', 'Eagle', 'Shark', 'Wolf', 'Falcon', 'Fox', 'Dolphin',
      'Penguin', 'Lion', 'Owl', 'Unicorn', 'Dragon', 'Phoenix', 'Knight', 'Wizard',
      'Pioneer', 'Pilot', 'Ninja', 'Samurai', 'Captain', 'Explorer', 'Voyager', 'Ranger',
      'Traveler', 'Warrior', 'Hunter', 'Champion'
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomNoun}${randomNum}`;
};
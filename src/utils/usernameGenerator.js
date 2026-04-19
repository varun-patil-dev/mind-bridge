const adjectives = [
  'Calm', 'Quiet', 'Peaceful', 'Gentle', 'Serene', 'Tranquil', 'Soft', 'Warm',
  'Kind', 'Bright', 'Clear', 'Pure', 'Still', 'Light', 'Sweet', 'Cool',
  'Fresh', 'Steady', 'Mild', 'Safe', 'Hope', 'Grace', 'Brave', 'Strong'
];

const nouns = [
  'River', 'Sun', 'Moon', 'Star', 'Sky', 'Ocean', 'Lake', 'Mountain',
  'Forest', 'Garden', 'Meadow', 'Cloud', 'Breeze', 'Dawn', 'Dusk', 'Rain',
  'Snow', 'Wind', 'Wave', 'Tree', 'Flower', 'Stone', 'Path', 'Harbor'
];

export const generateUsername = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  
  return `${adjective}${noun}${number}`;
};

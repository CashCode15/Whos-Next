export const ICEBREAKERS = [
  "What's one place you'd travel to tomorrow?",
  "What's the best thing you've watched recently?",
  "What game are you playing right now?",
  "What's a song you've replayed way too much?",
  "Coffee, tea, or something stranger?",
  "What's the last thing that made you laugh out loud?",
  "If you could instantly learn one skill, what would it be?",
  "What's an underrated place in your city?",
  "Early bird or up-all-night type?",
  "What's the weirdest food combo you actually like?",
];

export function randomIcebreaker(exclude?: string): string {
  const pool = ICEBREAKERS.filter((q) => q !== exclude);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

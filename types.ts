export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface UnitData {
  id: string;
  x: number;
  z: number;
  speed: number;
  active: boolean;
  type: 'REQUIRED' | 'BONUS'; // Future proofing, currently all are required
}

export const LANE_WIDTH = 2.5; // Width of playable area
export const SPAWN_DISTANCE = -30; // Where units appear
export const PLAYER_Z = 5; // Where the player is
export const GAME_SPEED_BASE = 15;

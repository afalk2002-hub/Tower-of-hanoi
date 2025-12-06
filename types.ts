export type Disk = number; // The size of the disk

export type TowerId = 0 | 1 | 2;

export interface Move {
  from: TowerId;
  to: TowerId;
  diskSize?: number; // Added to track which disk is being moved in the solution
  explanation?: string; // Added to describe the recursive step
}

export interface GameState {
  towers: Disk[][];
  moveCount: number;
  isSolving: boolean;
  diskCount: number;
  selectedTower: TowerId | null;
  solutionQueue: Move[];
}

export interface AiResponse {
  explanation: string;
  nextMoveHint?: string;
}
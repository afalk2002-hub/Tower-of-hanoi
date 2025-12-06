import { Move, TowerId } from '../types';

/**
 * pure recursive function to generate the sequence of moves
 * to solve the Tower of Hanoi puzzle.
 * 
 * @param n Number of disks
 * @param source Source tower index
 * @param target Target tower index
 * @param auxiliary Auxiliary tower index
 * @returns Array of Move objects
 */
export const getRecursiveSolution = (
  n: number,
  source: TowerId,
  target: TowerId,
  auxiliary: TowerId
): Move[] => {
  // Base case: If no disks to move, return empty list
  if (n === 0) {
    return [];
  }

  const moves: Move[] = [];

  // Step 1: Recursively move n-1 disks from source to auxiliary
  moves.push(...getRecursiveSolution(n - 1, source, auxiliary, target));

  // Step 2: Move the nth disk from source to target
  // We add metadata here to visualize the recursion steps in the UI
  moves.push({ 
    from: source, 
    to: target,
    diskSize: n,
    explanation: `Move disk ${n} from Tower ${source} to Tower ${target}`
  });

  // Step 3: Recursively move the n-1 disks from auxiliary to target
  moves.push(...getRecursiveSolution(n - 1, auxiliary, target, source));

  return moves;
};
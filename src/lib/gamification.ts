/**
 * Gamification utility functions
 * Formula: Level = floor(sqrt(XP / 100)) + 1
 */

/**
 * Calculate user level based on XP
 * New formula: L = floor(sqrt(XP / 100)) + 1
 */
export function calculateLevel(xp: number): number {
  if (!xp || xp < 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Get the minimum XP required to reach a specific level
 * Inverse: XP = (level - 1)^2 * 100
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Get XP required to reach the next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return getXPForLevel(currentLevel + 1);
}

/**
 * Calculate level progress percentage and related stats
 */
export function getLevelProgress(xp: number) {
  const currentLevel = calculateLevel(xp);
  const xpCurrentLevelStart = getXPForLevel(currentLevel);
  const xpNextLevelStart = getXPForLevel(currentLevel + 1);

  const xpInCurrentLevel = xp - xpCurrentLevelStart;
  const xpRequiredForLevelUp = xpNextLevelStart - xpCurrentLevelStart;

  const progressPercentage = Math.min(
    100,
    Math.max(0, (xpInCurrentLevel / xpRequiredForLevelUp) * 100)
  );

  return {
    currentLevel,
    progressPercentage,
    xpInCurrentLevel,
    xpRequiredForLevelUp,
    xpRemaining: xpRequiredForLevelUp - xpInCurrentLevel,
    totalXP: xp
  };
}


import { describe, it, expect } from 'vitest';
import { calculateLevel, getXPForLevel, getLevelProgress } from '../gamification';

describe('Gamification Logic', () => {
    describe('calculateLevel', () => {
        it('should return level 1 for 0 XP', () => {
            expect(calculateLevel(0)).toBe(1);
        });

        it('should return level 1 for negative XP', () => {
            expect(calculateLevel(-50)).toBe(1);
        });

        it('should return level 2 for 100 XP', () => {
            expect(calculateLevel(100)).toBe(2);
        });

        it('should return level 3 for 400 XP', () => {
            expect(calculateLevel(400)).toBe(3);
        });

        it('should return level 4 for 900 XP', () => {
            expect(calculateLevel(900)).toBe(4);
        });
    });

    describe('getXPForLevel', () => {
        it('should return 0 XP for level 1', () => {
            expect(getXPForLevel(1)).toBe(0);
        });

        it('should return 100 XP for level 2', () => {
            expect(getXPForLevel(2)).toBe(100);
        });

        it('should return 400 XP for level 3', () => {
            expect(getXPForLevel(3)).toBe(400);
        });
    });

    describe('getLevelProgress', () => {
        it('should calculate correct progress at start of level', () => {
            const progress = getLevelProgress(100);
            expect(progress.currentLevel).toBe(2);
            expect(progress.progressPercentage).toBe(0);
        });

        it('should calculate 50% progress between levels 2 and 3', () => {
            // Level 2 starts at 100 XP, Level 3 starts at 400 XP
            // Midpoint: 100 + (400 - 100) * 0.5 = 250 XP
            const progress = getLevelProgress(250);
            expect(progress.currentLevel).toBe(2);
            expect(progress.progressPercentage).toBe(50);
        });

        it('should have correct remaining XP', () => {
            const progress = getLevelProgress(300);
            expect(progress.xpRemaining).toBe(100); // 400 - 300
        });
    });
});

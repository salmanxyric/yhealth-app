import { describe, it, expect } from '@jest/globals';
import {
  deriveArchetypeLabel,
  isHourInReceptiveWindows,
} from '../../../src/services/timing-profile.service.js';

describe('timing-profile helpers', () => {
  describe('deriveArchetypeLabel', () => {
    it('returns morning_person for mid-morning peak', () => {
      expect(deriveArchetypeLabel(8)).toBe('morning_person');
    });
    it('returns midday_person for early afternoon', () => {
      expect(deriveArchetypeLabel(14)).toBe('midday_person');
    });
    it('returns evening_person for evening peak', () => {
      expect(deriveArchetypeLabel(19)).toBe('evening_person');
    });
    it('returns night_owl for late night', () => {
      expect(deriveArchetypeLabel(2)).toBe('night_owl');
    });
    it('normalizes negative hours', () => {
      expect(deriveArchetypeLabel(-1)).toBe('night_owl');
    });
  });

  describe('isHourInReceptiveWindows', () => {
    it('is true for peak and peak±1', () => {
      expect(isHourInReceptiveWindows(10, 10, 15)).toBe(true);
      expect(isHourInReceptiveWindows(9, 10, 15)).toBe(true);
      expect(isHourInReceptiveWindows(11, 10, 15)).toBe(true);
    });
    it('wraps midnight for peak 23', () => {
      expect(isHourInReceptiveWindows(0, 23, 12)).toBe(true);
      expect(isHourInReceptiveWindows(22, 23, 12)).toBe(true);
    });
    it('is false far from both peaks', () => {
      expect(isHourInReceptiveWindows(5, 14, 20)).toBe(false);
    });
  });
});

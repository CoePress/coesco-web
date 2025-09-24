// Time calculation and manipulation utilities
// Ported from RoundingService.cs and EditHoursService.cs

import { Hours, TimeSpan, ValidationResult } from '../types/time-tracking.types';

export class TimeCalculationService {
  private readonly ROUND_MINUTES = 3;

  /**
   * Round time to nearest 3 minutes (ported from RoundingService.RoundTime)
   * @param actualTime - The actual time to round
   * @returns Rounded time
   */
  roundTime(actualTime: Date): Date {
    const roundParam = this.ROUND_MINUTES * 60 * 1000; // 3 minutes in milliseconds
    const roundedTime = new Date(
      Math.round((actualTime.getTime() + roundParam / 2 + 1) / roundParam) * roundParam
    );
    return roundedTime;
  }

  /**
   * Calculate total minutes between two times
   * @param timeIn - Start time
   * @param timeOut - End time  
   * @returns Total minutes
   */
  calculateMinutes(timeIn: Date, timeOut: Date): number {
    if (timeOut.getTime() === 0) {
      // Still clocked in - calculate from timeIn to now
      return Math.round((Date.now() - timeIn.getTime()) / (1000 * 60));
    }
    return Math.round((timeOut.getTime() - timeIn.getTime()) / (1000 * 60));
  }

  /**
   * Calculate hours from minutes
   * @param minutes - Total minutes
   * @returns Hours as decimal
   */
  minutesToHours(minutes: number): number {
    return Number((minutes / 60).toFixed(2));
  }

  /**
   * Validate time overlap between jobs (ported from EditHoursService.ValidateNewTime)
   * @param currentHour - The hour being validated
   * @param allHours - All hours for comparison
   * @param newTime - The new time being set
   * @param isTimeIn - True if validating time in, false for time out
   * @returns Validation result
   */
  validateTimeOverlap(
    currentHour: Hours,
    allHours: Hours[],
    newTime: Date,
    isTimeIn: boolean
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const currentTimeIn = new Date(currentHour.timeIn || '');
    const currentTimeOut = new Date(currentHour.timeOut || '');

    // Get earliest and latest times across all jobs
    const times = allHours.map(h => [new Date(h.timeIn || ''), new Date(h.timeOut || '')]).flat();
    const earliestTime = new Date(Math.min(...times.map(t => t.getTime())));
    const latestTime = new Date(Math.max(...times.map(t => t.getTime())));

    // Check if new time is within overall bounds
    if (newTime < earliestTime || newTime > latestTime) {
      result.isValid = false;
      result.errors.push('Time must be within the range of all job times');
      return result;
    }

    // Validate time in
    if (isTimeIn) {
      if (currentTimeOut.getTime() > 0 && newTime >= currentTimeOut) {
        result.isValid = false;
        result.errors.push('Time in must be before time out');
      }

      // Find nearest job that ends before this one starts
      const nearestJob = this.findNearestPreviousJob(currentHour, allHours);
      if (nearestJob && new Date(nearestJob.timeOut || '') > newTime) {
        result.isValid = false;
        result.errors.push('Time in conflicts with previous job');
      }
    }
    // Validate time out
    else {
      if (newTime <= currentTimeIn) {
        result.isValid = false;
        result.errors.push('Time out must be after time in');
      }

      // Find nearest job that starts after this one ends
      const nearestJob = this.findNearestNextJob(currentHour, allHours);
      if (nearestJob && new Date(nearestJob.timeIn || '') < newTime) {
        result.isValid = false;
        result.errors.push('Time out conflicts with next job');
      }
    }

    return result;
  }

  /**
   * Check if split hours is viable (ported from SplitHoursPage.DetermineSplitViability)
   * @param timeIn - Start time
   * @param timeOut - End time
   * @param numSplits - Number of splits
   * @returns True if split is viable
   */
  isSplitViable(timeIn: Date, timeOut: Date, numSplits: number): boolean {
    if (timeIn.getTime() === 0 || timeOut.getTime() === 0) {
      return false;
    }

    const totalMinutes = this.calculateMinutes(timeIn, timeOut);

    if (totalMinutes === 0) {
      return false;
    }

    // Check if split results in intervals divisible by 3 minutes
    return (totalMinutes / numSplits) % 3 === 0;
  }

  /**
   * Split hours into equal parts (ported from EditHoursService.SplitUnchangedHours)
   * @param originalHour - The hour to split
   * @param numSplits - Number of splits
   * @returns Array of split hours
   */
  splitHours(originalHour: Hours, numSplits: number): Hours[] {
    const timeIn = new Date(originalHour.timeIn || '');
    const timeOut = new Date(originalHour.timeOut || '');
    const actualTimeIn = new Date(originalHour.actualTimeIn || '');
    const actualTimeOut = new Date(originalHour.actualTimeOut || '');

    if (!this.isSplitViable(timeIn, timeOut, numSplits)) {
      throw new Error('Split is not viable - time difference must be divisible by 3 minutes');
    }

    const totalMinutes = this.calculateMinutes(timeIn, timeOut);
    const minutesPerSplit = totalMinutes / numSplits;
    const splitHours: Hours[] = [];

    for (let i = 0; i < numSplits; i++) {
      const splitTimeIn = new Date(timeIn.getTime() + (i * minutesPerSplit * 60 * 1000));
      const splitTimeOut = i === numSplits - 1
        ? timeOut // Last split uses original end time
        : new Date(timeIn.getTime() + ((i + 1) * minutesPerSplit * 60 * 1000));

      const splitActualTimeIn = new Date(actualTimeIn.getTime() + (i * minutesPerSplit * 60 * 1000));
      const splitActualTimeOut = i === numSplits - 1
        ? actualTimeOut
        : new Date(actualTimeIn.getTime() + ((i + 1) * minutesPerSplit * 60 * 1000));

      const splitHour: Hours = {
        ...originalHour,
        id: `${originalHour.id}_split_${i + 1}`,
        timeIn: splitTimeIn.toISOString(),
        timeOut: splitTimeOut.toISOString(),
        actualTimeIn: splitActualTimeIn.toISOString(),
        actualTimeOut: splitActualTimeOut.toISOString(),
        timeInDT: splitTimeIn,
        timeOutDT: splitTimeOut,
        displayTimeOut: splitTimeOut.toLocaleString(),
        hours: this.minutesToHours(minutesPerSplit).toString()
      };

      splitHours.push(splitHour);
    }

    return splitHours;
  }

  /**
   * Calculate day total hours for an employee
   * @param hours - Array of hours for the day
   * @returns Total hours for the day
   */
  calculateDayTotal(hours: Hours[]): number {
    return hours.reduce((total, hour) => {
      const hoursWorked = parseFloat(hour.hours || '0');
      return total + (isNaN(hoursWorked) ? 0 : hoursWorked);
    }, 0);
  }

  /**
   * Calculate week total hours for an employee
   * @param hours - Array of hours for the week
   * @returns Total hours for the week
   */
  calculateWeekTotal(hours: Hours[]): number {
    return this.calculateDayTotal(hours); // Same logic, different scope
  }

  private findNearestPreviousJob(currentHour: Hours, allHours: Hours[]): Hours | null {
    const currentStart = new Date(currentHour.timeIn || '').getTime();

    return allHours
      .filter(h => h.id !== currentHour.id)
      .filter(h => new Date(h.timeOut || '').getTime() <= currentStart)
      .sort((a, b) => new Date(b.timeOut || '').getTime() - new Date(a.timeOut || '').getTime())[0] || null;
  }

  private findNearestNextJob(currentHour: Hours, allHours: Hours[]): Hours | null {
    const currentEnd = new Date(currentHour.timeOut || '').getTime();

    return allHours
      .filter(h => h.id !== currentHour.id)
      .filter(h => new Date(h.timeIn || '').getTime() >= currentEnd)
      .sort((a, b) => new Date(a.timeIn || '').getTime() - new Date(b.timeIn || '').getTime())[0] || null;
  }
}

// Export singleton instance
export const timeCalculationService = new TimeCalculationService();

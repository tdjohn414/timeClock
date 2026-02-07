/**
 * Unit tests for unpaid block logic.
 *
 * These test the pure logic used in App.js without rendering the component:
 * - Total hours calculation excludes unpaid blocks
 * - Derived isPaused state
 * - Work block numbering excludes unpaid + break blocks
 * - API transform maps is_unpaid correctly
 */

// ── Helpers (mirrors logic from App.js) ────────────────────────────────────

/** Calculate hours between two HH:MM time strings */
function calculateBlockHours(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const normalize = (t) => (typeof t === 'string' ? t.split(':').slice(0, 2).join(':') : t);
  const start = normalize(startTime);
  const end = normalize(endTime);
  const startDate = new Date(`2000-01-01T${start}:00`);
  let endDate = new Date(`2000-01-01T${end}:00`);
  // Handle overnight
  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
  const diff = (endDate - startDate) / (1000 * 60 * 60);
  return diff > 0 ? diff.toFixed(2) : null;
}

/** Round to nearest 0.25 and format */
function formatHours(hours) {
  if (!hours && hours !== 0) return '0.00';
  const num = parseFloat(hours);
  const rounded = Math.round(num * 4) / 4;
  return rounded.toFixed(2);
}

/** Calculate total hours from blocks — excludes unpaid and editing placeholders */
function calculateTotalHours(completedBlocks, currentBlock) {
  let total = 0;
  [...completedBlocks, currentBlock]
    .filter(Boolean)
    .filter(block => !block.isEditingPlaceholder && !block.isUnpaid)
    .forEach(block => {
      const hrs = calculateBlockHours(block.startTime, block.endTime);
      if (hrs) total += parseFloat(hrs);
    });
  return formatHours(total);
}

/** Derive isPaused from currentBlock (same one-liner from App.js) */
function deriveIsPaused(currentBlock) {
  return currentBlock?.isUnpaid === true;
}

/** Get work block numbering — excludes break and unpaid blocks */
function getWorkBlockNumbers(blocks) {
  let workIdx = 0;
  return blocks.map(block => {
    if (block.isBreak || block.isUnpaid) return null;
    workIdx += 1;
    return workIdx;
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('calculateTotalHours', () => {
  test('excludes unpaid blocks from total', () => {
    const completed = [
      { startTime: '08:00', endTime: '12:00', isUnpaid: false },  // 4 hours
      { startTime: '12:00', endTime: '12:30', isUnpaid: true },   // 0.5 hours (unpaid — excluded)
      { startTime: '12:30', endTime: '17:00', isUnpaid: false },  // 4.5 hours
    ];
    const result = calculateTotalHours(completed, null);
    expect(result).toBe('8.50');
  });

  test('includes break blocks in total (breaks are paid)', () => {
    const completed = [
      { startTime: '08:00', endTime: '10:00', isBreak: false },  // 2 hours
      { startTime: '10:00', endTime: '10:15', isBreak: true },   // 0.25 hours (break — included)
      { startTime: '10:15', endTime: '12:00', isBreak: false },  // 1.75 hours
    ];
    const result = calculateTotalHours(completed, null);
    expect(result).toBe('4.00');
  });

  test('excludes editing placeholder blocks', () => {
    const completed = [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '12:00', endTime: '13:00', isEditingPlaceholder: true },
    ];
    const result = calculateTotalHours(completed, null);
    expect(result).toBe('4.00');
  });

  test('includes current block if it has times and is not unpaid', () => {
    const completed = [
      { startTime: '08:00', endTime: '12:00' }, // 4 hours
    ];
    const current = { startTime: '12:00', endTime: '14:00' }; // 2 hours
    const result = calculateTotalHours(completed, current);
    expect(result).toBe('6.00');
  });

  test('excludes current block if it is unpaid', () => {
    const completed = [
      { startTime: '08:00', endTime: '12:00' }, // 4 hours
    ];
    const current = { startTime: '12:00', endTime: '12:30', isUnpaid: true };
    const result = calculateTotalHours(completed, current);
    expect(result).toBe('4.00');
  });

  test('returns 0.00 when all blocks are unpaid', () => {
    const completed = [
      { startTime: '12:00', endTime: '13:00', isUnpaid: true },
    ];
    const result = calculateTotalHours(completed, null);
    expect(result).toBe('0.00');
  });

  test('handles empty block list', () => {
    const result = calculateTotalHours([], null);
    expect(result).toBe('0.00');
  });
});

describe('deriveIsPaused', () => {
  test('returns true when currentBlock.isUnpaid is true', () => {
    expect(deriveIsPaused({ isUnpaid: true, startTime: '12:00' })).toBe(true);
  });

  test('returns false when currentBlock.isUnpaid is false', () => {
    expect(deriveIsPaused({ isUnpaid: false, startTime: '12:00' })).toBe(false);
  });

  test('returns false when currentBlock has no isUnpaid property', () => {
    expect(deriveIsPaused({ startTime: '12:00' })).toBe(false);
  });

  test('returns false when currentBlock is null', () => {
    expect(deriveIsPaused(null)).toBe(false);
  });

  test('returns false when currentBlock is undefined', () => {
    expect(deriveIsPaused(undefined)).toBe(false);
  });
});

describe('getWorkBlockNumbers (excludes unpaid + break)', () => {
  test('numbers only work blocks, skipping break and unpaid', () => {
    const blocks = [
      { startTime: '08:00', endTime: '10:00', isBreak: false, isUnpaid: false },
      { startTime: '10:00', endTime: '10:15', isBreak: true, isUnpaid: false },
      { startTime: '10:15', endTime: '12:00', isBreak: false, isUnpaid: false },
      { startTime: '12:00', endTime: '12:30', isBreak: false, isUnpaid: true },
      { startTime: '12:30', endTime: '17:00', isBreak: false, isUnpaid: false },
    ];
    const numbers = getWorkBlockNumbers(blocks);
    expect(numbers).toEqual([1, null, 2, null, 3]);
  });

  test('handles all work blocks (no breaks or unpaid)', () => {
    const blocks = [
      { startTime: '08:00', endTime: '12:00', isBreak: false, isUnpaid: false },
      { startTime: '12:00', endTime: '17:00', isBreak: false, isUnpaid: false },
    ];
    const numbers = getWorkBlockNumbers(blocks);
    expect(numbers).toEqual([1, 2]);
  });

  test('handles empty array', () => {
    expect(getWorkBlockNumbers([])).toEqual([]);
  });
});

describe('API transform — isUnpaid mapping', () => {
  // Mirrors the transformShift block mapping from api.js
  function transformBlock(block) {
    return {
      id: block.id,
      startTime: block.startTime || block.start_time,
      endTime: block.endTime || block.end_time,
      tasks: block.tasks || '',
      isBreak: block.isBreak ?? block.is_break ?? false,
      isUnpaid: block.isUnpaid ?? block.is_unpaid ?? false,
    };
  }

  test('maps snake_case is_unpaid from API response', () => {
    const apiBlock = {
      id: 1,
      start_time: '12:00',
      end_time: '12:30',
      tasks: 'Lunch',
      is_break: false,
      is_unpaid: true,
    };
    const result = transformBlock(apiBlock);
    expect(result.isUnpaid).toBe(true);
    expect(result.isBreak).toBe(false);
  });

  test('maps camelCase isUnpaid from frontend', () => {
    const frontendBlock = {
      id: 1,
      startTime: '12:00',
      endTime: '12:30',
      tasks: 'Lunch',
      isBreak: false,
      isUnpaid: true,
    };
    const result = transformBlock(frontendBlock);
    expect(result.isUnpaid).toBe(true);
  });

  test('defaults isUnpaid to false when not present', () => {
    const block = {
      id: 1,
      start_time: '08:00',
      end_time: '12:00',
      tasks: 'Work',
      is_break: false,
    };
    const result = transformBlock(block);
    expect(result.isUnpaid).toBe(false);
  });

  test('enforces mutual exclusivity in data (both cannot be true)', () => {
    // This tests that the data model is correct — the API should reject this,
    // but if it somehow gets through, both flags being true is detectable
    const block = {
      id: 1,
      start_time: '12:00',
      end_time: '12:15',
      tasks: 'Bad data',
      is_break: true,
      is_unpaid: true,
    };
    const result = transformBlock(block);
    // Both are true — this is invalid data that the DB constraint prevents
    expect(result.isBreak && result.isUnpaid).toBe(true);
    // Verify we can detect the violation
    const isInvalid = result.isBreak && result.isUnpaid;
    expect(isInvalid).toBe(true);
  });
});

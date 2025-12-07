// Nepali Calendar (Bikram Sambat) utilities
// Nepal Fiscal Year: Shrawan 1 to Ashadh 30 (mid-July to mid-July)

export const NEPALI_MONTHS = [
  'Baisakh',
  'Jestha', 
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra'
] as const;

export const NEPALI_MONTHS_SHORT = [
  'Bai', 'Jes', 'Ash', 'Shr', 'Bha', 'Asw', 
  'Kar', 'Man', 'Pou', 'Mag', 'Fal', 'Cha'
] as const;

// Days in each Nepali month by year (2080-2090 BS)
const NEPALI_YEAR_DAYS: Record<number, number[]> = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2084: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2086: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2088: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2089: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2090: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
};

// Reference date: 2080/01/01 BS = 2023/04/14 AD
const BS_REFERENCE = { year: 2080, month: 1, day: 1 };
const AD_REFERENCE = new Date(2023, 3, 14); // April 14, 2023

export interface NepaliDate {
  year: number;
  month: number;
  day: number;
}

export function adToBS(adDate: Date): NepaliDate {
  const diffDays = Math.floor(
    (adDate.getTime() - AD_REFERENCE.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let bsYear = BS_REFERENCE.year;
  let bsMonth = BS_REFERENCE.month;
  let bsDay = BS_REFERENCE.day;
  
  let remainingDays = diffDays;
  
  if (remainingDays >= 0) {
    // Forward calculation
    while (remainingDays > 0) {
      const daysInMonth = getDaysInNepaliMonth(bsYear, bsMonth);
      const daysLeftInMonth = daysInMonth - bsDay;
      
      if (remainingDays <= daysLeftInMonth) {
        bsDay += remainingDays;
        remainingDays = 0;
      } else {
        remainingDays -= (daysLeftInMonth + 1);
        bsMonth++;
        bsDay = 1;
        if (bsMonth > 12) {
          bsMonth = 1;
          bsYear++;
        }
      }
    }
  } else {
    // Backward calculation
    remainingDays = Math.abs(remainingDays);
    while (remainingDays > 0) {
      if (remainingDays < bsDay) {
        bsDay -= remainingDays;
        remainingDays = 0;
      } else {
        remainingDays -= bsDay;
        bsMonth--;
        if (bsMonth < 1) {
          bsMonth = 12;
          bsYear--;
        }
        bsDay = getDaysInNepaliMonth(bsYear, bsMonth);
      }
    }
  }
  
  return { year: bsYear, month: bsMonth, day: bsDay };
}

export function getDaysInNepaliMonth(year: number, month: number): number {
  if (NEPALI_YEAR_DAYS[year]) {
    return NEPALI_YEAR_DAYS[year][month - 1];
  }
  // Default days if year not in table
  return [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30][month - 1];
}

export function formatNepaliDate(date: Date): string {
  const bs = adToBS(date);
  return `${bs.day} ${NEPALI_MONTHS[bs.month - 1]} ${bs.year}`;
}

export function formatNepaliDateShort(date: Date): string {
  const bs = adToBS(date);
  return `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.day).padStart(2, '0')}`;
}

export function formatBothDates(date: Date): string {
  const adFormat = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const bsFormat = formatNepaliDate(date);
  return `${adFormat} (${bsFormat} BS)`;
}

// Nepal Fiscal Year utilities
// FY starts on Shrawan 1 (mid-July) and ends on Ashadh 30 (mid-July next year)

export function getCurrentNepaliDate(): NepaliDate {
  return adToBS(new Date());
}

export function getNepaliMonthName(month: number): string {
  return NEPALI_MONTHS[month - 1];
}

export function getFiscalYear(date: Date): string {
  const bs = adToBS(date);
  // Fiscal year starts from Shrawan (month 4)
  // If month is Shrawan (4) or later, FY is current BS year
  // If month is before Shrawan (1-3: Baisakh, Jestha, Ashadh), FY is previous BS year
  if (bs.month >= 4) {
    return `FY ${bs.year}/${bs.year + 1}`;
  } else {
    return `FY ${bs.year - 1}/${bs.year}`;
  }
}

export function getFiscalYearRange(date: Date): { start: Date; end: Date } {
  const bs = adToBS(date);
  let fyStartYear: number;
  
  if (bs.month >= 4) {
    fyStartYear = bs.year;
  } else {
    fyStartYear = bs.year - 1;
  }
  
  // Approximate: Shrawan 1 is around July 16-17
  // For simplicity, we'll use July 16 as FY start
  const fyStart = new Date(fyStartYear - 57, 6, 16); // BS 2080 = AD 2023
  const fyEnd = new Date(fyStartYear - 56, 6, 15);
  
  return { start: fyStart, end: fyEnd };
}

export function getNepaliMonthRange(year: number, month: number): { start: Date; end: Date } {
  // This is an approximation - for accurate conversion, would need full lookup table
  // Baisakh 1, 2080 = April 14, 2023
  const baseYear = 2080;
  const baseDate = new Date(2023, 3, 14);
  
  let totalDays = 0;
  
  // Calculate days from reference
  for (let y = baseYear; y < year; y++) {
    for (let m = 1; m <= 12; m++) {
      totalDays += getDaysInNepaliMonth(y, m);
    }
  }
  
  for (let m = 1; m < month; m++) {
    totalDays += getDaysInNepaliMonth(year, m);
  }
  
  const startDate = new Date(baseDate);
  startDate.setDate(startDate.getDate() + totalDays);
  
  const daysInMonth = getDaysInNepaliMonth(year, month);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysInMonth - 1);
  
  return { start: startDate, end: endDate };
}

// Get all months for a fiscal year
export function getFiscalYearMonths(fyYear: number): { month: number; year: number; name: string }[] {
  // FY 2080/81 means Shrawan 2080 to Ashadh 2081
  return [
    { month: 4, year: fyYear, name: 'Shrawan' },
    { month: 5, year: fyYear, name: 'Bhadra' },
    { month: 6, year: fyYear, name: 'Ashwin' },
    { month: 7, year: fyYear, name: 'Kartik' },
    { month: 8, year: fyYear, name: 'Mangsir' },
    { month: 9, year: fyYear, name: 'Poush' },
    { month: 10, year: fyYear, name: 'Magh' },
    { month: 11, year: fyYear, name: 'Falgun' },
    { month: 12, year: fyYear, name: 'Chaitra' },
    { month: 1, year: fyYear + 1, name: 'Baisakh' },
    { month: 2, year: fyYear + 1, name: 'Jestha' },
    { month: 3, year: fyYear + 1, name: 'Ashadh' },
  ];
}

/**
 * Age verification utility functions for ECA/LGPD compliance.
 * Handles robust, timezone-independent parsing, validation, and age calculation.
 */

export interface BirthDateParseResult {
    valid: boolean;
    error?: string;
    year?: number;
    month?: number;
    day?: number;
    formatted?: string;
}

/**
 * Parses and validates a birth date string in YYYY-MM-DD format.
 * Prevents timezone offset shifts and catches invalid dates like Feb 31st.
 */
export function parseAndValidateBirthDate(
    birthDateStr: string,
    referenceDate: Date = new Date()
): BirthDateParseResult {
    if (!birthDateStr || typeof birthDateStr !== "string") {
        return { valid: false, error: "Data de nascimento não fornecida." };
    }

    const parts = birthDateStr.trim().split("-");
    if (parts.length !== 3) {
        return { valid: false, error: "Formato de data inválido. Use AAAA-MM-DD." };
    }

    const [yearStr, monthStr, dayStr] = parts;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return { valid: false, error: "Data de nascimento inválida." };
    }

    if (month < 1 || month > 12) {
        return { valid: false, error: "Mês inválido." };
    }

    if (day < 1 || day > 31) {
        return { valid: false, error: "Dia inválido." };
    }

    // Check calendar validity (e.g. Feb 31st, April 31st) using local JS Date
    const checkDate = new Date(year, month - 1, day);
    if (
        checkDate.getFullYear() !== year ||
        checkDate.getMonth() !== month - 1 ||
        checkDate.getDate() !== day
    ) {
        return { valid: false, error: "Data inexistente no calendário." };
    }

    // Validate that birth date is not in the future
    const todayY = referenceDate.getFullYear();
    const todayM = referenceDate.getMonth() + 1;
    const todayD = referenceDate.getDate();

    if (
        year > todayY ||
        (year === todayY && month > todayM) ||
        (year === todayY && month === todayM && day > todayD)
    ) {
        return { valid: false, error: "Data de nascimento não pode ser no futuro." };
    }

    // Reasonable minimum year check (e.g. 120 years ago)
    if (year < todayY - 120) {
        return { valid: false, error: "Ano de nascimento muito antigo." };
    }

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formatted = `${year}-${pad(month)}-${pad(day)}`;

    return {
        valid: true,
        year,
        month,
        day,
        formatted,
    };
}

/**
 * Calculates exact age in years given birth date integers (year, month, day).
 * Deterministic and independent of server/client timezones.
 */
export function calculateAgeFromParts(
    year: number,
    month: number,
    day: number,
    referenceDate: Date = new Date()
): number {
    const todayY = referenceDate.getFullYear();
    const todayM = referenceDate.getMonth() + 1; // 1-12
    const todayD = referenceDate.getDate();

    let age = todayY - year;
    const monthDiff = todayM - month;

    if (monthDiff < 0 || (monthDiff === 0 && todayD < day)) {
        age--;
    }

    return Math.max(0, age);
}

/**
 * Returns true if age is 18 or older.
 */
export function isAdultAge(age: number): boolean {
    return age >= 18;
}

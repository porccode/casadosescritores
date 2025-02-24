import { describe, it, expect } from "vitest";
import {
    parseAndValidateBirthDate,
    calculateAgeFromParts,
    isAdultAge,
} from "../age-verification";

describe("Age Verification Library", () => {
    describe("parseAndValidateBirthDate", () => {
        const refDate = new Date(2026, 6, 28); // 2026-07-28 (July 28, 2026)

        it("validates a standard past birth date", () => {
            const res = parseAndValidateBirthDate("2000-05-15", refDate);
            expect(res.valid).toBe(true);
            expect(res.year).toBe(2000);
            expect(res.month).toBe(5);
            expect(res.day).toBe(15);
            expect(res.formatted).toBe("2000-05-15");
        });

        it("rejects invalid format or empty input", () => {
            expect(parseAndValidateBirthDate("", refDate).valid).toBe(false);
            expect(parseAndValidateBirthDate("2000/05/15", refDate).valid).toBe(false);
            expect(parseAndValidateBirthDate("invalid-date", refDate).valid).toBe(false);
        });

        it("rejects non-existent calendar dates like Feb 31st or Apr 31st", () => {
            const feb31 = parseAndValidateBirthDate("2024-02-31", refDate);
            expect(feb31.valid).toBe(false);
            expect(feb31.error).toBe("Data inexistente no calendário.");

            const apr31 = parseAndValidateBirthDate("2024-04-31", refDate);
            expect(apr31.valid).toBe(false);
            expect(apr31.error).toBe("Data inexistente no calendário.");
        });

        it("accepts Feb 29 on leap years and rejects Feb 29 on non-leap years", () => {
            const leapFeb29 = parseAndValidateBirthDate("2004-02-29", refDate);
            expect(leapFeb29.valid).toBe(true);

            const nonLeapFeb29 = parseAndValidateBirthDate("2005-02-29", refDate);
            expect(nonLeapFeb29.valid).toBe(false);
        });

        it("rejects future dates", () => {
            const tomorrow = parseAndValidateBirthDate("2026-07-29", refDate);
            expect(tomorrow.valid).toBe(false);
            expect(tomorrow.error).toBe("Data de nascimento não pode ser no futuro.");
        });
    });

    describe("calculateAgeFromParts", () => {
        const refDate = new Date(2026, 6, 28); // 2026-07-28 (July 28, 2026)

        it("calculates exact age for someone turning 18 TODAY", () => {
            const age = calculateAgeFromParts(2008, 7, 28, refDate);
            expect(age).toBe(18);
            expect(isAdultAge(age)).toBe(true);
        });

        it("calculates exact age for someone turning 18 TOMORROW", () => {
            const age = calculateAgeFromParts(2008, 7, 29, refDate);
            expect(age).toBe(17);
            expect(isAdultAge(age)).toBe(false);
        });

        it("calculates exact age for someone who turned 18 YESTERDAY", () => {
            const age = calculateAgeFromParts(2008, 7, 27, refDate);
            expect(age).toBe(18);
            expect(isAdultAge(age)).toBe(true);
        });

        it("calculates age for someone born late in the year", () => {
            const age = calculateAgeFromParts(2000, 12, 31, refDate);
            expect(age).toBe(25);
        });

        it("calculates age for someone born early in the year", () => {
            const age = calculateAgeFromParts(2000, 1, 1, refDate);
            expect(age).toBe(26);
        });
    });
});

import dayjs from "dayjs";

function generateRandomChars(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate a unique booking code. Format: MBK-YYYYMMDD-XXXXXX
 */
export function generateBookingCode(): string {
    return `MBK-${dayjs().format("YYYYMMDD")}-${generateRandomChars(6)}`;
}

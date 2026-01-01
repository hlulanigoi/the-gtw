/**
 * Utility functions for generating and validating parcel tracking codes
 */

/**
 * Generates a unique tracking code in format: GTW-XXXXXX
 * where X is alphanumeric (excluding confusing characters like O, 0, I, 1)
 */
export function generateTrackingCode(): string {
  const prefix = "GTW";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes O, I, 0, 1
  const codeLength = 6;
  
  let code = "";
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return `${prefix}-${code}`;
}

/**
 * Validates tracking code format
 */
export function isValidTrackingCode(code: string): boolean {
  const pattern = /^GTW-[A-Z2-9]{6}$/;
  return pattern.test(code);
}

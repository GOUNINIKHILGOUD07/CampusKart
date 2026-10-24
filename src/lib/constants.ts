export const CONDITIONS = ["New", "Like New", "Good", "Used"] as const;
export type ProductCondition = (typeof CONDITIONS)[number];

export const CONDITION_DESCRIPTIONS: Record<ProductCondition, string> = {
  New: "Unopened or unused",
  "Like New": "Barely used, no visible wear",
  Good: "Light wear, works well",
  Used: "Noticeable wear, fully usable",
};

export const CATEGORY_SLUGS = [
  "textbooks",
  "notes",
  "lab-records",
  "stationery",
  "electronics",
  "other",
] as const;

export const REPORT_REASONS = [
  "Suspicious or scam listing",
  "Inappropriate content",
  "Spam or duplicate",
  "Harassment or abuse",
  "Counterfeit item",
  "Other",
] as const;

/** Indian rupee price ceiling used in listing validation. */
export const MAX_PRICE_INR = 1000000;

// ─────────────────────────────────────────────────────────────────────────────
// Enum-like constants for SQL Server compatibility.
// SQL Server does not support native DB enums, so we store these as String
// columns in the DB. These constants provide type safety in TypeScript.
// ─────────────────────────────────────────────────────────────────────────────

export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const SubscriptionPlan = {
  FREE: "FREE",
  PRO: "PRO",
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  CANCELED: "CANCELED",
  PAST_DUE: "PAST_DUE",
  TRIALING: "TRIALING",
  INCOMPLETE: "INCOMPLETE",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const TripStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];

export const CollaboratorRole = {
  OWNER: "OWNER",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;
export type CollaboratorRole = (typeof CollaboratorRole)[keyof typeof CollaboratorRole];

export const ActivityCategory = {
  FOOD: "FOOD",
  ATTRACTION: "ATTRACTION",
  HOTEL: "HOTEL",
  TRANSPORT: "TRANSPORT",
  SHOPPING: "SHOPPING",
  ENTERTAINMENT: "ENTERTAINMENT",
  NATURE: "NATURE",
  CULTURE: "CULTURE",
  SPORT: "SPORT",
  OTHER: "OTHER",
} as const;
export type ActivityCategory = (typeof ActivityCategory)[keyof typeof ActivityCategory];

export const BudgetCategory = {
  FOOD: "FOOD",
  TRANSPORT: "TRANSPORT",
  ACTIVITIES: "ACTIVITIES",
  ACCOMMODATION: "ACCOMMODATION",
  SHOPPING: "SHOPPING",
  MISCELLANEOUS: "MISCELLANEOUS",
} as const;
export type BudgetCategory = (typeof BudgetCategory)[keyof typeof BudgetCategory];

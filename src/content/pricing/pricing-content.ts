import { routes } from "@/config/routes";

export interface PricingPlan {
  title: string;
  description: string;
  price: {
    monthly?: number;
    annually?: number;
    oneTime?: number;
  };
  features: string[];
  infos?: string[];
  href: string;
  isBestValue?: boolean;
  noCardRequired?: boolean;
  isComingSoon?: boolean;
}

export const singlePlan: PricingPlan = {
  title: "Resume",
  description: "Interactive resume with filtering and export.",
  isBestValue: true,
  price: { oneTime: 0 },
  href: "/",
  features: [
    "Interactive resume viewer",
    "Filter by role, technology, and date",
    "Export as PDF, DOCX, or HTML",
    "Multiple resume flavors",
    "URL-based state management",
    "Print-optimized layout",
  ],
};

export const oneTimePlans: PricingPlan[] = [singlePlan];



import { runMigrations } from "../src/db/migrate.js";
import { onboardingService } from "../src/services/onboardingService.js";

runMigrations();

const { session, user } = await onboardingService.startSession({
  userHint: { firstName: "Demo", country: "US", currency: "USD" },
});

await onboardingService.patchSession(session.id, {
  firstName: "Demo",
  country: "US",
  currency: "USD",
  ageRange: "25-34",
  employmentStatus: "Full-time employed",
  primaryFinancialConcern: "I want to start investing safely",
  investmentGoal: "Wealth creation",
  timeHorizon: "5-10 years",
  monthlyInvestmentCapacity: "$250-$750",
  emergencySavings: "3-6 months of expenses",
  riskReaction: "Review the reason and decide",
  investmentFamiliarity: "I know a few terms but have not started",
  currentInvestmentStatus: "No, I have not invested yet",
  consentGiven: true,
  currentStep: "review",
});

console.log(`Demo session created: sessionId=${session.id} userId=${user.id}`);

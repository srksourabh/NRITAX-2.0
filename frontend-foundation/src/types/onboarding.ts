export type TaxRegime = "old" | "new";

export type CredentialStatus = "yes" | "no" | "not-sure";

export type PanAvailability = "yes" | "no" | "not-sure";

export type IncomeSource = "salary" | "house-property" | "capital-gains" | "foreign-income" | "other";

export type OnboardingData = {
  fullName: string;
  country: string;
  panAvailability: PanAvailability | "";
  taxRegime: TaxRegime | "";
  incomeSources: IncomeSource[];
  credentialStatus: CredentialStatus | "";
};

export type OnboardingField = keyof OnboardingData;

export type OnboardingErrors = Partial<Record<OnboardingField, string>>;

export type OnboardingStep = {
  id: "personal" | "taxProfile" | "readiness";
  label: string;
};

export const initialOnboardingData: OnboardingData = {
  fullName: "",
  country: "",
  panAvailability: "",
  taxRegime: "",
  incomeSources: [],
  credentialStatus: ""
};

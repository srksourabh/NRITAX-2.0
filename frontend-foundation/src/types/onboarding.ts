export type TaxRegime = "old" | "new" | "guidance";

export type CredentialStatus = "yes" | "no" | "not-sure";

export type OnboardingData = {
  fullName: string;
  country: string;
  pan: string;
  taxRegime: TaxRegime | "";
  credentialStatus: CredentialStatus | "";
};

export type OnboardingField = keyof OnboardingData;

export type OnboardingErrors = Partial<Record<OnboardingField, string>>;

export type OnboardingStep = {
  id: "personal" | "tax" | "regime" | "credentials";
  label: string;
};

export const initialOnboardingData: OnboardingData = {
  fullName: "",
  country: "",
  pan: "",
  taxRegime: "",
  credentialStatus: ""
};

export type ContactCategory = "report_fake" | "app_feedback" | "other";

export type ContactRequest = {
  category: ContactCategory;
  title: string;
  message: string;
  app_variant: string;
  app_version: string;
  platform: string;
};

export type ContactResponse = {
  success: boolean;
  id: string;
};

export type ContactCategory = "report_fake" | "app_feedback" | "other";

export type ContactRequest = {
  category: ContactCategory;
  title: string;
  message: string;
  token?: string;
};

export type ContactResponse = {
  success: boolean;
  id: string;
};

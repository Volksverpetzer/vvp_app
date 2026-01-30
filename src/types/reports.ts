export type Report = {
  description: string;
  more_info: string;
  url: string;
  allowed_public: boolean;
};

export type StoredReport = {
  id: string;
};

export type StoredReports = StoredReport[];

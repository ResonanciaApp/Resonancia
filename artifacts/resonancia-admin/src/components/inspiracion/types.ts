export interface InspirationContent {
  quote: string;
  author: string | null;
  reflection: string;
  imagePath: string | null;
  imagePositionX: number;
  imagePositionY: number;
  overlayOpacity: number;
  sessionId: string | null;
}

export interface AdminInspiration {
  id: string;
  date: string;
  revision: number;
  draft: InspirationContent;
  published: InspirationContent | null;
  publishedRevision: number | null;
  deleted: boolean;
  updatedAt: string;
}

export interface InspirationSettings {
  revision: number;
  sectionTitle: string;
  readMoreLabel: string;
  discoverMoreLabel: string;
  notesLabel: string;
}

export interface AdminInspirationWeek {
  weekStart: string;
  days: {
    date: string;
    inspiration: AdminInspiration | null;
  }[];
  settings: InspirationSettings;
}

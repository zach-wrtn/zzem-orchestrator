export type SprintStatus = 'in-progress' | 'completed' | 'archived';

export interface Prototype {
  id: string;               // folder name under prototypes/app/
  title: string;            // display.prototypes[].title || <title> tag || humanized id
  entry: string;            // public-relative path to prototype.html
  thumbnail: string | null; // public-relative path to PNG, or null if none
  hero: boolean;            // exactly one per sprint
  screens: string[];        // additional screenshot PNGs (public-relative)
}

export interface Sprint {
  slug: string;             // folder name
  title: string;
  startDate: string;        // ISO date
  endDate: string;          // ISO date
  status: SprintStatus;
  summary: string;          // 1–2 line extract
  tags: string[];
  prototypes: Prototype[];
  docs: {
    prd?: string;           // absolute repo path (for MDX import)
    report?: string;
    retrospective?: string[];
  };
}

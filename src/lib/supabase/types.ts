export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Project = {
  id: string;
  title: string;
  short_description: string;
  long_description: string | null;
  tech_stack: string[] | null;
  github_url: string | null;
  live_url: string | null;
  demo_url: string | null;
  case_study_url: string | null;
  image_url: string | null;
  category: string | null;
  featured: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Certificate = {
  id: string;
  title: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  certificate_url: string | null;
  credential_url: string | null;
  file_path: string | null;
  category: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  achievement_date: string | null;
  category: string | null;
  proof_url: string | null;
  rank_or_result: string | null;
  organization: string | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AchievementLink = {
  id: string;
  achievement_id: string | null;
  label: string;
  url: string;
  created_at: string | null;
};

export type AchievementCertificate = {
  id: string;
  achievement_id: string | null;
  certificate_id: string | null;
  created_at: string | null;
};

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  display_order: number | null;
  created_at: string | null;
};

export type CodingStats = {
  id: string;
  platform: string;
  username: string;
  rating: number | null;
  max_rating: number | null;
  rank: string | null;
  max_rank: string | null;
  solved_count: number | null;
  easy_solved: number | null;
  medium_solved: number | null;
  hard_solved: number | null;
  contest_count: number | null;
  global_ranking: number | null;
  last_updated: string | null;
  raw_json: Json | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PortfolioSetting = {
  id: string;
  key: string;
  value: Json;
  updated_at: string | null;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
      };
      projects: {
        Row: Project;
      };
      certificates: {
        Row: Certificate;
      };
      achievements: {
        Row: Achievement;
      };
      achievement_links: {
        Row: AchievementLink;
      };
      achievement_certificates: {
        Row: AchievementCertificate;
      };
      social_links: {
        Row: SocialLink;
      };
      coding_stats: {
        Row: CodingStats;
      };
      portfolio_settings: {
        Row: PortfolioSetting;
      };
    };
  };
};

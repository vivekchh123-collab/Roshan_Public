export type Brand = {
  id: string;
  slug: string;
  name: string;
  tag: string | null;
  note: string | null;
  image_url: string | null;
  coming_soon: boolean;
  sort: number;
};

export type Plan = {
  id: string;
  brand_id: string;
  category: 'on-grid' | 'hybrid';
  title: string;
  details: string;
  total_cost: number | null;
  subsidy: number;
  net_cost: number | null;
  per_kw_price: number | null;
  sort: number;
};

export type Announcement = { en: string; hi: string };

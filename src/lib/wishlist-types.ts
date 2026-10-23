export type WishlistItem = {
  id: string;
  productId: number | null;
  slug: string;
  name: string;
  /** Rupees (whole) */
  price: number;
  image: string;
  swatches: string[];
};

export type WishlistItemInput = {
  productId?: number | null;
  slug: string;
  name: string;
  price: number;
  image: string;
  swatches?: string[];
};

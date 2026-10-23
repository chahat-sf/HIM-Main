export type CartItem = {
  id: string;
  productId: number | null;
  slug: string;
  name: string;
  size: string;
  color: string;
  /** Rupees (whole), same unit as the cart UI */
  price: number;
  qty: number;
  image: string;
  swatches: string[];
};

export type CartItemInput = {
  productId?: number | null;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  qty?: number;
  image: string;
  swatches?: string[];
};

import { listProducts } from "@/lib/catalog";
import CollectionClient from "./CollectionClient";

export const revalidate = 60;

export default async function CollectionPage() {
  const products = await listProducts();
  return <CollectionClient products={products} />;
}

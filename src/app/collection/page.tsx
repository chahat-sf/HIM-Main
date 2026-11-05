import { listProducts } from "@/lib/catalog";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";
import CollectionClient from "./CollectionClient";

export const revalidate = 60;

export const metadata = buildPageMetadata(PAGE_SEO.collection);

export default async function CollectionPage() {
  const products = await listProducts();
  return <CollectionClient products={products} />;
}

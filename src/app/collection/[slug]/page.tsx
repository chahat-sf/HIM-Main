import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpOutfit from "@/components/pdp/PdpOutfit";
import PdpSingle from "@/components/pdp/PdpSingle";
import {
  getProductBySlug,
  listProductSlugs,
  listProducts,
  listRelatedProducts,
} from "@/lib/catalog";
import {
  buildPageMetadata,
  CATEGORY_SEO,
  isCollectionCategoryPath,
  productShareMetadata,
} from "@/lib/seo";
import CollectionClient from "../CollectionClient";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await listProductSlugs();
    const categorySlugs = Object.keys(CATEGORY_SEO);
    return [...categorySlugs, ...slugs].map((slug) => ({ slug }));
  } catch {
    return Object.keys(CATEGORY_SEO).map((slug) => ({ slug }));
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const slug = typeof resolved?.slug === "string" ? resolved.slug : "";

  if (isCollectionCategoryPath(slug)) {
    return buildPageMetadata(CATEGORY_SEO[slug]);
  }

  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return productShareMetadata({
    name: product.name,
    slug: product.slug,
    title: product.title,
    description:
      product.marketingLine || product.description || product.title || "",
    image: product.image,
  });
}

export default async function CollectionSlugPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const slug = typeof resolved?.slug === "string" ? resolved.slug : "";

  if (isCollectionCategoryPath(slug)) {
    const products = await listProducts();
    return (
      <CollectionClient
        products={products}
        initialCategory={CATEGORY_SEO[slug].filter}
      />
    );
  }

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await listRelatedProducts(product.slug, 3);

  if (product.pdpLayout === "single") {
    return <PdpSingle product={product} related={related} />;
  }

  return <PdpOutfit product={product} related={related} />;
}

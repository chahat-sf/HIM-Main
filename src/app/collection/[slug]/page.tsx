import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpOutfit from "@/components/pdp/PdpOutfit";
import PdpSingle from "@/components/pdp/PdpSingle";
import {
  getProductBySlug,
  listProductSlugs,
  listRelatedProducts,
} from "@/lib/catalog";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export async function generateStaticParams() {
  try {
    const slugs = await listProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const slug = typeof resolved?.slug === "string" ? resolved.slug : "";
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.marketingLine || product.description || product.title,
    openGraph: {
      title: product.name,
      description: product.marketingLine || product.description || product.title,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const slug = typeof resolved?.slug === "string" ? resolved.slug : "";
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await listRelatedProducts(product.slug, 3);

  if (product.pdpLayout === "single") {
    return <PdpSingle product={product} related={related} />;
  }

  return <PdpOutfit product={product} related={related} />;
}

import { notFound } from "next/navigation";
import PdpOutfit from "@/components/pdp/PdpOutfit";
import PdpSingle from "@/components/pdp/PdpSingle";
import { getProductBySlug, listProducts } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function ProductDetailPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const slug = typeof resolved?.slug === "string" ? resolved.slug : "";
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const all = await listProducts();
  const related = all.filter((p) => p.slug !== product.slug).slice(0, 3);

  if (product.pdpLayout === "single") {
    return <PdpSingle product={product} related={related} />;
  }

  return <PdpOutfit product={product} related={related} />;
}

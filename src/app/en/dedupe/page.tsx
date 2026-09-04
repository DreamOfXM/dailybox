import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import DedupeToolEn from "@/components/tools/DedupeToolEn";

const seo = findToolEn("dedupe")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <DedupeToolEn />
    </>
  );
}

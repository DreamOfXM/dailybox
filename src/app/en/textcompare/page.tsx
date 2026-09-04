import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import TextcompareToolEn from "@/components/tools/TextcompareToolEn";

const seo = findToolEn("textcompare")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <TextcompareToolEn />
    </>
  );
}

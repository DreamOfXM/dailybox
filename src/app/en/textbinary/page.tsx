import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import TextbinaryToolEn from "@/components/tools/TextbinaryToolEn";

const seo = findToolEn("textbinary")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <TextbinaryToolEn />
    </>
  );
}

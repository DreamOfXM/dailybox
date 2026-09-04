import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import WordcountToolEn from "@/components/tools/WordcountToolEn";

const seo = findToolEn("wordcount")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <WordcountToolEn />
    </>
  );
}

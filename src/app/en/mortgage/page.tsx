import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import MortgageToolEn from "@/components/tools/MortgageToolEn";

const seo = findToolEn("mortgage")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <MortgageToolEn />
    </>
  );
}

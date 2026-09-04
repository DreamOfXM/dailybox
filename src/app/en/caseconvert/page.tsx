import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import CaseconvertToolEn from "@/components/tools/CaseconvertToolEn";

const seo = findToolEn("caseconvert")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <CaseconvertToolEn />
    </>
  );
}

import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfOrganizeToolEn from "@/components/tools/PdfOrganizeToolEn";

const seo = findToolEn("pdforganize")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfOrganizeToolEn />
    </>
  );
}

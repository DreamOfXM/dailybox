import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfPagenumToolEn from "@/components/tools/PdfPagenumToolEn";

const seo = findToolEn("pdfpagenum")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfPagenumToolEn />
    </>
  );
}

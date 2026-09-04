import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfWatermarkToolEn from "@/components/tools/PdfWatermarkToolEn";

const seo = findToolEn("pdfwatermark")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfWatermarkToolEn />
    </>
  );
}

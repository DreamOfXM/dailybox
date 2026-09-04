import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfRotateToolEn from "@/components/tools/PdfRotateToolEn";

const seo = findToolEn("pdfrotate")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfRotateToolEn />
    </>
  );
}

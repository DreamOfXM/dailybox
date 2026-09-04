import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfWatermarkTool from "@/components/tools/PdfWatermarkTool";

const seo = findTool("pdfwatermark")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfWatermarkTool />
    </>
  );
}

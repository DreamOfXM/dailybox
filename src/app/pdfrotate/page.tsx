import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfRotateTool from "@/components/tools/PdfRotateTool";

const seo = findTool("pdfrotate")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfRotateTool />
    </>
  );
}

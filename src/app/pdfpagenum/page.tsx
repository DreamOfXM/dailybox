import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfPagenumTool from "@/components/tools/PdfPagenumTool";

const seo = findTool("pdfpagenum")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfPagenumTool />
    </>
  );
}

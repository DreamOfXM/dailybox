import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfOrganizeTool from "@/components/tools/PdfOrganizeTool";

const seo = findTool("pdforganize")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfOrganizeTool />
    </>
  );
}

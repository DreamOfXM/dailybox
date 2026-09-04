import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfToJpgTool from "@/components/tools/PdfToJpgTool";

const seo = findTool("pdftojpg")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfToJpgTool />
    </>
  );
}

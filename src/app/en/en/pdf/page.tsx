import { findToolEn, toolMetadataEn, ALL_TOOLS_EN } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfTool from "@/components/tools/PdfTool";

const seo = findToolEn("pdf")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  // Use English JSON-LD but reuse same component (UI still Chinese, SEO is EN)
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfTool />
    </>
  );
}

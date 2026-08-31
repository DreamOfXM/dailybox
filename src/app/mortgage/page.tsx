import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import MortgageTool from "@/components/tools/MortgageTool";

const seo = findTool("mortgage")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <MortgageTool />
    </>
  );
}

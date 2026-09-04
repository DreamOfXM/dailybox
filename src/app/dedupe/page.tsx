import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import DedupeTool from "@/components/tools/DedupeTool";

const seo = findTool("dedupe")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <DedupeTool />
    </>
  );
}

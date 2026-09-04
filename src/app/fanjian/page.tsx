import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import FanjianTool from "@/components/tools/FanjianTool";

const seo = findTool("fanjian")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <FanjianTool />
    </>
  );
}

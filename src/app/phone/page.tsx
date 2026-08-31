import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PhoneTool from "@/components/tools/PhoneTool";

const seo = findTool("phone")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PhoneTool />
    </>
  );
}

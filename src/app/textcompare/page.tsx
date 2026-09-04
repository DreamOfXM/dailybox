import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import TextcompareTool from "@/components/tools/TextcompareTool";

const seo = findTool("textcompare")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <TextcompareTool />
    </>
  );
}

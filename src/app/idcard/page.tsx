import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import IdcardTool from "@/components/tools/IdcardTool";

const seo = findTool("idcard")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <IdcardTool />
    </>
  );
}

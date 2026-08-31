import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import LunarTool from "@/components/tools/LunarTool";

const seo = findTool("lunar")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <LunarTool />
    </>
  );
}

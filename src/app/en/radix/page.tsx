import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import RadixTool from "@/components/tools/RadixTool";

const seo = findToolEn("radix")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  // Use English JSON-LD but reuse same component (UI still Chinese, SEO is EN)
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <RadixTool />
    </>
  );
}

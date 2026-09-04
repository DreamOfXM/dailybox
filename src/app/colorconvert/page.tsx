import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import ColorconvertTool from "@/components/tools/ColorconvertTool";

const seo = findTool("colorconvert")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <ColorconvertTool />
    </>
  );
}

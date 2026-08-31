import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import IrrTool from "@/components/tools/IrrTool";

const seo = findTool("irr")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <IrrTool />
    </>
  );
}

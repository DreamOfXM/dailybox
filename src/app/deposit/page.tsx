import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import DepositTool from "@/components/tools/DepositTool";

const seo = findTool("deposit")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <DepositTool />
    </>
  );
}

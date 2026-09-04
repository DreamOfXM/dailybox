import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import JpgToPdfTool from "@/components/tools/JpgToPdfTool";

const seo = findTool("jpgtopdf")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <JpgToPdfTool />
    </>
  );
}

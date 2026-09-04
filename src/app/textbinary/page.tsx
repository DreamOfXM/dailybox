import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import TextbinaryTool from "@/components/tools/TextbinaryTool";

const seo = findTool("textbinary")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <TextbinaryTool />
    </>
  );
}

import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import WordcountTool from "@/components/tools/WordcountTool";

const seo = findTool("wordcount")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <WordcountTool />
    </>
  );
}

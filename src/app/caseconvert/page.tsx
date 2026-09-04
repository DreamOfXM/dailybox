import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import CaseconvertTool from "@/components/tools/CaseconvertTool";

const seo = findTool("caseconvert")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <CaseconvertTool />
    </>
  );
}

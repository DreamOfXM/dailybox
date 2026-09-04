import { findTool, toolMetadata, toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import QrcodeTool from "@/components/tools/QrcodeTool";

const seo = findTool("qrcode")!;
export const metadata = toolMetadata(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <QrcodeTool />
    </>
  );
}

import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import QrcodeToolEn from "@/components/tools/QrcodeToolEn";

const seo = findToolEn("qrcode")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <QrcodeToolEn />
    </>
  );
}

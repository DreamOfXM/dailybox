import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import PdfToJpgToolEn from "@/components/tools/PdfToJpgToolEn";

const seo = findToolEn("pdftojpg")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <PdfToJpgToolEn />
    </>
  );
}

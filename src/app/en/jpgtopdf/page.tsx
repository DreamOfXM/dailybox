import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import JpgToPdfToolEn from "@/components/tools/JpgToPdfToolEn";

const seo = findToolEn("jpgtopdf")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <JpgToPdfToolEn />
    </>
  );
}

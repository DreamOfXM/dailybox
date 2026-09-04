import { findToolEn, toolMetadataEn } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import ColorconvertToolEn from "@/components/tools/ColorconvertToolEn";

const seo = findToolEn("colorconvert")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <ColorconvertToolEn />
    </>
  );
}

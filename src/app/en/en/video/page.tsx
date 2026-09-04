import { findToolEn, toolMetadataEn, ALL_TOOLS_EN } from "@/lib/seo-en";
import { toolJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui";
import VideoTool from "@/components/tools/VideoTool";

const seo = findToolEn("video")!;
export const metadata = toolMetadataEn(seo);

export default function Page() {
  // Use English JSON-LD but reuse same component (UI still Chinese, SEO is EN)
  return (
    <>
      <JsonLd data={toolJsonLd(seo)} />
      <VideoTool />
    </>
  );
}

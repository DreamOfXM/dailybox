import { CAT_ICON_PATHS, TOOL_ICON_PATHS } from "@/lib/icons";

/** 线性图标：24×24 网格、1.5 描边、currentColor，尺寸由 size 决定。 */
function Glyph({ body, size, className }: { body: string; size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

export function ToolIcon({
  slug,
  size = 20,
  className,
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const body = TOOL_ICON_PATHS[slug];
  if (!body) return null;
  return <Glyph body={body} size={size} className={className} />;
}

export function CatIcon({
  group,
  size = 20,
  className,
}: {
  group: string;
  size?: number;
  className?: string;
}) {
  const body = CAT_ICON_PATHS[group];
  if (!body) return null;
  return <Glyph body={body} size={size} className={className} />;
}

/** 二维码生成输入校验（纯函数；实际渲染在组件层调用 qrcode 库完成） */

import type { TryResult } from "./base64";

/** 超过该字符数时提示警告（仍可生成，但高密度二维码扫码成功率下降） */
export const QR_WARN_LEN = 2000;

export interface QrValidation {
  /** 待编码内容的字符数 */
  len: number;
  /** 超长警告文案；无警告时为 undefined */
  warning?: string;
}

/**
 * 校验二维码输入内容：
 * - 空串 → ok:false（中文错误信息可直接展示）
 * - 长度超过 QR_WARN_LEN → ok:true 但携带 warning（不阻断生成）
 */
export function validateQrInput(text: string): TryResult<QrValidation> {
  if (typeof text !== "string" || text.length === 0) {
    return { ok: false, message: "内容不能为空，请输入文本或粘贴链接" };
  }
  const len = text.length;
  if (len > QR_WARN_LEN) {
    return {
      ok: true,
      value: {
        len,
        warning: `内容较长（${len} 字符，超过 ${QR_WARN_LEN}），生成的二维码密度很高，可能难以扫描`,
      },
    };
  }
  return { ok: true, value: { len } };
}

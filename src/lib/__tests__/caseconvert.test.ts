import { describe, expect, it } from "vitest";
import { convertCase, type CaseMode } from "../caseconvert";

const ALL_MODES: CaseMode[] = ["upper", "lower", "capitalize", "camel", "snake", "kebab"];

describe("convertCase 大小写转换", () => {
  it("upper / lower", () => {
    expect(convertCase("hello world", "upper")).toBe("HELLO WORLD");
    expect(convertCase("HELLO World", "lower")).toBe("hello world");
  });

  it("capitalize 每词首字母大写，空白结构保留", () => {
    expect(convertCase("hello world foo", "capitalize")).toBe("Hello World Foo");
    expect(convertCase("  hello   world ", "capitalize")).toBe("  Hello   World ");
  });

  it("camel / snake / kebab 按非字母数字分词", () => {
    expect(convertCase("hello world foo", "camel")).toBe("helloWorldFoo");
    expect(convertCase("hello world foo", "snake")).toBe("hello_world_foo");
    expect(convertCase("hello world foo", "kebab")).toBe("hello-world-foo");
  });

  it("各模式互转：不同来源形态收敛到同一结果", () => {
    const sources = ["hello world", "hello_world", "hello-world", "hello.world"];
    for (const s of sources) {
      expect(convertCase(s, "camel"), s).toBe("helloWorld");
      expect(convertCase(s, "snake"), s).toBe("hello_world");
      expect(convertCase(s, "kebab"), s).toBe("hello-world");
    }
    // 大写来源也能归一
    expect(convertCase("HELLO WORLD", "camel")).toBe("helloWorld");
    expect(convertCase("HELLO_WORLD", "kebab")).toBe("hello-world");
  });

  it("数字参与分词", () => {
    expect(convertCase("user id 2", "camel")).toBe("userId2");
    expect(convertCase("user id 2", "snake")).toBe("user_id_2");
    expect(convertCase("user id 2", "kebab")).toBe("user-id-2");
  });

  it("中文不受影响", () => {
    const zh = "你好 世界";
    expect(convertCase(zh, "upper")).toBe(zh);
    expect(convertCase(zh, "lower")).toBe(zh);
    expect(convertCase(zh, "capitalize")).toBe(zh);
    expect(convertCase(zh, "camel")).toBe("你好世界");
    expect(convertCase(zh, "snake")).toBe("你好_世界");
    expect(convertCase(zh, "kebab")).toBe("你好-世界");
  });

  it("空串与纯符号", () => {
    for (const mode of ALL_MODES) {
      expect(convertCase("", mode), mode).toBe("");
    }
    expect(convertCase("!!! ???", "camel")).toBe("");
    expect(convertCase("!!! ???", "snake")).toBe("");
    expect(convertCase("!!! ???", "kebab")).toBe("");
  });
});

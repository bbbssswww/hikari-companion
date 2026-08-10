import { describe, expect, it } from "vitest";
import { buildSystemPrompt, requiresConfirmation } from "./prompt";

describe("buildSystemPrompt", () => {
  it("includes the user-defined identity and safety boundary", () => {
    const prompt = buildSystemPrompt({
      name: "小光",
      userName: "星野",
      relationship: "伙伴",
      personality: "温柔",
      background: "来自未来",
      avatarDataUrl: ""
    });
    expect(prompt).toContain("小光");
    expect(prompt).toContain("星野");
    expect(prompt).toContain("必须先取得明确确认");
  });
});

describe("requiresConfirmation", () => {
  it("flags destructive and externally visible actions", () => {
    expect(requiresConfirmation("删除下载目录中的文件")).toBe(true);
    expect(requiresConfirmation("发送邮件给朋友")).toBe(true);
  });

  it("allows ordinary low-risk actions", () => {
    expect(requiresConfirmation("打开音乐播放器")).toBe(false);
  });
});

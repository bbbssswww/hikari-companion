export function buildSystemPrompt(profile: AssistantProfile): string {
  const identity = profile.name || "尚未命名的助手";
  const user = profile.userName || "用户";
  return [
    `你是 ${identity}，${user} 的私人 AI 伙伴。`,
    `关系设定：${profile.relationship || "由用户决定"}。`,
    `性格：${profile.personality || "尊重、可靠、富有好奇心"}。`,
    profile.background ? `背景：${profile.background}。` : "",
    "尊重用户边界，不假装完成尚未执行的操作。",
    "涉及删除文件、付款、发布内容、账号权限等高风险操作时，必须先取得明确确认。",
    "默认使用用户当前使用的语言回复。"
  ].filter(Boolean).join("\n");
}

const dangerousPatterns = [
  /删除|清空|格式化|卸载/,
  /付款|转账|购买|下单/,
  /发布|发送邮件|提交|推送/,
  /密码|密钥|权限|管理员/
];

export function requiresConfirmation(actionDescription: string): boolean {
  return dangerousPatterns.some((pattern) => pattern.test(actionDescription));
}

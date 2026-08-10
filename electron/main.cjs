const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

let mainWindow;

const defaultState = {
  onboarded: false,
  profile: {
    name: "",
    userName: "",
    relationship: "由我决定",
    personality: "温柔、好奇、尊重边界",
    background: "",
    avatarDataUrl: ""
  },
  connection: {
    mode: "demo",
    baseUrl: "",
    model: "",
    apiKey: ""
  },
  preferences: {
    speakReplies: true,
    requireDangerousActionConfirmation: true
  },
  memories: []
};

function statePath() {
  return path.join(app.getPath("userData"), "hikari-state.json");
}

async function readState() {
  try {
    const raw = JSON.parse(await fs.readFile(statePath(), "utf8"));
    if (raw.connection?.apiKeyEncrypted && safeStorage.isEncryptionAvailable()) {
      raw.connection.apiKey = safeStorage.decryptString(
        Buffer.from(raw.connection.apiKeyEncrypted, "base64")
      );
    } else {
      raw.connection = { ...raw.connection, apiKey: "" };
    }
    delete raw.connection.apiKeyEncrypted;
    return {
      ...defaultState,
      ...raw,
      profile: { ...defaultState.profile, ...raw.profile },
      connection: { ...defaultState.connection, ...raw.connection },
      preferences: { ...defaultState.preferences, ...raw.preferences }
    };
  } catch {
    return defaultState;
  }
}

async function writeState(nextState) {
  const clean = JSON.parse(JSON.stringify(nextState));
  const apiKey = clean.connection?.apiKey || "";
  delete clean.connection.apiKey;
  if (apiKey && safeStorage.isEncryptionAvailable()) {
    clean.connection.apiKeyEncrypted = safeStorage.encryptString(apiKey).toString("base64");
  }
  await fs.mkdir(path.dirname(statePath()), { recursive: true });
  await fs.writeFile(statePath(), JSON.stringify(clean, null, 2), "utf8");
  return { ok: true };
}

function completionUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("模型地址必须使用 http 或 https");
  }
  const cleanPath = parsed.pathname.replace(/\/$/, "");
  if (cleanPath.endsWith("/chat/completions")) return parsed.toString();
  parsed.pathname = `${cleanPath || "/v1"}/chat/completions`.replace(/\/+/g, "/");
  return parsed.toString();
}

function demoReply(name, content) {
  const lower = content.toLowerCase();
  if (/你好|hello|hi/.test(lower)) {
    return `你好，我是${name || "你的伙伴"}。我已经准备好陪你一起探索啦。`;
  }
  if (/记住|memory|remember/.test(lower)) {
    return "我听到了。当前原型已经为可编辑记忆预留了位置，下一阶段会加入自动总结。";
  }
  return `我收到了：“${content.slice(0, 80)}”。现在使用的是本地演示模式；连接在线或本地模型后，我就能进行更完整的对话。`;
}

async function requestChat(payload) {
  const { connection, messages, assistantName } = payload;
  const lastMessage = messages.at(-1)?.content || "";
  if (connection.mode === "demo") {
    return { content: demoReply(assistantName, lastMessage), provider: "demo" };
  }
  if (!connection.baseUrl || !connection.model) {
    throw new Error("请先填写模型地址和模型名称");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(completionUrl(connection.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(connection.apiKey ? { Authorization: `Bearer ${connection.apiKey}` } : {})
      },
      body: JSON.stringify({ model: connection.model, messages, temperature: 0.8 }),
      signal: controller.signal
    });
    if (!response.ok) {
      const details = (await response.text()).slice(0, 300);
      throw new Error(`模型请求失败 (${response.status})${details ? `：${details}` : ""}`);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("模型没有返回可读取的回复");
    }
    return { content: content.trim(), provider: connection.mode };
  } finally {
    clearTimeout(timeout);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  if (!app.isPackaged) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("hikari:get-state", readState);
  ipcMain.handle("hikari:save-state", (_event, state) => writeState(state));
  ipcMain.handle("hikari:chat", (_event, payload) => requestChat(payload));
  ipcMain.handle("hikari:set-companion-mode", (_event, enabled) => {
    if (!mainWindow) return { ok: false };
    if (enabled) {
      mainWindow.setResizable(false);
      mainWindow.setAlwaysOnTop(true, "floating");
      mainWindow.setSize(380, 620, true);
      mainWindow.setSkipTaskbar(true);
    } else {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setSkipTaskbar(false);
      mainWindow.setResizable(true);
      mainWindow.setSize(1180, 780, true);
      mainWindow.center();
    }
    return { ok: true };
  });
  ipcMain.on("hikari:minimize", () => mainWindow?.minimize());
  ipcMain.on("hikari:close", () => mainWindow?.close());
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

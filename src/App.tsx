import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Brain,
  Check,
  ChevronRight,
  CircleUserRound,
  Heart,
  ImagePlus,
  LayoutDashboard,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Minus,
  Plus,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  WandSparkles,
  X
} from "lucide-react";
import { buildSystemPrompt } from "./lib/prompt";

const EMPTY_STATE: AppState = {
  onboarded: false,
  profile: {
    name: "",
    userName: "",
    relationship: "由我决定",
    personality: "温柔、好奇、可靠、尊重边界",
    background: "",
    avatarDataUrl: ""
  },
  connection: { mode: "demo", baseUrl: "", model: "", apiKey: "" },
  preferences: { speakReplies: true, requireDangerousActionConfirmation: true },
  memories: []
};

const cloneEmptyState = () => JSON.parse(JSON.stringify(EMPTY_STATE)) as AppState;

const fallbackApi = {
  getState: async () => cloneEmptyState(),
  saveState: async () => ({ ok: true }),
  chat: async (payload: ChatPayload) => ({
    provider: "web-demo",
    content: `我听到了：“${payload.messages.at(-1)?.content || ""}”。在桌面应用中连接模型后，我会拥有完整的对话能力。`
  }),
  setCompanionMode: async () => ({ ok: true }),
  minimize: () => undefined,
  close: () => undefined
};

const api = () => window.hikari ?? fallbackApi;

type View = "home" | "chat" | "memory" | "creator" | "settings";

function Avatar({ profile, speaking = false, compact = false }: { profile: AssistantProfile; speaking?: boolean; compact?: boolean }) {
  return (
    <div className={`avatar-wrap ${speaking ? "is-speaking" : ""} ${compact ? "is-compact" : ""}`}>
      <div className="avatar-glow" />
      {profile.avatarDataUrl ? (
        <img className="avatar-image" src={profile.avatarDataUrl} alt={`${profile.name || "助手"}的形象`} />
      ) : (
        <div className="avatar-placeholder" aria-label="等待上传角色形象">
          <div className="orb-ring ring-one" />
          <div className="orb-ring ring-two" />
          <div className="orb-core"><Sparkles size={32} /></div>
          <span>等待你的想象</span>
        </div>
      )}
    </div>
  );
}

function TitleBar() {
  return (
    <div className="titlebar">
      <div className="brand-mark"><Sparkles size={15} /> HIKARI</div>
      <div className="window-actions">
        <button onClick={() => api().minimize()} aria-label="最小化"><Minus size={15} /></button>
        <button onClick={() => api().close()} aria-label="关闭"><X size={15} /></button>
      </div>
    </div>
  );
}

function Onboarding({ state, onChange, onFinish }: { state: AppState; onChange: (state: AppState) => void; onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const profile = state.profile;

  const updateProfile = (patch: Partial<AssistantProfile>) => onChange({ ...state, profile: { ...profile, ...patch } });
  const updateConnection = (patch: Partial<ConnectionSettings>) => onChange({ ...state, connection: { ...state.connection, ...patch } });

  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("请选择 PNG、JPG 或 WebP 图片");
    if (file.size > 5 * 1024 * 1024) return setError("图片请控制在 5 MB 以内");
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatarDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
    setError("");
  }

  function next() {
    if (step === 0 && !profile.name.trim()) return setError("先给你的伙伴起一个名字吧");
    setError("");
    if (step < 2) setStep(step + 1);
    else onFinish();
  }

  return (
    <div className="onboarding-shell">
      <TitleBar />
      <div className="onboarding-grid">
        <section className="onboarding-preview">
          <div className="eyebrow"><WandSparkles size={15} /> 创建你的专属伙伴</div>
          <Avatar profile={profile} />
          <div className="preview-name">{profile.name || "尚未命名"}</div>
          <div className="preview-personality">{profile.personality}</div>
        </section>

        <section className="onboarding-form">
          <div className="step-track">
            {["形象", "人格", "连接"].map((label, index) => (
              <div className={`step-dot ${index <= step ? "active" : ""}`} key={label}>
                <span>{index < step ? <Check size={13} /> : index + 1}</span>{label}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="form-page">
              <div><p className="kicker">STEP 01</p><h1>让想象拥有名字</h1><p className="lead">Hikari 不预设你的伙伴应该是谁。上传自己的形象，或者稍后通过社区插件生成。</p></div>
              <label className="field"><span>伙伴名字</span><input autoFocus value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} placeholder="例如：小光" /></label>
              <label className="field"><span>怎么称呼你</span><input value={profile.userName} onChange={(e) => updateProfile({ userName: e.target.value })} placeholder="你的名字或昵称" /></label>
              <label className="upload-card">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} />
                <ImagePlus size={23} />
                <span>{profile.avatarDataUrl ? "更换角色形象" : "上传角色形象"}</span>
                <small>支持透明 PNG、JPG、WebP，最大 5 MB</small>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="form-page">
              <div><p className="kicker">STEP 02</p><h1>赋予独一无二的人格</h1><p className="lead">这些设定会成为对话的核心提示，你随时可以回来修改。</p></div>
              <label className="field"><span>你们的关系</span><select value={profile.relationship} onChange={(e) => updateProfile({ relationship: e.target.value })}><option>由我决定</option><option>私人助手</option><option>朋友</option><option>亲密陪伴</option><option>学习搭档</option><option>工作伙伴</option></select></label>
              <label className="field"><span>性格关键词</span><input value={profile.personality} onChange={(e) => updateProfile({ personality: e.target.value })} /></label>
              <label className="field"><span>角色背景</span><textarea value={profile.background} onChange={(e) => updateProfile({ background: e.target.value })} placeholder="她/他来自哪里？与你有怎样的故事？" /></label>
            </div>
          )}

          {step === 2 && (
            <div className="form-page">
              <div><p className="kicker">STEP 03</p><h1>选择思考方式</h1><p className="lead">可以先体验演示模式，之后再连接在线服务或本地模型。API 密钥会由系统加密保存。</p></div>
              <div className="mode-cards">
                {([{"id":"demo","name":"演示模式","desc":"无需配置，立即体验"},{"id":"online","name":"在线模型","desc":"连接 OpenAI 兼容服务"},{"id":"local","name":"本地模型","desc":"连接本机兼容接口"}] as const).map((mode) => (
                  <button className={`mode-card ${state.connection.mode === mode.id ? "selected" : ""}`} onClick={() => updateConnection({ mode: mode.id })} key={mode.id}><Bot size={20} /><strong>{mode.name}</strong><span>{mode.desc}</span></button>
                ))}
              </div>
              {state.connection.mode !== "demo" && <ConnectionFields connection={state.connection} onChange={updateConnection} />}
              <div className="privacy-note"><ShieldCheck size={18} /><span><strong>隐私优先</strong>　角色资料与记忆默认保存在这台电脑上。</span></div>
            </div>
          )}

          <div className="form-footer">
            <span className="form-error">{error}</span>
            <div>{step > 0 && <button className="button ghost" onClick={() => setStep(step - 1)}>返回</button>}<button className="button primary" onClick={next}>{step === 2 ? "唤醒伙伴" : "继续"}<ChevronRight size={17} /></button></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ConnectionFields({ connection, onChange }: { connection: ConnectionSettings; onChange: (patch: Partial<ConnectionSettings>) => void }) {
  return (
    <div className="connection-fields">
      <label className="field"><span>兼容接口地址</span><input value={connection.baseUrl} onChange={(e) => onChange({ baseUrl: e.target.value })} placeholder={connection.mode === "local" ? "http://127.0.0.1:11434/v1" : "https://服务商地址/v1"} /></label>
      <div className="field-row"><label className="field"><span>模型名称</span><input value={connection.model} onChange={(e) => onChange({ model: e.target.value })} placeholder="填写服务商支持的模型" /></label><label className="field"><span>API 密钥（可选）</span><input type="password" value={connection.apiKey} onChange={(e) => onChange({ apiKey: e.target.value })} placeholder="本地模型通常不需要" /></label></div>
    </div>
  );
}

function Sidebar({ view, setView, profile }: { view: View; setView: (view: View) => void; profile: AssistantProfile }) {
  const items: Array<[View, typeof LayoutDashboard, string]> = [["home", LayoutDashboard, "主页"], ["chat", MessageCircle, "对话"], ["memory", Brain, "记忆"], ["creator", CircleUserRound, "角色"], ["settings", Settings, "设置"]];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo"><span><Sparkles size={17} /></span><strong>Hikari</strong></div>
      <nav>{items.map(([id, Icon, label]) => <button className={view === id ? "active" : ""} onClick={() => setView(id)} key={id}><Icon size={19} /><span>{label}</span></button>)}</nav>
      <div className="sidebar-profile"><Avatar profile={profile} compact /><div><strong>{profile.name}</strong><span>在线 · 演示阶段</span></div></div>
    </aside>
  );
}

function ChatPanel({ state, onStateChange }: { state: AppState; onStateChange: (state: AppState) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: `你好${state.profile.userName ? `，${state.profile.userName}` : ""}。我是${state.profile.name}，今天想一起做什么？` }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  function speak(text: string) {
    if (!state.preferences.speakReplies || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    try {
      const payloadMessages: ChatMessage[] = [{ role: "system", content: buildSystemPrompt(state.profile) }, ...nextMessages.slice(-12)];
      const result = await api().chat({ connection: state.connection, messages: payloadMessages, assistantName: state.profile.name });
      setMessages((current) => [...current, { role: "assistant", content: result.content }]);
      speak(result.content);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: `连接遇到问题：${error instanceof Error ? error.message : "未知错误"}` }]);
    } finally {
      setSending(false);
    }
  }

  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return setMessages((current) => [...current, { role: "assistant", content: "当前系统没有可用的语音识别服务，你仍然可以使用文字输入。" }]);
    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <section className="chat-card">
      <header><div><span className="presence-dot" /><div><strong>{state.profile.name}</strong><small>{state.connection.mode === "demo" ? "演示模式" : state.connection.mode === "local" ? "本地模型" : "在线模型"}</small></div></div><button className="icon-button" onClick={() => onStateChange({ ...state, preferences: { ...state.preferences, speakReplies: !state.preferences.speakReplies } })}>{state.preferences.speakReplies ? <Volume2 size={18} /> : <VolumeX size={18} />}</button></header>
      <div className="messages">{messages.map((message, index) => message.role !== "system" && <div className={`message ${message.role}`} key={`${index}-${message.content.slice(0, 10)}`}><div className="message-avatar">{message.role === "assistant" ? <Sparkles size={15} /> : <CircleUserRound size={16} />}</div><p>{message.content}</p></div>)}{sending && <div className="message assistant"><div className="message-avatar"><Sparkles size={15} /></div><div className="typing"><i /><i /><i /></div></div>}<div ref={endRef} /></div>
      <form className="composer" onSubmit={send}><button type="button" className={`icon-button ${listening ? "recording" : ""}`} onClick={listen}>{listening ? <MicOff size={19} /> : <Mic size={19} />}</button><input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`和${state.profile.name}说点什么…`} /><button className="send-button" disabled={!input.trim() || sending}><Send size={18} /></button></form>
    </section>
  );
}

function HomeView({ state, setView, enterCompanion }: { state: AppState; setView: (view: View) => void; enterCompanion: () => void }) {
  return (
    <div className="content-scroll">
      <div className="hero-card"><div><div className="eyebrow"><Sparkles size={14} /> YOUR COMPANION IS READY</div><h1>欢迎回来{state.profile.userName ? `，${state.profile.userName}` : ""}</h1><p>{state.profile.name}正在这里。每一次对话，都会让你们的故事更完整。</p><div className="hero-actions"><button className="button primary" onClick={() => setView("chat")}><MessageCircle size={17} />开始对话</button><button className="button glass" onClick={enterCompanion}><Maximize2 size={17} />桌面伙伴模式</button></div></div><Avatar profile={state.profile} /></div>
      <div className="metric-grid"><div className="metric"><Brain /><span><strong>{state.memories.length}</strong>条长期记忆</span></div><div className="metric"><Heart /><span><strong>{state.profile.relationship}</strong>关系设定</span></div><div className="metric"><Bot /><span><strong>{state.connection.mode === "demo" ? "演示" : state.connection.mode === "local" ? "本地" : "在线"}</strong>思考模式</span></div></div>
      <div className="section-head"><div><span>成长路线</span><h2>从伙伴，到真正的个人智能体</h2></div><small>v0.1 prototype</small></div>
      <div className="roadmap-strip"><div className="roadmap-step active"><span>01</span><strong>能对话</strong><p>角色、文字、语音</p></div><div className="roadmap-step"><span>02</span><strong>有记忆</strong><p>总结、情绪、关系</p></div><div className="roadmap-step"><span>03</span><strong>会做事</strong><p>工具、屏幕、权限</p></div><div className="roadmap-step"><span>04</span><strong>随处陪伴</strong><p>插件、手机、设备</p></div></div>
    </div>
  );
}

function MemoryView({ state, onChange }: { state: AppState; onChange: (state: AppState) => void }) {
  const [draft, setDraft] = useState("");
  function addMemory() { if (!draft.trim()) return; onChange({ ...state, memories: [...state.memories, { id: crypto.randomUUID(), content: draft.trim(), createdAt: new Date().toISOString() }] }); setDraft(""); }
  return <div className="content-scroll narrow"><div className="page-heading"><span className="eyebrow"><Brain size={14} /> LONG-TERM MEMORY</span><h1>由你掌控的记忆</h1><p>记忆保存在本机，你可以随时查看、添加和删除。自动总结将在下一个里程碑加入。</p></div><div className="memory-add"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMemory()} placeholder={`希望${state.profile.name}记住什么？`} /><button className="button primary" onClick={addMemory}><Plus size={17} />添加</button></div><div className="memory-list">{state.memories.length === 0 ? <div className="empty-state"><Brain size={30} /><strong>记忆还是一张白纸</strong><p>添加一条重要信息，未来的自动总结也会显示在这里。</p></div> : state.memories.map((memory) => <div className="memory-item" key={memory.id}><div><Brain size={18} /><p>{memory.content}</p></div><button className="icon-button danger" onClick={() => onChange({ ...state, memories: state.memories.filter((item) => item.id !== memory.id) })}><Trash2 size={17} /></button></div>)}</div></div>;
}

function CreatorView({ state, onChange }: { state: AppState; onChange: (state: AppState) => void }) {
  const profile = state.profile;
  function update(patch: Partial<AssistantProfile>) { onChange({ ...state, profile: { ...profile, ...patch } }); }
  function upload(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return; const reader = new FileReader(); reader.onload = () => update({ avatarDataUrl: String(reader.result) }); reader.readAsDataURL(file); }
  return <div className="content-scroll"><div className="page-heading"><span className="eyebrow"><CircleUserRound size={14} /> CHARACTER STUDIO</span><h1>角色工作室</h1><p>形象与人格都属于你。Live2D、VRM 和生成式形象将通过统一角色接口加入。</p></div><div className="creator-grid"><div className="avatar-editor"><Avatar profile={profile} /><label className="button glass"><ImagePlus size={17} />更换形象<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /></label></div><div className="settings-card"><label className="field"><span>角色名称</span><input value={profile.name} onChange={(e) => update({ name: e.target.value })} /></label><label className="field"><span>关系</span><select value={profile.relationship} onChange={(e) => update({ relationship: e.target.value })}><option>由我决定</option><option>私人助手</option><option>朋友</option><option>亲密陪伴</option><option>学习搭档</option><option>工作伙伴</option></select></label><label className="field"><span>性格</span><input value={profile.personality} onChange={(e) => update({ personality: e.target.value })} /></label><label className="field"><span>背景故事</span><textarea value={profile.background} onChange={(e) => update({ background: e.target.value })} /></label><div className="future-feature"><WandSparkles size={20} /><div><strong>从一句话生成角色</strong><span>计划在 v0.3 通过生成插件实现</span></div></div></div></div></div>;
}

function SettingsView({ state, onChange, onSave }: { state: AppState; onChange: (state: AppState) => void; onSave: () => void }) {
  const updateConnection = (patch: Partial<ConnectionSettings>) => onChange({ ...state, connection: { ...state.connection, ...patch } });
  return <div className="content-scroll narrow"><div className="page-heading"><span className="eyebrow"><Settings size={14} /> SETTINGS</span><h1>连接与权限</h1><p>连接兼容的在线或本地模型。Hikari 不会把你的密钥写进项目文件。</p></div><div className="settings-card"><h3>模型连接</h3><div className="segmented">{([{"id":"demo","name":"演示"},{"id":"online","name":"在线"},{"id":"local","name":"本地"}] as const).map((mode) => <button className={state.connection.mode === mode.id ? "active" : ""} onClick={() => updateConnection({ mode: mode.id })} key={mode.id}>{mode.name}</button>)}</div>{state.connection.mode !== "demo" && <ConnectionFields connection={state.connection} onChange={updateConnection} />}</div><div className="settings-card"><h3>语音与安全</h3><label className="toggle-row"><div><Volume2 size={19} /><span><strong>朗读回复</strong><small>使用 Windows 当前可用的语音</small></span></div><input type="checkbox" checked={state.preferences.speakReplies} onChange={(e) => onChange({ ...state, preferences: { ...state.preferences, speakReplies: e.target.checked } })} /></label><label className="toggle-row"><div><ShieldCheck size={19} /><span><strong>危险操作必须确认</strong><small>删除、付款、发布和权限操作不会静默执行</small></span></div><input type="checkbox" checked={state.preferences.requireDangerousActionConfirmation} onChange={(e) => onChange({ ...state, preferences: { ...state.preferences, requireDangerousActionConfirmation: e.target.checked } })} disabled /></label></div><button className="button primary save-settings" onClick={onSave}><Save size={17} />保存设置</button></div>;
}

function CompanionMode({ state, exit }: { state: AppState; exit: () => void }) {
  const [listening, setListening] = useState(false);
  return <div className="companion-mode"><div className="drag-region" /><button className="companion-exit" onClick={exit}><Maximize2 size={16} />返回主界面</button><Avatar profile={state.profile} /><div className="companion-bubble"><strong>{state.profile.name}</strong><span>{listening ? "正在聆听…" : "我在这里"}</span><button onClick={() => setListening(!listening)}>{listening ? <MicOff size={21} /> : <Mic size={21} />}</button></div></div>;
}

export default function App() {
  const [state, setState] = useState<AppState>(cloneEmptyState());
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("home");
  const [companionMode, setCompanionMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api().getState().then((loaded) => { setState(loaded); setReady(true); }); }, []);
  const save = async (next = state) => { await api().saveState(next); setSaved(true); window.setTimeout(() => setSaved(false), 1600); };
  const update = (next: AppState) => { setState(next); void save(next); };
  const finishOnboarding = () => { const next = { ...state, onboarded: true }; setState(next); void save(next); };
  const enterCompanion = async () => { setCompanionMode(true); await api().setCompanionMode(true); };
  const exitCompanion = async () => { setCompanionMode(false); await api().setCompanionMode(false); };

  const content = useMemo(() => {
    if (view === "chat") return <div className="chat-view"><div className="chat-character"><Avatar profile={state.profile} /><h2>{state.profile.name}</h2><p>{state.profile.personality}</p></div><ChatPanel state={state} onStateChange={update} /></div>;
    if (view === "memory") return <MemoryView state={state} onChange={update} />;
    if (view === "creator") return <CreatorView state={state} onChange={update} />;
    if (view === "settings") return <SettingsView state={state} onChange={setState} onSave={() => void save()} />;
    return <HomeView state={state} setView={setView} enterCompanion={enterCompanion} />;
  }, [state, view]);

  if (!ready) return <div className="loading-screen"><Sparkles size={28} /><span>正在唤醒 Hikari</span></div>;
  if (!state.onboarded) return <Onboarding state={state} onChange={setState} onFinish={finishOnboarding} />;
  if (companionMode) return <CompanionMode state={state} exit={exitCompanion} />;

  return <div className="app-shell"><TitleBar /><div className="app-body"><Sidebar view={view} setView={setView} profile={state.profile} /><main className="main-content">{content}</main></div>{saved && <div className="save-toast"><Check size={15} />已安全保存</div>}</div>;
}

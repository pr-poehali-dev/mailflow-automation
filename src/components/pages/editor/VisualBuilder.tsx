import { useState } from "react";
import Icon from "@/components/ui/icon";

export type BlockType = "heading" | "text" | "button" | "image" | "divider" | "spacer" | "social";

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, string>;
}

interface Props {
  blocks: EmailBlock[];
  setBlocks: (blocks: EmailBlock[]) => void;
}

const BLOCK_TEMPLATES: { type: BlockType; label: string; icon: string; defaults: Record<string, string> }[] = [
  { type: "heading", label: "Заголовок", icon: "Heading1", defaults: { text: "Ваш заголовок", color: "#0f172a", size: "28" } },
  { type: "text", label: "Текст", icon: "Type", defaults: { text: "Расскажите вашу историю или предложите ценность подписчику.", color: "#334155" } },
  { type: "button", label: "Кнопка", icon: "MousePointer2", defaults: { text: "Подробнее", url: "https://", bg: "#8b5cf6", color: "#ffffff" } },
  { type: "image", label: "Картинка", icon: "Image", defaults: { url: "https://cdn.poehali.dev/projects/df509c93-edd2-4e54-ac32-d2c53a5dae4f/files/140b4350-3b91-49f1-8345-a48f05f3c289.jpg", alt: "" } },
  { type: "divider", label: "Разделитель", icon: "Minus", defaults: { color: "#e2e8f0" } },
  { type: "spacer", label: "Отступ", icon: "MoveVertical", defaults: { height: "24" } },
  { type: "social", label: "Соцсети", icon: "Share2", defaults: { vk: "https://vk.com/", tg: "https://t.me/", site: "https://" } },
];

const uid = () => Math.random().toString(36).slice(2, 9);

export default function VisualBuilder({ blocks, setBlocks }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<BlockType | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const addBlock = (type: BlockType, atIndex?: number) => {
    const tpl = BLOCK_TEMPLATES.find((t) => t.type === type)!;
    const block: EmailBlock = { id: uid(), type, content: { ...tpl.defaults } };
    const next = [...blocks];
    if (atIndex === undefined) next.push(block);
    else next.splice(atIndex, 0, block);
    setBlocks(next);
    setSelectedId(block.id);
  };

  const moveBlock = (fromId: string, toIndex: number) => {
    const fromIndex = blocks.findIndex((b) => b.id === fromId);
    if (fromIndex < 0) return;
    const next = [...blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(fromIndex < toIndex ? toIndex - 1 : toIndex, 0, moved);
    setBlocks(next);
  };

  const updateBlock = (id: string, patch: Record<string, string>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...patch } } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = blocks.find((b) => b.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Палитра */}
      <div className="lg:col-span-3 glass rounded-2xl p-3 space-y-1.5 h-fit">
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
          Блоки — перетащите
        </div>
        {BLOCK_TEMPLATES.map((t) => (
          <div
            key={t.type}
            draggable
            onDragStart={() => { setDraggingType(t.type); setDraggingId(null); }}
            onDragEnd={() => setDraggingType(null)}
            onClick={() => addBlock(t.type)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary cursor-grab active:cursor-grabbing transition-colors"
            style={{ background: "rgba(139,92,246,0.05)" }}
          >
            <Icon name={t.icon} size={15} style={{ color: "#8b5cf6" }} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Канвас письма */}
      <div className="lg:col-span-6">
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Icon name="Eye" size={12} />
            Превью письма
          </div>
          <div
            className="bg-white rounded-xl p-4 sm:p-6 min-h-[300px] space-y-1"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingType) {
                addBlock(draggingType);
                setDraggingType(null);
              }
            }}
          >
            {blocks.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                Перетащите сюда блок из палитры слева
                <div className="mt-2 text-xs">или кликните по любому блоку</div>
              </div>
            )}
            {blocks.map((b, i) => (
              <div key={b.id}>
                {/* Drop zone сверху */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingType) addBlock(draggingType, i);
                    else if (draggingId) moveBlock(draggingId, i);
                    setDraggingType(null);
                    setDraggingId(null);
                  }}
                  className="h-1.5 rounded transition-colors hover:bg-purple-200"
                />
                <div
                  draggable
                  onDragStart={() => { setDraggingId(b.id); setDraggingType(null); }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => setSelectedId(b.id)}
                  className={`relative group cursor-pointer transition-all ${
                    selectedId === b.id ? "ring-2 ring-purple-500 ring-offset-1" : ""
                  }`}
                >
                  <BlockPreview block={b} />
                  {selectedId === b.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBlock(b.id); }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {blocks.length > 0 && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingType) addBlock(draggingType);
                  setDraggingType(null);
                  setDraggingId(null);
                }}
                className="h-3 rounded transition-colors hover:bg-purple-200"
              />
            )}
          </div>
        </div>
      </div>

      {/* Свойства */}
      <div className="lg:col-span-3 glass rounded-2xl p-4 h-fit">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Свойства блока
        </div>
        {!selected ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            Выберите блок, чтобы настроить
          </div>
        ) : (
          <BlockSettings block={selected} onChange={(patch) => updateBlock(selected.id, patch)} />
        )}
      </div>
    </div>
  );
}

// ─── Превью блока ─────────────────────────────────────────────────────────────
function BlockPreview({ block }: { block: EmailBlock }) {
  const c = block.content;
  switch (block.type) {
    case "heading":
      return (
        <h2 style={{ color: c.color, fontSize: `${c.size}px`, margin: "12px 0", fontWeight: 700, lineHeight: 1.2 }}>
          {c.text}
        </h2>
      );
    case "text":
      return (
        <p style={{ color: c.color, margin: "8px 0", lineHeight: 1.6, fontSize: 15 }}>
          {c.text}
        </p>
      );
    case "button":
      return (
        <div style={{ textAlign: "center", margin: "16px 0" }}>
          <a style={{
            display: "inline-block", padding: "12px 28px", borderRadius: 12,
            background: c.bg, color: c.color, textDecoration: "none", fontWeight: 600, fontSize: 14,
          }}>
            {c.text}
          </a>
        </div>
      );
    case "image":
      return (
        <img src={c.url} alt={c.alt}
          style={{ maxWidth: "100%", borderRadius: 8, display: "block", margin: "8px auto" }} />
      );
    case "divider":
      return <hr style={{ border: "none", borderTop: `1px solid ${c.color}`, margin: "16px 0" }} />;
    case "spacer":
      return <div style={{ height: `${c.height}px` }} />;
    case "social":
      return (
        <div style={{ textAlign: "center", margin: "12px 0", display: "flex", gap: 12, justifyContent: "center" }}>
          <a style={{ color: "#475569", fontSize: 13 }}>VK</a>
          <a style={{ color: "#475569", fontSize: 13 }}>Telegram</a>
          <a style={{ color: "#475569", fontSize: 13 }}>Сайт</a>
        </div>
      );
  }
}

// ─── Настройки блока ──────────────────────────────────────────────────────────
function BlockSettings({ block, onChange }: { block: EmailBlock; onChange: (p: Record<string, string>) => void }) {
  const c = block.content;
  const F = ({ label, value, onChange: oc, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => oc(e.target.value)}
        className="w-full bg-background/60 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500"
      />
    </div>
  );
  return (
    <div className="space-y-3">
      {block.type === "heading" && (
        <>
          <F label="Текст" value={c.text} onChange={(v) => onChange({ text: v })} />
          <F label="Цвет" value={c.color} onChange={(v) => onChange({ color: v })} type="color" />
          <F label="Размер" value={c.size} onChange={(v) => onChange({ size: v })} type="number" />
        </>
      )}
      {block.type === "text" && (
        <>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Текст</label>
            <textarea value={c.text} onChange={(e) => onChange({ text: e.target.value })}
              rows={4}
              className="w-full bg-background/60 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 resize-none" />
          </div>
          <F label="Цвет" value={c.color} onChange={(v) => onChange({ color: v })} type="color" />
        </>
      )}
      {block.type === "button" && (
        <>
          <F label="Текст" value={c.text} onChange={(v) => onChange({ text: v })} />
          <F label="Ссылка" value={c.url} onChange={(v) => onChange({ url: v })} />
          <F label="Фон" value={c.bg} onChange={(v) => onChange({ bg: v })} type="color" />
          <F label="Цвет текста" value={c.color} onChange={(v) => onChange({ color: v })} type="color" />
        </>
      )}
      {block.type === "image" && (
        <>
          <F label="URL картинки" value={c.url} onChange={(v) => onChange({ url: v })} />
          <F label="Alt-текст" value={c.alt} onChange={(v) => onChange({ alt: v })} />
        </>
      )}
      {block.type === "divider" && (
        <F label="Цвет линии" value={c.color} onChange={(v) => onChange({ color: v })} type="color" />
      )}
      {block.type === "spacer" && (
        <F label="Высота, px" value={c.height} onChange={(v) => onChange({ height: v })} type="number" />
      )}
      {block.type === "social" && (
        <>
          <F label="VK" value={c.vk} onChange={(v) => onChange({ vk: v })} />
          <F label="Telegram" value={c.tg} onChange={(v) => onChange({ tg: v })} />
          <F label="Сайт" value={c.site} onChange={(v) => onChange({ site: v })} />
        </>
      )}
    </div>
  );
}

// ─── Конвертация в HTML / текст для отправки ──────────────────────────────────
export function blocksToHtml(blocks: EmailBlock[]): string {
  const inner = blocks.map((b) => {
    const c = b.content;
    switch (b.type) {
      case "heading":
        return `<h2 style="color:${c.color};font-size:${c.size}px;margin:12px 0;font-weight:700;line-height:1.2">${escapeHtml(c.text)}</h2>`;
      case "text":
        return `<p style="color:${c.color};margin:8px 0;line-height:1.6;font-size:15px">${escapeHtml(c.text).replace(/\n/g, "<br/>")}</p>`;
      case "button":
        return `<div style="text-align:center;margin:16px 0"><a href="${escapeAttr(c.url)}" style="display:inline-block;padding:12px 28px;border-radius:12px;background:${c.bg};color:${c.color};text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(c.text)}</a></div>`;
      case "image":
        return `<img src="${escapeAttr(c.url)}" alt="${escapeAttr(c.alt)}" style="max-width:100%;border-radius:8px;display:block;margin:8px auto"/>`;
      case "divider":
        return `<hr style="border:none;border-top:1px solid ${c.color};margin:16px 0"/>`;
      case "spacer":
        return `<div style="height:${c.height}px"></div>`;
      case "social":
        return `<div style="text-align:center;margin:12px 0"><a href="${escapeAttr(c.vk)}" style="color:#475569;font-size:13px;margin:0 6px">VK</a><a href="${escapeAttr(c.tg)}" style="color:#475569;font-size:13px;margin:0 6px">Telegram</a><a href="${escapeAttr(c.site)}" style="color:#475569;font-size:13px;margin:0 6px">Сайт</a></div>`;
    }
  }).join("\n");

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,system-ui,sans-serif"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px">${inner}</div></body></html>`;
}

export function blocksToText(blocks: EmailBlock[]): string {
  return blocks.map((b) => {
    const c = b.content;
    switch (b.type) {
      case "heading":
      case "text":
        return c.text;
      case "button":
        return `${c.text}: ${c.url}`;
      case "image":
        return c.alt || "";
      case "divider":
        return "---";
      default:
        return "";
    }
  }).filter(Boolean).join("\n\n");
}

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return String(s || "").replace(/"/g, "&quot;");
}

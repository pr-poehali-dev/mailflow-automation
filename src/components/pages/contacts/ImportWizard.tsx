import { useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { importContacts } from "@/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface ParsedRow {
  name: string;
  email: string;
  segment: string;
  raw: string;
}

interface CleanResult {
  valid: ParsedRow[];
  invalid: ParsedRow[];
  duplicates: ParsedRow[];
  disposable: ParsedRow[];
}

const DISPOSABLE_DOMAINS = [
  "mailinator.com", "10minutemail.com", "tempmail.com", "guerrillamail.com",
  "yopmail.com", "throwaway.email", "fakemail.com", "trashmail.com",
  "temp-mail.org", "dispostable.com", "maildrop.cc", "getnada.com",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  // Угадываем колонки
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("email") || header.includes("mail") || header.includes("почт");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    let name = "", email = "", segment = "Новый";
    // Email — это любая часть с @
    for (const p of parts) {
      if (p.includes("@") && !email) email = p;
      else if (!name) name = p;
      else if (!segment || segment === "Новый") segment = p;
    }
    return { name, email: email.toLowerCase(), segment: segment || "Новый", raw: line };
  });
}

function clean(rows: ParsedRow[]): CleanResult {
  const seen = new Set<string>();
  const valid: ParsedRow[] = [];
  const invalid: ParsedRow[] = [];
  const duplicates: ParsedRow[] = [];
  const disposable: ParsedRow[] = [];

  for (const r of rows) {
    if (!r.email || !EMAIL_RE.test(r.email)) {
      invalid.push(r);
      continue;
    }
    const domain = r.email.split("@")[1];
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      disposable.push(r);
      continue;
    }
    if (seen.has(r.email)) {
      duplicates.push(r);
      continue;
    }
    seen.add(r.email);
    valid.push(r);
  }
  return { valid, invalid, duplicates, disposable };
}

export default function ImportWizard({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cleaned = useMemo(() => clean(rows), [rows]);

  const reset = () => {
    setStep(1);
    setRows([]);
    setFileName("");
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    setRows(parseCsv(text));
    setStep(2);
  };

  const handleImport = async () => {
    setImporting(true);
    const payload = cleaned.valid.map((r) => ({ name: r.name, email: r.email, segment: r.segment }));
    const res = await importContacts(payload);
    setResult({ inserted: res.inserted || 0, failed: payload.length - (res.inserted || 0) });
    setImporting(false);
    setStep(5);
    onImported();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 fade-in-up overflow-y-auto"
      style={{ background: "rgba(10, 10, 22, 0.75)", backdropFilter: "blur(8px)" }}
      onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl w-full max-w-2xl my-auto max-h-[calc(100vh-1.5rem)] overflow-y-auto"
        style={{ border: "1px solid rgba(139,92,246,0.25)" }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Icon name="Upload" size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold">Импорт контактов</div>
              <div className="text-xs text-muted-foreground">Шаг {step} из 5</div>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full transition-colors"
                style={{ background: s <= step ? "#8b5cf6" : "var(--border)" }} />
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* STEP 1 — Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.1)" }}>
                  <Icon name="FileText" size={28} style={{ color: "#8b5cf6" }} />
                </div>
                <h3 className="font-bold text-lg mb-2">Загрузите CSV-файл</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Поддерживаем CSV, TSV и текстовые файлы. Колонки: имя, email, сегмент. Заголовок необязателен.
                </p>
                <input ref={fileRef} type="file" accept=".csv,.tsv,.txt"
                  className="hidden" onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                  Выбрать файл
                </button>
              </div>
              <div className="rounded-xl p-3 text-xs text-muted-foreground"
                style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={14} style={{ color: "#06b6d4" }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground mb-1">Пример формата:</div>
                    <code className="block font-mono-custom">
                      name,email,segment<br/>
                      Анна,anna@mail.ru,VIP<br/>
                      Дмитрий,d@yandex.ru,Активный
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-1">Предпросмотр</h3>
                <p className="text-xs text-muted-foreground">
                  Файл «{fileName}» — найдено {rows.length} строк
                </p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left px-3 py-2">Имя</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">Сегмент</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2">{r.name || "—"}</td>
                          <td className="px-3 py-2 font-mono-custom">{r.email}</td>
                          <td className="px-3 py-2">{r.segment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && (
                  <div className="text-center py-2 text-xs text-muted-foreground border-t border-border bg-secondary/20">
                    … и ещё {rows.length - 10} строк
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary">
                  Назад
                </button>
                <button onClick={() => setStep(3)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                  Проверить базу
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Validation */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-1">Проверка качества</h3>
                <p className="text-xs text-muted-foreground">
                  Чем чище база — тем выше доставляемость и лучше репутация домена
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="CheckCircle" size={14} style={{ color: "#10b981" }} />
                    <span className="text-xs font-semibold">Валидные</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "#10b981" }}>{cleaned.valid.length}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="XCircle" size={14} style={{ color: "#ef4444" }} />
                    <span className="text-xs font-semibold">Невалидные</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "#ef4444" }}>{cleaned.invalid.length}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Copy" size={14} style={{ color: "#f59e0b" }} />
                    <span className="text-xs font-semibold">Дубликаты</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{cleaned.duplicates.length}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.25)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="ShieldAlert" size={14} style={{ color: "#ec4899" }} />
                    <span className="text-xs font-semibold">Одноразовые</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "#ec4899" }}>{cleaned.disposable.length}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground rounded-xl p-3"
                style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
                Невалидные адреса, дубликаты и одноразовые ящики будут пропущены — это защитит репутацию вашего домена и улучшит доставляемость.
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary">
                  Назад
                </button>
                <button onClick={() => setStep(4)}
                  disabled={cleaned.valid.length === 0}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                  Далее
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-1">Подтверждение импорта</h3>
                <p className="text-xs text-muted-foreground">Проверьте итоговые цифры перед загрузкой</p>
              </div>
              <div className="rounded-xl p-5 text-center"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.05))",
                  border: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="text-5xl font-bold gradient-text mb-2">{cleaned.valid.length}</div>
                <div className="text-sm text-muted-foreground">контактов будет добавлено в базу</div>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Загружено из файла:</span>
                  <span className="font-semibold">{rows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Пропущено невалидных:</span>
                  <span className="font-semibold">{cleaned.invalid.length + cleaned.duplicates.length + cleaned.disposable.length}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="font-semibold">К импорту:</span>
                  <span className="font-bold" style={{ color: "#10b981" }}>{cleaned.valid.length}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} disabled={importing}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary disabled:opacity-50">
                  Назад
                </button>
                <button onClick={handleImport} disabled={importing}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                  {importing && <Icon name="Loader2" size={14} className="animate-spin" />}
                  Импортировать
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Done */}
          {step === 5 && result && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)" }}>
                <Icon name="Check" size={32} style={{ color: "#10b981" }} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Импорт завершён</h3>
                <p className="text-sm text-muted-foreground">
                  Добавлено <span className="font-bold text-foreground">{result.inserted}</span> контактов в базу
                </p>
              </div>
              <button onClick={handleClose}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                Готово
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

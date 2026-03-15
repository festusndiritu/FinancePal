"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, X, PiggyBank, CheckCircle2, Clock } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { cn } from "@/lib/utils";

// ── types ─────────────────────────────────────────────────────────────────────

type SavingsGoal = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  progressPercent: number;
};

type GoalForm = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  color: string;
};

const PRESET_COLORS = [
  "#0369a1", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#db2777", "#dc2626", "#374151",
];

function defaultForm(goal?: SavingsGoal | null): GoalForm {
  if (goal) {
    return {
      name:          goal.name,
      targetAmount:  String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      deadline:      goal.deadline.slice(0, 10),
      color:         goal.color,
    };
  }
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return { name: "", targetAmount: "", currentAmount: "0", deadline: d.toISOString().slice(0, 10), color: "#0369a1" };
}

// ── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r      = (size - 10) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

// ── Goal card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete, onDeposit }: {
  goal: SavingsGoal;
  onEdit:    (g: SavingsGoal) => void;
  onDelete:  (g: SavingsGoal) => void;
  onDeposit: (g: SavingsGoal) => void;
}) {
  const pct       = Math.min(goal.progressPercent, 100);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const deadline  = new Date(goal.deadline);
  const daysLeft  = differenceInDays(deadline, new Date());
  const overdue   = isPast(deadline) && pct < 100;
  const done      = pct >= 100;

  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <ProgressRing pct={pct} color={done ? "#10b981" : goal.color} size={52} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
              style={{ color: done ? "#10b981" : goal.color }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div>
            <p className="font-black text-slate-900">{goal.name}</p>
            <div className="mt-0.5 flex items-center gap-1">
              {done ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Goal reached!
                </span>
              ) : overdue ? (
                <span className="text-xs font-bold text-red-500">Overdue</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {daysLeft} days · {format(deadline, "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <button onClick={() => onEdit(goal)} aria-label="Edit"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={() => onDelete(goal)} aria-label="Delete"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-slate-900">KES {goal.currentAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-400">of KES {goal.targetAmount.toLocaleString()}</p>
        </div>
        {!done && (
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: goal.color }}>KES {remaining.toLocaleString()}</p>
            <p className="text-xs text-slate-400">to go</p>
          </div>
        )}
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: done ? "#10b981" : goal.color }} />
      </div>

      {!done && (
        <button onClick={() => onDeposit(goal)}
          className="w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
          + Add deposit
        </button>
      )}
    </div>
  );
}

// ── Modal content ─────────────────────────────────────────────────────────────

function ModalContent({ mode, form, setForm, saving, error, onSave, onClose }: {
  mode: "add" | "edit"; form: GoalForm;
  setForm: React.Dispatch<React.SetStateAction<GoalForm>>;
  saving: boolean; error: string | null; onSave: () => void; onClose: () => void;
}) {
  const set = (k: keyof GoalForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900">{mode === "add" ? "New Savings Goal" : "Edit Goal"}</h2>
          <p className="text-xs text-slate-500">Track progress toward a financial target</p>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-600">Goal name</label>
        <input value={form.name} onChange={set("name")} placeholder="e.g. Emergency fund, New laptop"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:bg-white transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Target (KES)</label>
          <input type="number" min={1} value={form.targetAmount} onChange={set("targetAmount")} placeholder="50000"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-colors" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Saved so far (KES)</label>
          <input type="number" min={0} value={form.currentAmount} onChange={set("currentAmount")} placeholder="0"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-colors" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-600">Target date</label>
        <input type="date" value={form.deadline} onChange={set("deadline")}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-colors" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-600">Colour</label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
              className={cn("h-7 w-7 rounded-full transition-all", form.color === c ? "ring-2 ring-offset-2 ring-sky-400 scale-110" : "opacity-70 hover:opacity-100")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={onSave} disabled={saving || !form.name || !form.targetAmount}
          className="flex-1 rounded-xl bg-sky-900 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:opacity-40">
          {saving ? "Saving…" : mode === "add" ? "Create Goal" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Goal modal ────────────────────────────────────────────────────────────────

function GoalModal({ mode, goal, saving, error, onSave, onClose }: {
  mode: "add" | "edit"; goal: SavingsGoal | null;
  saving: boolean; error: string | null;
  onSave: (form: GoalForm, id?: string) => void; onClose: () => void;
}) {
  const [form, setForm]   = useState<GoalForm>(() => defaultForm(goal));
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  useEffect(() => { setForm(defaultForm(goal)); }, [goal]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} className="bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Mobile */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} className="flex items-end md:hidden">
        <div className={cn("w-full rounded-t-2xl bg-white shadow-2xl transition-transform duration-300", visible ? "translate-y-0" : "translate-y-full")}>
          <div className="flex justify-center pb-1 pt-3"><div className="h-1 w-10 rounded-full bg-slate-200" /></div>
          <div className="px-5 pb-8 pt-3">
            <ModalContent mode={mode} form={form} setForm={setForm} saving={saving} error={error}
              onSave={() => onSave(form, goal?._id)} onClose={onClose} />
          </div>
        </div>
      </div>
      {/* Desktop */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} className="hidden items-center justify-center md:flex">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <ModalContent mode={mode} form={form} setForm={setForm} saving={saving} error={error}
            onSave={() => onSave(form, goal?._id)} onClose={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Deposit modal ─────────────────────────────────────────────────────────────

function DepositModal({ goal, onConfirm, onClose }: {
  goal: SavingsGoal; onConfirm: (amount: number) => Promise<void>; onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} className="flex items-center justify-center px-4">
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} className="bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div style={{ position: "relative", zIndex: 9999 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-1 font-black text-slate-900">Add deposit</h3>
        <p className="mb-4 text-sm text-slate-500">
          Adding to <span className="font-semibold text-slate-700">{goal.name}</span>
          {" · "}KES {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} saved
        </p>
        <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)}
          autoFocus placeholder="Amount in KES"
          className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-colors" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={async () => { setSaving(true); await onConfirm(Number(amount)); setSaving(false); }}
            disabled={!amount || saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: goal.color }}>
            {saving ? "Saving…" : "Add deposit"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteGoalDialog({ goal, deleting, onConfirm, onClose }: {
  goal: SavingsGoal; deleting: boolean; onConfirm: () => void; onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} className="flex items-center justify-center px-4">
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} className="bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div style={{ position: "relative", zIndex: 9999 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl">🎯</div>
          <div>
            <h3 className="font-black text-slate-900">Delete goal?</h3>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{goal.name}</span> and all its progress will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type Props = { data?: SavingsGoal[] };

export default function SavingsTracker({ data: initialData }: Props) {
  const [goals, setGoals]   = useState<SavingsGoal[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError]   = useState<string | null>(null);

  const [modalMode, setModalMode]       = useState<"add" | "edit" | null>(null);
  const [editingGoal, setEditingGoal]   = useState<SavingsGoal | null>(null);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [depositGoal, setDepositGoal]   = useState<SavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Keep a stable ref to load() so the event listener never goes stale
  const loadRef = useRef<(() => Promise<void>) | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    const res = await fetch("/api/savings");
    if (!res.ok) { setError("Failed to load savings goals."); setLoading(false); return; }
    const payload = (await res.json()) as { data: SavingsGoal[] };
    setGoals(payload.data);
    setLoading(false);
  };

  loadRef.current = load;

  // Initial load (standalone mode only — when used inside Reports, data is passed as prop)
  useEffect(() => {
    if (!initialData) void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync when parent passes new data (Reports page)
  useEffect(() => {
    if (initialData) setGoals(initialData);
  }, [initialData]);

  // ── Listen for savings updates from chat / FAB ──────────────────────────
  useEffect(() => {
    const handler = () => { void loadRef.current?.(); };
    window.addEventListener("financepal:savings-updated", handler);
    return () => window.removeEventListener("financepal:savings-updated", handler);
  }, []);

  const openAdd    = () => { setEditingGoal(null);  setSaveError(null); setModalMode("add"); };
  const openEdit   = (g: SavingsGoal) => { setEditingGoal(g); setSaveError(null); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setEditingGoal(null); setSaveError(null); };

  const handleSave = async (form: GoalForm, id?: string) => {
    if (!form.name || !form.targetAmount) { setSaveError("Name and target are required."); return; }
    setSaving(true); setSaveError(null);
    const body = {
      name: form.name, targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      deadline: new Date(form.deadline).toISOString(), color: form.color,
    };
    const res = await fetch("/api/savings", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { ...body, id } : body),
    });
    setSaving(false);
    if (!res.ok) { setSaveError("Something went wrong."); return; }
    closeModal();
    await load();
  };

  const handleDeposit = async (amount: number) => {
    if (!depositGoal) return;
    const res = await fetch("/api/savings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: depositGoal._id, currentAmount: depositGoal.currentAmount + amount }),
    });
    if (res.ok) { setDepositGoal(null); await load(); }
  };

  const handleDelete = async () => {
    if (!deletingGoal) return;
    setDeleting(true);
    const res = await fetch(`/api/savings?id=${deletingGoal._id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { setDeletingGoal(null); await load(); }
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completed   = goals.filter((g) => g.progressPercent >= 100).length;

  return (
    <div>
      {goals.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Total saved",  value: `KES ${totalSaved.toLocaleString()}` },
            { label: "Total target", value: `KES ${totalTarget.toLocaleString()}` },
            { label: "Completed",    value: `${completed} / ${goals.length}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-xs font-bold text-slate-400">{s.label}</p>
              <p className="mt-0.5 text-sm font-black text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-sky-900 px-4 py-2 text-xs font-bold text-white hover:bg-sky-800">
          <Plus className="h-3.5 w-3.5" /> New Goal
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
          <PiggyBank className="h-10 w-10 text-slate-300" />
          <div>
            <p className="text-sm font-black text-slate-600">No savings goals yet</p>
            <p className="text-xs text-slate-400">Create a goal to start tracking your progress.</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-sky-900 px-4 py-2 text-xs font-bold text-white hover:bg-sky-800">
            <Plus className="h-3.5 w-3.5" /> Create first goal
          </button>
        </div>
      )}

      {!loading && !error && goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g._id} goal={g} onEdit={openEdit} onDelete={setDeletingGoal} onDeposit={setDepositGoal} />
          ))}
        </div>
      )}

      {modalMode && (
        <GoalModal mode={modalMode} goal={editingGoal} saving={saving} error={saveError}
          onSave={handleSave} onClose={closeModal} />
      )}
      {depositGoal && (
        <DepositModal goal={depositGoal} onConfirm={handleDeposit} onClose={() => setDepositGoal(null)} />
      )}
      {deletingGoal && (
        <DeleteGoalDialog goal={deletingGoal} deleting={deleting} onConfirm={handleDelete} onClose={() => setDeletingGoal(null)} />
      )}
    </div>
  );
}
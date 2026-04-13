"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Home,
  ListTodo,
  PauseCircle,
  Pencil,
  Plus,
  SkipForward,
  Trash2,
} from "lucide-react";

type DueStatus = "unpaid" | "paid" | "overdue" | "skipped";
type Recurrence = "none" | "weekly" | "biweekly" | "monthly" | "custom";
type BillType = "fixed_recurring" | "variable_recurring" | "installment" | "manual";

type BillTemplate = {
  id: string;
  name: string;
  category: string;
  billType: BillType;
  defaultAmount: number;
  recurrence: Recurrence;
  customDays: number;
  firstDueDate: string;
  nextDueDate: string;
  reminders: number[];
  notes: string;
  active: boolean;
  autoGenerate: boolean;
  installmentsRemaining?: number;
};

type DueItem = {
  id: string;
  templateId: string | null;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  status: DueStatus;
  notes: string;
  sourceType: "template" | "manual";
};

type FormState = {
  id: string | null;
  name: string;
  amount: string;
  category: string;
  billType: BillType;
  firstDueDate: string;
  recurrence: Recurrence;
  customDays: number;
  reminders: number[];
  notes: string;
  autoGenerate: boolean;
  active: boolean;
  installmentsRemaining: number;
};

const categories = [
  "Credit Card",
  "Installment",
  "Utilities",
  "Housing",
  "Internet",
  "Insurance",
  "Loan",
  "Manual",
  "Other",
];

const recurrenceLabel: Record<Recurrence, string> = {
  none: "One time",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  custom: "Custom",
};

const today = new Date("2026-04-10T12:00:00");

const initialTemplates: BillTemplate[] = [
  {
    id: "tpl-1",
    name: "Barclays Forward",
    category: "Credit Card",
    billType: "fixed_recurring",
    defaultAmount: 125,
    recurrence: "monthly",
    customDays: 30,
    firstDueDate: "2026-04-08",
    nextDueDate: "2026-04-08",
    reminders: [3, 1],
    notes: "Main card payment",
    active: true,
    autoGenerate: true,
  },
  {
    id: "tpl-2",
    name: "Barclays Card",
    category: "Credit Card",
    billType: "variable_recurring",
    defaultAmount: 220,
    recurrence: "monthly",
    customDays: 30,
    firstDueDate: "2026-04-18",
    nextDueDate: "2026-04-18",
    reminders: [3, 1],
    notes: "Amount can change before payment",
    active: true,
    autoGenerate: true,
  },
  {
    id: "tpl-3",
    name: "Monzo Flex",
    category: "Installment",
    billType: "installment",
    defaultAmount: 74,
    recurrence: "monthly",
    customDays: 30,
    firstDueDate: "2026-04-11",
    nextDueDate: "2026-04-11",
    reminders: [1],
    notes: "3 payments remaining",
    active: true,
    autoGenerate: true,
    installmentsRemaining: 3,
  },
  {
    id: "tpl-4",
    name: "Klarna",
    category: "Installment",
    billType: "installment",
    defaultAmount: 42,
    recurrence: "monthly",
    customDays: 30,
    firstDueDate: "2026-04-23",
    nextDueDate: "2026-04-23",
    reminders: [3, 1],
    notes: "2 payments remaining",
    active: true,
    autoGenerate: true,
    installmentsRemaining: 2,
  },
  {
    id: "tpl-5",
    name: "Rent",
    category: "Housing",
    billType: "fixed_recurring",
    defaultAmount: 550,
    recurrence: "monthly",
    customDays: 30,
    firstDueDate: "2026-04-01",
    nextDueDate: "2026-05-01",
    reminders: [3, 1],
    notes: "Fixed monthly rent",
    active: true,
    autoGenerate: true,
  },
];

const initialDues: DueItem[] = [
  {
    id: "due-1",
    templateId: "tpl-1",
    name: "Barclays Forward",
    category: "Credit Card",
    amount: 125,
    dueDate: "2026-04-08",
    status: "overdue",
    notes: "Main card payment",
    sourceType: "template",
  },
  {
    id: "due-2",
    templateId: "tpl-3",
    name: "Monzo Flex",
    category: "Installment",
    amount: 74,
    dueDate: "2026-04-11",
    status: "unpaid",
    notes: "Installment 1 of 3",
    sourceType: "template",
  },
  {
    id: "due-3",
    templateId: "tpl-2",
    name: "Barclays Card",
    category: "Credit Card",
    amount: 220,
    dueDate: "2026-04-18",
    status: "unpaid",
    notes: "Editable amount",
    sourceType: "template",
  },
  {
    id: "due-4",
    templateId: "tpl-4",
    name: "Klarna",
    category: "Installment",
    amount: 42,
    dueDate: "2026-04-23",
    status: "unpaid",
    notes: "Installment 1 of 2",
    sourceType: "template",
  },
  {
    id: "due-5",
    templateId: null,
    name: "Manual Water Bill",
    category: "Utilities",
    amount: 38.32,
    dueDate: "2026-04-10",
    status: "unpaid",
    notes: "User-added one-time bill",
    sourceType: "manual",
  },
  {
    id: "due-6",
    templateId: "tpl-5",
    name: "Rent",
    category: "Housing",
    amount: 550,
    dueDate: "2026-04-01",
    status: "paid",
    notes: "Paid via bank transfer",
    sourceType: "template",
  },
];

const emptyForm: FormState = {
  id: null,
  name: "",
  amount: "",
  category: "Manual",
  billType: "fixed_recurring",
  firstDueDate: "2026-04-15",
  recurrence: "monthly",
  customDays: 30,
  reminders: [1],
  notes: "",
  autoGenerate: true,
  active: true,
  installmentsRemaining: 3,
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 16,
  },
  hero: {
    background: "#0f172a",
    color: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  heroRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: "8px 0 6px",
    fontSize: 32,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    color: "#cbd5e1",
    maxWidth: 720,
    lineHeight: 1.5,
  },
  heroLabel: {
    margin: 0,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#94a3b8",
  },
  button: {
    border: "none",
    borderRadius: 14,
    padding: "12px 16px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
  },
  buttonPrimary: {
    background: "white",
    color: "#0f172a",
  },
  buttonDark: {
    background: "#1e293b",
    color: "white",
    border: "1px solid #334155",
  },
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  navButton: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  navButtonActive: {
    background: "#0f172a",
    color: "white",
    border: "1px solid #0f172a",
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },
  card: {
    background: "white",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    margin: "0 0 12px",
    fontSize: 18,
    fontWeight: 700,
  },
  statValue: {
    margin: "8px 0 4px",
    fontSize: 28,
    fontWeight: 700,
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  listItem: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    background: "#fff",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  badgeUnpaid: {
    background: "#fef3c7",
    color: "#92400e",
  },
  badgePaid: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeOverdue: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  badgeSkipped: {
    background: "#e2e8f0",
    color: "#334155",
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  formGrid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
    resize: "vertical",
  },
  switchBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 14,
    background: "#fafafa",
  },
  remindersWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  reminderBtn: {
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  reminderBtnActive: {
    background: "#0f172a",
    color: "white",
    border: "1px solid #0f172a",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 8,
  },
  calendarCell: {
    minHeight: 82,
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 8,
    background: "white",
    textAlign: "left",
    cursor: "pointer",
  },
  calendarCellActive: {
    background: "#0f172a",
    color: "white",
    border: "1px solid #0f172a",
  },
  smallCaps: {
    fontSize: 12,
    color: "#64748b",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
};

function fmtMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function fmtDate(value: string): string {
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

function diffDays(targetDateStr: string): number {
  const ms = new Date(`${targetDateStr}T12:00:00`).getTime() - today.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getNextDueDate(currentDate: string, recurrence: Recurrence, customDays: number): string {
  if (recurrence === "weekly") return addDays(currentDate, 7);
  if (recurrence === "biweekly") return addDays(currentDate, 14);
  if (recurrence === "monthly") {
    const d = new Date(`${currentDate}T12:00:00`);
    d.setMonth(d.getMonth() + 1);
    return dateKey(d);
  }
  if (recurrence === "custom") return addDays(currentDate, Number(customDays || 30));
  return currentDate;
}

function buildReminderText(item: DueItem, days: number): string {
  if (days === 0) return `${item.name} due today`;
  if (days === 1) return `${item.name} due tomorrow`;
  return `${item.name} due in ${days} days`;
}

function badgeStyle(status: DueStatus): React.CSSProperties {
  if (status === "paid") return { ...styles.badge, ...styles.badgePaid };
  if (status === "overdue") return { ...styles.badge, ...styles.badgeOverdue };
  if (status === "skipped") return { ...styles.badge, ...styles.badgeSkipped };
  return { ...styles.badge, ...styles.badgeUnpaid };
}

function SmallStat(props: {
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  const Icon = props.icon;
  return (
    <div style={styles.card}>
      <div style={styles.rowBetween}>
        <div>
          <div style={styles.muted}>{props.title}</div>
          <div style={styles.statValue}>{props.value}</div>
          <div style={styles.muted}>{props.hint}</div>
        </div>
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: 16,
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function CalendarGrid(props: {
  dues: DueItem[];
  onSelectDate: (value: string) => void;
  selectedDate: string;
}) {
  const monthStart = startOfMonth(today);
  const totalDays = daysInMonth(today);
  const firstWeekDay = monthStart.getDay();

  const totalsByDate = props.dues.reduce<Record<string, number>>((acc, item) => {
    const amount = item.status === "skipped" ? 0 : Number(item.amount || 0);
    acc[item.dueDate] = (acc[item.dueDate] || 0) + amount;
    return acc;
  }, {});

  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstWeekDay; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(today.getFullYear(), today.getMonth(), day));
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>April 2026</h3>

      <div style={styles.calendarGrid}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ ...styles.smallCaps, textAlign: "center", paddingBottom: 6 }}>
            {d}
          </div>
        ))}
      </div>

      <div style={styles.calendarGrid}>
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`blank-${index}`} style={{ minHeight: 82 }} />;
          }

          const key = dateKey(date);
          const selected = props.selectedDate === key;
          const total = totalsByDate[key] || 0;

          return (
            <button
              key={key}
              onClick={() => props.onSelectDate(key)}
              style={{
                ...styles.calendarCell,
                ...(selected ? styles.calendarCellActive : {}),
              }}
            >
              <div style={{ fontWeight: 700 }}>{date.getDate()}</div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: selected ? "#cbd5e1" : "#64748b",
                }}
              >
                {total > 0 ? fmtMoney(total) : "—"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BillForm(props: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { form, setForm, onSave, onCancel } = props;

  function toggleReminder(day: number) {
    setForm((prev) => ({
      ...prev,
      reminders: prev.reminders.includes(day)
        ? prev.reminders.filter((x) => x !== day)
        : [...prev.reminders, day].sort((a, b) => a - b),
    }));
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{form.id ? "Edit bill template" : "Add new bill"}</h3>

      <div style={styles.formGrid2}>
        <div>
          <label style={styles.label}>Bill name</label>
          <input
            style={styles.input}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Barclays Card"
          />
        </div>

        <div>
          <label style={styles.label}>Amount</label>
          <input
            style={styles.input}
            type="number"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div style={styles.formGrid3}>
        <div>
          <label style={styles.label}>Category</label>
          <select
            style={styles.input}
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={styles.label}>Bill type</label>
          <select
            style={styles.input}
            value={form.billType}
            onChange={(e) => setForm((p) => ({ ...p, billType: e.target.value as BillType }))}
          >
            <option value="fixed_recurring">Fixed recurring</option>
            <option value="variable_recurring">Variable recurring</option>
            <option value="installment">Installment</option>
            <option value="manual">Manual one-time</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>First due date</label>
          <input
            style={styles.input}
            type="date"
            value={form.firstDueDate}
            onChange={(e) => setForm((p) => ({ ...p, firstDueDate: e.target.value }))}
          />
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div style={styles.formGrid3}>
        <div>
          <label style={styles.label}>Recurrence</label>
          <select
            style={styles.input}
            value={form.recurrence}
            onChange={(e) => setForm((p) => ({ ...p, recurrence: e.target.value as Recurrence }))}
          >
            <option value="none">One time</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom interval</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Custom repeat days</label>
          <input
            style={styles.input}
            type="number"
            value={form.customDays}
            disabled={form.recurrence !== "custom"}
            onChange={(e) => setForm((p) => ({ ...p, customDays: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label style={styles.label}>Installments remaining</label>
          <input
            style={styles.input}
            type="number"
            value={form.installmentsRemaining}
            disabled={form.billType !== "installment"}
            onChange={(e) =>
              setForm((p) => ({ ...p, installmentsRemaining: Number(e.target.value) }))
            }
          />
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div>
        <label style={styles.label}>Reminder days before</label>
        <div style={styles.remindersWrap}>
          {[0, 1, 3, 7].map((day) => {
            const active = form.reminders.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleReminder(day)}
                style={{
                  ...styles.reminderBtn,
                  ...(active ? styles.reminderBtnActive : {}),
                }}
              >
                {day === 0 ? "On due date" : `${day} day${day > 1 ? "s" : ""} before`}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div style={styles.formGrid2}>
        <div style={styles.switchBox}>
          <label style={{ ...styles.rowBetween, cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 700 }}>Auto-generate future dues</div>
              <div style={styles.muted}>Create the next due item after payment.</div>
            </div>
            <input
              type="checkbox"
              checked={form.autoGenerate}
              onChange={(e) => setForm((p) => ({ ...p, autoGenerate: e.target.checked }))}
            />
          </label>
        </div>

        <div style={styles.switchBox}>
          <label style={{ ...styles.rowBetween, cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 700 }}>Active template</div>
              <div style={styles.muted}>Pause without deleting the bill.</div>
            </div>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            />
          </label>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div>
        <label style={styles.label}>Notes</label>
        <textarea
          style={styles.textarea}
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Optional notes"
        />
      </div>

      <div style={{ height: 14 }} />

      <div style={styles.actionRow}>
        <button style={{ ...styles.button, background: "#0f172a", color: "white" }} onClick={onSave}>
          Save bill
        </button>
        <button
          style={{ ...styles.button, background: "white", color: "#0f172a", border: "1px solid #cbd5e1" }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function BillsTrackerApp() {
  const [templates, setTemplates] = useState<BillTemplate[]>(initialTemplates);
  const [dues, setDues] = useState<DueItem[]>(initialDues);
  const [screen, setScreen] = useState<
    "dashboard" | "bills" | "upcoming" | "calendar" | "details" | "form"
  >("dashboard");
  const [selectedDate, setSelectedDate] = useState<string>("2026-04-10");
  const [selectedBillId, setSelectedBillId] = useState<string>("tpl-2");
  const [form, setForm] = useState<FormState>(emptyForm);

  const hydratedDues = useMemo(() => {
    return dues
      .map((item) => {
        const overdue = item.status === "unpaid" && diffDays(item.dueDate) < 0;
        return { ...item, status: overdue ? "overdue" : item.status } as DueItem;
      })
      .sort(
        (a, b) =>
          new Date(`${a.dueDate}T12:00:00`).getTime() -
          new Date(`${b.dueDate}T12:00:00`).getTime()
      );
  }, [dues]);

  const dashboardStats = useMemo(() => {
    const weekTotal = hydratedDues
      .filter(
        (d) =>
          d.status !== "paid" &&
          d.status !== "skipped" &&
          diffDays(d.dueDate) >= 0 &&
          diffDays(d.dueDate) <= 7
      )
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const monthTotal = hydratedDues
      .filter((d) => d.status !== "paid" && d.status !== "skipped")
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const overdueTotal = hydratedDues
      .filter((d) => d.status === "overdue")
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const paidThisMonth = hydratedDues
      .filter((d) => d.status === "paid")
      .reduce((sum, d) => sum + Number(d.amount), 0);

    return { weekTotal, monthTotal, overdueTotal, paidThisMonth };
  }, [hydratedDues]);

  const nextUpcoming = useMemo(() => {
    return hydratedDues.filter((d) => d.status === "unpaid").slice(0, 5);
  }, [hydratedDues]);

  const reminders = useMemo(() => {
    const notices: { id: string; text: string }[] = [];

    hydratedDues.forEach((item) => {
      const template = templates.find((t) => t.id === item.templateId);
      const reminderDays = template?.reminders || [];
      reminderDays.forEach((day) => {
        if (diffDays(item.dueDate) === day && item.status === "unpaid") {
          notices.push({
            id: `${item.id}-${day}`,
            text: buildReminderText(item, day),
          });
        }
      });
    });

    return notices.slice(0, 4);
  }, [hydratedDues, templates]);

  const selectedDateItems = hydratedDues.filter((d) => d.dueDate === selectedDate);
  const selectedTemplate = templates.find((t) => t.id === selectedBillId) || templates[0];
  const selectedTemplateHistory = hydratedDues.filter((d) => d.templateId === selectedTemplate?.id);

  function openNewForm() {
    setForm(emptyForm);
    setScreen("form");
  }

  function openEditForm(template: BillTemplate) {
    setForm({
      id: template.id,
      name: template.name,
      amount: String(template.defaultAmount),
      category: template.category,
      billType: template.billType,
      firstDueDate: template.firstDueDate,
      recurrence: template.recurrence,
      customDays: template.customDays,
      reminders: template.reminders,
      notes: template.notes,
      autoGenerate: template.autoGenerate,
      active: template.active,
      installmentsRemaining: template.installmentsRemaining || 1,
    });
    setScreen("form");
  }

  function saveForm() {
    if (!form.name || !form.firstDueDate) return;

    if (form.billType === "manual" || form.recurrence === "none") {
      const due: DueItem = {
        id: `due-${Date.now()}`,
        templateId: null,
        name: form.name,
        category: form.category,
        amount: Number(form.amount || 0),
        dueDate: form.firstDueDate,
        status: "unpaid",
        notes: form.notes,
        sourceType: "manual",
      };
      setDues((prev) => [due, ...prev]);
      setScreen("upcoming");
      return;
    }

    const template: BillTemplate = {
      id: form.id || `tpl-${Date.now()}`,
      name: form.name,
      category: form.category,
      billType: form.billType,
      defaultAmount: Number(form.amount || 0),
      recurrence: form.recurrence,
      customDays: Number(form.customDays || 30),
      firstDueDate: form.firstDueDate,
      nextDueDate: form.firstDueDate,
      reminders: form.reminders,
      notes: form.notes,
      active: form.active,
      autoGenerate: form.autoGenerate,
      installmentsRemaining: Number(form.installmentsRemaining || 1),
    };

    setTemplates((prev) => {
      const exists = prev.some((item) => item.id === template.id);
      return exists
        ? prev.map((item) => (item.id === template.id ? template : item))
        : [template, ...prev];
    });

    const dueExists = dues.some(
      (d) => d.templateId === template.id && d.dueDate === template.firstDueDate
    );

    if (!dueExists) {
      const due: DueItem = {
        id: `due-${Date.now()}`,
        templateId: template.id,
        name: template.name,
        category: template.category,
        amount: template.defaultAmount,
        dueDate: template.firstDueDate,
        status: "unpaid",
        notes: template.notes,
        sourceType: "template",
      };
      setDues((prev) => [due, ...prev]);
    }

    setSelectedBillId(template.id);
    setScreen("bills");
  }

  function createNextDueFromTemplate(template: BillTemplate | undefined, currentDue: DueItem) {
    if (!template?.autoGenerate || !template.active) return;
    if (template.billType === "installment" && (template.installmentsRemaining || 0) <= 1) return;
    if (template.recurrence === "none") return;

    const nextDate = getNextDueDate(currentDue.dueDate, template.recurrence, template.customDays);
    const exists = dues.some((d) => d.templateId === template.id && d.dueDate === nextDate);
    if (exists) return;

    setDues((prev) => [
      ...prev,
      {
        id: `due-${Date.now()}-${Math.random()}`,
        templateId: template.id,
        name: template.name,
        category: template.category,
        amount: template.defaultAmount,
        dueDate: nextDate,
        status: "unpaid",
        notes: template.notes,
        sourceType: "template",
      },
    ]);

    setTemplates((prev) =>
      prev.map((item) => {
        if (item.id !== template.id) return item;
        return {
          ...item,
          nextDueDate: nextDate,
          installmentsRemaining:
            item.billType === "installment"
              ? Math.max((item.installmentsRemaining || 1) - 1, 0)
              : item.installmentsRemaining,
        };
      })
    );
  }

  function setDueStatus(dueId: string, status: DueStatus) {
    const dueItem = hydratedDues.find((d) => d.id === dueId);
    if (!dueItem) return;

    setDues((prev) => prev.map((d) => (d.id === dueId ? { ...d, status } : d)));

    if (status === "paid" && dueItem.templateId) {
      const template = templates.find((t) => t.id === dueItem.templateId);
      createNextDueFromTemplate(template, dueItem);
    }
  }

  function pauseTemplate(templateId: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, active: !t.active } : t))
    );
  }

  function deleteTemplate(templateId: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    setDues((prev) => prev.filter((d) => d.templateId !== templateId));
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={styles.hero}>
          <div style={styles.heroRow}>
            <div>
              <p style={styles.heroLabel}>Bills Tracker</p>
              <h1 style={styles.title}>Stay ahead of due dates</h1>
              <p style={styles.subtitle}>
                Track recurring bills, one-time payments, installments, reminders,
                overdue alerts, and monthly totals in one place.
              </p>
            </div>

            <div style={styles.actionRow}>
              <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={openNewForm}>
                <Plus size={16} />
                Add bill
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonDark }}
                onClick={() => setScreen("calendar")}
              >
                <CalendarDays size={16} />
                Calendar
              </button>
            </div>
          </div>
        </motion.div>

        <div style={styles.navGrid}>
          {[
            ["dashboard", "Dashboard", Home],
            ["bills", "Bill templates", FileText],
            ["upcoming", "Upcoming dues", ListTodo],
            ["calendar", "Calendar", CalendarDays],
            ["details", "Bill details", CreditCard],
            ["form", "Add / Edit", Pencil],
          ].map(([key, label, Icon]) => {
            const Comp = Icon as React.ComponentType<{ size?: number }>;
            const active = screen === key;
            return (
              <button
                key={key}
                onClick={() => setScreen(key as typeof screen)}
                style={{
                  ...styles.navButton,
                  ...(active ? styles.navButtonActive : {}),
                }}
              >
                <Comp size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {screen === "dashboard" && (
          <div>
            <div style={styles.grid4}>
              <SmallStat
                title="Due this week"
                value={fmtMoney(dashboardStats.weekTotal)}
                icon={Clock3}
                hint="Unpaid bills in the next 7 days"
              />
              <SmallStat
                title="Due this month"
                value={fmtMoney(dashboardStats.monthTotal)}
                icon={CreditCard}
                hint="Open obligations this month"
              />
              <SmallStat
                title="Overdue bills"
                value={fmtMoney(dashboardStats.overdueTotal)}
                icon={AlertTriangle}
                hint="Past due and not paid"
              />
              <SmallStat
                title="Paid this month"
                value={fmtMoney(dashboardStats.paidThisMonth)}
                icon={CheckCircle2}
                hint="Completed payments"
              />
            </div>

            <div style={{ height: 20 }} />

            <div style={styles.grid2}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Next 5 upcoming bills</h3>
                {nextUpcoming.map((item) => (
                  <div key={item.id} style={styles.listItem}>
                    <div style={styles.rowBetween}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={styles.muted}>
                          {fmtDate(item.dueDate)} · {item.category}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700 }}>{fmtMoney(item.amount)}</div>
                        <div style={{ marginTop: 8 }}>
                          <span style={badgeStyle(item.status)}>{item.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Reminder feed</h3>
                {reminders.length ? (
                  reminders.map((item) => (
                    <div key={item.id} style={styles.listItem}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <Bell size={18} />
                        <div>{item.text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.muted}>No reminders triggered for the sample date.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {screen === "bills" && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Bill templates</h3>
              {templates.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedBillId(item.id);
                    setScreen("details");
                  }}
                  style={{
                    ...styles.listItem,
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={styles.rowBetween}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={styles.muted}>
                        {item.category} · {recurrenceLabel[item.recurrence]}
                      </div>
                      <div style={{ ...styles.muted, marginTop: 8 }}>
                        Next due {fmtDate(item.nextDueDate)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700 }}>{fmtMoney(item.defaultAmount)}</div>
                      <div style={{ marginTop: 8 }}>
                        <span style={badgeStyle(item.active ? "paid" : "skipped")}>
                          {item.active ? "active" : "paused"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Quick actions</h3>
              <div style={styles.actionRow}>
                <button
                  style={{ ...styles.button, background: "#0f172a", color: "white" }}
                  onClick={openNewForm}
                >
                  <Plus size={16} />
                  Add bill
                </button>

                <button
                  style={{
                    ...styles.button,
                    background: "white",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                  }}
                  onClick={() => openEditForm(selectedTemplate)}
                >
                  <Pencil size={16} />
                  Edit selected bill
                </button>

                <button
                  style={{
                    ...styles.button,
                    background: "white",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                  }}
                  onClick={() => pauseTemplate(selectedTemplate.id)}
                >
                  <PauseCircle size={16} />
                  {selectedTemplate.active ? "Pause" : "Resume"} bill
                </button>

                <button
                  style={{
                    ...styles.button,
                    background: "white",
                    color: "#7f1d1d",
                    border: "1px solid #fecaca",
                  }}
                  onClick={() => deleteTemplate(selectedTemplate.id)}
                >
                  <Trash2 size={16} />
                  Delete bill
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "upcoming" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Upcoming dues</h3>
            {hydratedDues.map((item) => (
              <div key={item.id} style={styles.listItem}>
                <div style={{ ...styles.rowBetween, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={styles.muted}>
                      {fmtDate(item.dueDate)} · {item.category}
                    </div>
                    {item.notes ? <div style={{ ...styles.muted, marginTop: 8 }}>{item.notes}</div> : null}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{fmtMoney(item.amount)}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={badgeStyle(item.status)}>{item.status}</span>
                    </div>
                    <div style={{ ...styles.actionRow, justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        style={{ ...styles.button, background: "#0f172a", color: "white", padding: "8px 12px" }}
                        onClick={() => setDueStatus(item.id, "paid")}
                      >
                        Paid
                      </button>
                      <button
                        style={{
                          ...styles.button,
                          background: "white",
                          color: "#0f172a",
                          border: "1px solid #cbd5e1",
                          padding: "8px 12px",
                        }}
                        onClick={() => setDueStatus(item.id, "skipped")}
                      >
                        <SkipForward size={14} />
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {screen === "calendar" && (
          <div style={styles.grid2}>
            <CalendarGrid
              dues={hydratedDues.filter((d) => d.status !== "skipped")}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>{fmtDate(selectedDate)}</h3>
              {selectedDateItems.length ? (
                selectedDateItems.map((item) => (
                  <div key={item.id} style={styles.listItem}>
                    <div style={styles.rowBetween}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={styles.muted}>{item.category}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700 }}>{fmtMoney(item.amount)}</div>
                        <div style={{ marginTop: 8 }}>
                          <span style={badgeStyle(item.status)}>{item.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.muted}>No bills due on this date.</div>
              )}
            </div>
          </div>
        )}

        {screen === "details" && selectedTemplate && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <div style={{ ...styles.rowBetween, marginBottom: 12 }}>
                <button
                  style={{
                    ...styles.button,
                    background: "white",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    padding: "8px 12px",
                  }}
                  onClick={() => setScreen("bills")}
                >
                  <ArrowLeft size={14} />
                </button>
                <h3 style={{ ...styles.cardTitle, margin: 0 }}>{selectedTemplate.name}</h3>
                <div />
              </div>

              <div style={{ ...styles.switchBox, background: "#f8fafc" }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Category:</strong> {selectedTemplate.category}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Type:</strong> {selectedTemplate.billType.replaceAll("_", " ")}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Default amount:</strong> {fmtMoney(selectedTemplate.defaultAmount)}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Recurrence:</strong> {recurrenceLabel[selectedTemplate.recurrence]}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Next due:</strong> {fmtDate(selectedTemplate.nextDueDate)}
                </div>
                {selectedTemplate.billType === "installment" ? (
                  <div>
                    <strong>Remaining payments:</strong> {selectedTemplate.installmentsRemaining}
                  </div>
                ) : null}
              </div>

              <div style={{ height: 14 }} />

              <div style={styles.actionRow}>
                <button
                  style={{ ...styles.button, background: "#0f172a", color: "white" }}
                  onClick={() => openEditForm(selectedTemplate)}
                >
                  <Pencil size={16} />
                  Edit recurrence
                </button>
                <button
                  style={{
                    ...styles.button,
                    background: "white",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                  }}
                  onClick={() => pauseTemplate(selectedTemplate.id)}
                >
                  <PauseCircle size={16} />
                  {selectedTemplate.active ? "Pause" : "Resume"}
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Payment history and due items</h3>
              {selectedTemplateHistory.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  <div style={styles.rowBetween}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{fmtDate(item.dueDate)}</div>
                      <div style={styles.muted}>{fmtMoney(item.amount)}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={badgeStyle(item.status)}>{item.status}</span>
                      {item.status !== "paid" ? (
                        <div style={{ marginTop: 10 }}>
                          <button
                            style={{
                              ...styles.button,
                              background: "#0f172a",
                              color: "white",
                              padding: "8px 12px",
                            }}
                            onClick={() => setDueStatus(item.id, "paid")}
                          >
                            Mark paid
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === "form" && (
          <BillForm
            form={form}
            setForm={setForm}
            onSave={saveForm}
            onCancel={() => setScreen("dashboard")}
          />
        )}
      </div>
    </div>
  );
                  }

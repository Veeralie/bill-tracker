import React, { useMemo, useState } from "react"; import { motion } from "framer-motion"; import { AlertTriangle, ArrowLeft, Bell, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, CreditCard, FileText, Home, ListTodo, PauseCircle, Pencil, Plus, Settings2, SkipForward, Trash2, } from "lucide-react"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Label } from "@/components/ui/label"; import { Textarea } from "@/components/ui/textarea"; import { Badge } from "@/components/ui/badge"; import { Switch } from "@/components/ui/switch"; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = [ "Credit Card", "Installment", "Utilities", "Housing", "Internet", "Insurance", "Loan", "Manual", "Other", ];

const statusTone = { unpaid: "bg-amber-100 text-amber-900 border-amber-200", paid: "bg-emerald-100 text-emerald-900 border-emerald-200", overdue: "bg-rose-100 text-rose-900 border-rose-200", skipped: "bg-slate-100 text-slate-800 border-slate-200", };

const recurrenceLabel = { none: "One time", weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly", custom: "Custom", };

const today = new Date("2026-04-10T12:00:00");

function fmtMoney(value) { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, }).format(Number(value || 0)); }

function fmtDate(value) { const d = new Date(${value}T12:00:00); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", }); }

function dateKey(date) { const d = new Date(date); const y = d.getFullYear(); const m = ${d.getMonth() + 1}.padStart(2, "0"); const day = ${d.getDate()}.padStart(2, "0"); return ${y}-${m}-${day}; }

function addDays(dateStr, days) { const d = new Date(${dateStr}T12:00:00); d.setDate(d.getDate() + days); return dateKey(d); }

function diffDays(targetDateStr) { const ms = new Date(${targetDateStr}T12:00:00).getTime() - today.getTime(); return Math.floor(ms / (1000 * 60 * 60 * 24)); }

function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }

function daysInMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); }

function getNextDueDate(currentDate, recurrence, customDays) { if (recurrence === "weekly") return addDays(currentDate, 7); if (recurrence === "biweekly") return addDays(currentDate, 14); if (recurrence === "monthly") { const d = new Date(${currentDate}T12:00:00); d.setMonth(d.getMonth() + 1); return dateKey(d); } if (recurrence === "custom") return addDays(currentDate, Number(customDays || 30)); return currentDate; }

const initialTemplates = [ { id: "tpl-1", name: "Barclays Forward", category: "Credit Card", billType: "fixed_recurring", defaultAmount: 125, recurrence: "monthly", customDays: 30, firstDueDate: "2026-04-08", nextDueDate: "2026-04-08", reminders: [3, 1], notes: "Main card payment", active: true, autoGenerate: true, }, { id: "tpl-2", name: "Barclays Card", category: "Credit Card", billType: "variable_recurring", defaultAmount: 220, recurrence: "monthly", customDays: 30, firstDueDate: "2026-04-18", nextDueDate: "2026-04-18", reminders: [3, 1], notes: "Amount can change before payment", active: true, autoGenerate: true, }, { id: "tpl-3", name: "Monzo Flex", category: "Installment", billType: "installment", defaultAmount: 74, recurrence: "monthly", customDays: 30, firstDueDate: "2026-04-11", nextDueDate: "2026-04-11", reminders: [1], notes: "3 payments remaining", active: true, autoGenerate: true, installmentsRemaining: 3, }, { id: "tpl-4", name: "Klarna", category: "Installment", defaultAmount: 42, billType: "installment", recurrence: "monthly", customDays: 30, firstDueDate: "2026-04-23", nextDueDate: "2026-04-23", reminders: [3, 1], notes: "2 payments remaining", active: true, autoGenerate: true, installmentsRemaining: 2, }, { id: "tpl-5", name: "Rent", category: "Housing", defaultAmount: 550, billType: "fixed_recurring", recurrence: "monthly", customDays: 30, firstDueDate: "2026-04-01", nextDueDate: "2026-05-01", reminders: [3, 1], notes: "Fixed monthly rent", active: true, autoGenerate: true, }, { id: "tpl-6", name: "Internet", category: "Internet", defaultAmount: 34, billType: "fixed_recurring", recurrence: "monthly", customDays: 30, firstDueDate: "2026-04-27", nextDueDate: "2026-04-27", reminders: [1], notes: "Broadband", active: true, autoGenerate: true, }, ];

const initialDues = [ { id: "due-1", templateId: "tpl-1", name: "Barclays Forward", category: "Credit Card", amount: 125, dueDate: "2026-04-08", status: "overdue", notes: "Main card payment", sourceType: "template", }, { id: "due-2", templateId: "tpl-3", name: "Monzo Flex", category: "Installment", amount: 74, dueDate: "2026-04-11", status: "unpaid", notes: "Installment 1 of 3", sourceType: "template", }, { id: "due-3", templateId: "tpl-2", name: "Barclays Card", category: "Credit Card", amount: 220, dueDate: "2026-04-18", status: "unpaid", notes: "Editable amount", sourceType: "template", }, { id: "due-4", templateId: "tpl-4", name: "Klarna", category: "Installment", amount: 42, dueDate: "2026-04-23", status: "unpaid", notes: "Installment 1 of 2", sourceType: "template", }, { id: "due-5", templateId: "tpl-6", name: "Internet", category: "Internet", amount: 34, dueDate: "2026-04-27", status: "unpaid", notes: "Broadband bill", sourceType: "template", }, { id: "due-6", templateId: null, name: "Manual Water Bill", category: "Utilities", amount: 38.32, dueDate: "2026-04-10", status: "unpaid", notes: "User-added one-time bill", sourceType: "manual", }, { id: "due-7", templateId: null, name: "Council Tax Catch-up", category: "Housing", amount: 105, dueDate: "2026-04-28", status: "unpaid", notes: "Manual entry", sourceType: "manual", }, { id: "due-8", templateId: "tpl-5", name: "Rent", category: "Housing", amount: 550, dueDate: "2026-04-01", status: "paid", notes: "Paid via bank transfer", sourceType: "template", }, ];

const emptyForm = { id: null, name: "", amount: "", category: "Manual", billType: "fixed_recurring", firstDueDate: "2026-04-15", recurrence: "monthly", customDays: 30, reminders: [1], notes: "", autoGenerate: true, active: true, installmentsRemaining: 3, };

function buildReminderText(item, days) { if (days === 0) return ${item.name} due today; if (days === 1) return ${item.name} due tomorrow; return ${item.name} due in ${days} days; }

function SmallStat({ title, value, icon: Icon, hint }) { return ( <Card className="rounded-3xl border-0 shadow-sm"> <CardContent className="p-5"> <div className="flex items-start justify-between gap-3"> <div> <p className="text-sm text-slate-500">{title}</p> <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p> <p className="mt-1 text-xs text-slate-500">{hint}</p> </div> <div className="rounded-2xl bg-slate-100 p-3"> <Icon className="h-5 w-5 text-slate-700" /> </div> </div> </CardContent> </Card> ); }

function CalendarGrid({ dues, onSelectDate, selectedDate }) { const monthStart = startOfMonth(today); const totalDays = daysInMonth(today); const firstWeekDay = monthStart.getDay();

const totalsByDate = dues.reduce((acc, item) => { const key = item.dueDate; const amount = item.status === "skipped" ? 0 : Number(item.amount || 0); acc[key] = (acc[key] || 0) + amount; return acc; }, {});

const cells = []; for (let i = 0; i < firstWeekDay; i += 1) cells.push(null); for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(today.getFullYear(), today.getMonth(), day));

return ( <Card className="rounded-3xl border-0 shadow-sm"> <CardHeader className="pb-3"> <CardTitle className="flex items-center gap-2 text-base"> <CalendarDays className="h-5 w-5" /> April 2026 </CardTitle> </CardHeader> <CardContent> <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500"> {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => ( <div key={d} className="py-1">{d}</div> ))} </div> <div className="mt-2 grid grid-cols-7 gap-2"> {cells.map((date, index) => { if (!date) return <div key={blank-${index}} className="h-20 rounded-2xl bg-slate-50" />; const key = dateKey(date); const selected = selectedDate === key; const total = totalsByDate[key] || 0; return ( <button key={key} onClick={() => onSelectDate(key)} className={h-20 rounded-2xl border p-2 text-left transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"}} > <div className="text-sm font-semibold">{date.getDate()}</div> <div className={mt-2 text-xs ${selected ? "text-slate-200" : "text-slate-500"}}> {total > 0 ? fmtMoney(total) : "—"} </div> </button> ); })} </div> </CardContent> </Card> ); }

function BillForm({ form, setForm, onSave, onCancel }) { const toggleReminder = (day) => { setForm((prev) => ({ ...prev, reminders: prev.reminders.includes(day) ? prev.reminders.filter((x) => x !== day) : [...prev.reminders, day].sort((a, b) => a - b), })); };

return ( <Card className="rounded-3xl border-0 shadow-sm"> <CardHeader> <CardTitle>{form.id ? "Edit bill template" : "Add new bill"}</CardTitle> </CardHeader> <CardContent className="space-y-4"> <div className="grid gap-4 md:grid-cols-2"> <div className="space-y-2"> <Label>Bill name</Label> <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Barclays Card" /> </div> <div className="space-y-2"> <Label>Amount</Label> <Input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" /> </div> </div>

<div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(value) => setForm((p) => ({ ...p, category: value }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Bill type</Label>
        <Select value={form.billType} onValueChange={(value) => setForm((p) => ({ ...p, billType: value }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed_recurring">Fixed recurring</SelectItem>
            <SelectItem value="variable_recurring">Variable recurring</SelectItem>
            <SelectItem value="installment">Installment</SelectItem>
            <SelectItem value="manual">Manual one-time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>First due date</Label>
        <Input type="date" value={form.firstDueDate} onChange={(e) => setForm((p) => ({ ...p, firstDueDate: e.target.value }))} />
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Recurrence</Label>
        <Select value={form.recurrence} onValueChange={(value) => setForm((p) => ({ ...p, recurrence: value }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">One time</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="biweekly">Every 2 weeks</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="custom">Custom interval</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Custom repeat days</Label>
        <Input type="number" value={form.customDays} onChange={(e) => setForm((p) => ({ ...p, customDays: e.target.value }))} disabled={form.recurrence !== "custom"} />
      </div>
      <div className="space-y-2">
        <Label>Installments remaining</Label>
        <Input type="number" value={form.installmentsRemaining} onChange={(e) => setForm((p) => ({ ...p, installmentsRemaining: e.target.value }))} disabled={form.billType !== "installment"} />
      </div>
    </div>

    <div className="space-y-2">
      <Label>Reminder days before</Label>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 3, 7].map((day) => (
          <Button key={day} type="button" variant={form.reminders.includes(day) ? "default" : "outline"} className="rounded-full" onClick={() => toggleReminder(day)}>
            {day === 0 ? "On due date" : `${day} day${day > 1 ? "s" : ""} before`}
          </Button>
        ))}
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Auto-generate future dues</p>
            <p className="text-sm text-slate-500">Create the next due item after payment.</p>
          </div>
          <Switch checked={form.autoGenerate} onCheckedChange={(checked) => setForm((p) => ({ ...p, autoGenerate: checked }))} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Active template</p>
            <p className="text-sm text-slate-500">Pause without deleting the bill.</p>
          </div>
          <Switch checked={form.active} onCheckedChange={(checked) => setForm((p) => ({ ...p, active: checked }))} />
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <Label>Notes</Label>
      <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
    </div>

    <div className="flex flex-wrap gap-3">
      <Button onClick={onSave} className="rounded-2xl">Save bill</Button>
      <Button variant="outline" onClick={onCancel} className="rounded-2xl">Cancel</Button>
    </div>
  </CardContent>
</Card>

); }

export default function BillsTrackerApp() { const [templates, setTemplates] = useState(initialTemplates); const [dues, setDues] = useState(initialDues); const [screen, setScreen] = useState("dashboard"); const [selectedDate, setSelectedDate] = useState("2026-04-10"); const [selectedBillId, setSelectedBillId] = useState("tpl-2"); const [form, setForm] = useState(emptyForm);

const hydratedDues = useMemo(() => { return dues .map((item) => { const overdue = item.status === "unpaid" && diffDays(item.dueDate) < 0; return { ...item, status: overdue ? "overdue" : item.status }; }) .sort((a, b) => new Date(${a.dueDate}T12:00:00) - new Date(${b.dueDate}T12:00:00)); }, [dues]);

const dashboardStats = useMemo(() => { const weekTotal = hydratedDues.filter((d) => d.status !== "paid" && d.status !== "skipped" && diffDays(d.dueDate) >= 0 && diffDays(d.dueDate) <= 7).reduce((sum, d) => sum + Number(d.amount), 0); const monthTotal = hydratedDues.filter((d) => d.status !== "paid" && d.status !== "skipped").reduce((sum, d) => sum + Number(d.amount), 0); const overdueTotal = hydratedDues.filter((d) => d.status === "overdue").reduce((sum, d) => sum + Number(d.amount), 0); const paidThisMonth = hydratedDues.filter((d) => d.status === "paid").reduce((sum, d) => sum + Number(d.amount), 0); return { weekTotal, monthTotal, overdueTotal, paidThisMonth }; }, [hydratedDues]);

const nextUpcoming = useMemo(() => hydratedDues.filter((d) => d.status === "unpaid").slice(0, 5), [hydratedDues]);

const reminders = useMemo(() => { const notices = []; hydratedDues.forEach((item) => { const template = templates.find((t) => t.id === item.templateId); const reminderDays = template?.reminders || []; reminderDays.forEach((day) => { if (diffDays(item.dueDate) === day && item.status === "unpaid") notices.push({ id: ${item.id}-${day}, text: buildReminderText(item, day) }); }); }); return notices.slice(0, 4); }, [hydratedDues, templates]);

const selectedDateItems = hydratedDues.filter((d) => d.dueDate === selectedDate); const selectedTemplate = templates.find((t) => t.id === selectedBillId) || templates[0]; const selectedTemplateHistory = hydratedDues.filter((d) => d.templateId === selectedTemplate?.id);

const openNewForm = () => { setForm(emptyForm); setScreen("form"); };

const openEditForm = (template) => { setForm({ id: template.id, name: template.name, amount: String(template.defaultAmount), category: template.category, billType: template.billType, firstDueDate: template.firstDueDate, recurrence: template.recurrence, customDays: template.customDays, reminders: template.reminders, notes: template.notes, autoGenerate: template.autoGenerate, active: template.active, installmentsRemaining: template.installmentsRemaining || 1, }); setScreen("form"); };

const saveForm = () => { if (!form.name || !form.firstDueDate) return;

if (form.billType === "manual" || form.recurrence === "none") {
  const due = {
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

const template = {
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
  return exists ? prev.map((item) => (item.id === template.id ? template : item)) : [template, ...prev];
});

const dueExists = dues.some((d) => d.templateId === template.id && d.dueDate === template.firstDueDate);
if (!dueExists) {
  const due = {
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

};

const createNextDueFromTemplate = (template, currentDue) => { if (!template?.autoGenerate || !template.active) return; if (template.billType === "installment" && (template.installmentsRemaining || 0) <= 1) return; if (template.recurrence === "none") return;

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

setTemplates((prev) => prev.map((item) => {
  if (item.id !== template.id) return item;
  return {
    ...item,
    nextDueDate: nextDate,
    installmentsRemaining: item.billType === "installment" ? Math.max((item.installmentsRemaining || 1) - 1, 0) : item.installmentsRemaining,
  };
}));

};

const setDueStatus = (dueId, status) => { const dueItem = hydratedDues.find((d) => d.id === dueId); if (!dueItem) return; setDues((prev) => prev.map((d) => (d.id === dueId ? { ...d, status } : d))); if (status === "paid" && dueItem.templateId) { const template = templates.find((t) => t.id === dueItem.templateId); createNextDueFromTemplate(template, dueItem); } };

const pauseTemplate = (templateId) => setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, active: !t.active } : t))); const deleteTemplate = (templateId) => { setTemplates((prev) => prev.filter((t) => t.id !== templateId)); setDues((prev) => prev.filter((d) => d.templateId !== templateId)); };

return ( <div className="min-h-screen bg-slate-50 text-slate-900"> <div className="mx-auto max-w-7xl p-4 md:p-8"> <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-[28px] bg-slate-900 p-6 text-white shadow-sm"> <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"> <div> <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Bills Tracker</p> <h1 className="mt-2 text-3xl font-semibold">Stay ahead of due dates</h1> <p className="mt-2 max-w-2xl text-sm text-slate-300">Track recurring bills, one-time payments, installments, reminders, overdue alerts, and monthly totals in one place.</p> </div> <div className="flex flex-wrap gap-3"> <Button onClick={openNewForm} className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100"><Plus className="mr-2 h-4 w-4" /> Add bill</Button> <Button variant="outline" className="rounded-2xl border-slate-700 bg-slate-900 text-white hover:bg-slate-800" onClick={() => setScreen("calendar")}><CalendarDays className="mr-2 h-4 w-4" /> Calendar</Button> </div> </div> </motion.div>

<div className="mb-6 grid gap-3 md:grid-cols-6">
      {[["dashboard", "Dashboard", Home], ["bills", "Bill templates", FileText], ["upcoming", "Upcoming dues", ListTodo], ["calendar", "Calendar", CalendarDays], ["details", "Bill details", CreditCard], ["form", "Add / Edit", Settings2]].map(([key, label, Icon]) => (
        <button key={key} onClick={() => setScreen(key)} className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${screen === key ? "bg-slate-900 text-white" : "bg-white text-slate-700 shadow-sm"}`}>
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>

    {screen === "dashboard" && (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SmallStat title="Due this week" value={fmtMoney(dashboardStats.weekTotal)} icon={Clock3} hint="Unpaid bills in the next 7 days" />
          <SmallStat title="Due this month" value={fmtMoney(dashboardStats.monthTotal)} icon={CircleDollarSign} hint="Open obligations this month" />
          <SmallStat title="Overdue bills" value={fmtMoney(dashboardStats.overdueTotal)} icon={AlertTriangle} hint="Past due and not paid" />
          <SmallStat title="Paid this month" value={fmtMoney(dashboardStats.paidThisMonth)} icon={CheckCircle2} hint="Completed payments" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader><CardTitle>Next 5 upcoming bills</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {nextUpcoming.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-500">{fmtDate(item.dueDate)} · {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmtMoney(item.amount)}</p>
                    <Badge className={`mt-2 border ${statusTone[item.status]}`}>{item.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader><CardTitle>Reminder feed</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {reminders.length ? reminders.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                  <div className="rounded-2xl bg-amber-100 p-2"><Bell className="h-4 w-4 text-amber-800" /></div>
                  <p className="text-sm text-slate-700">{item.text}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No reminders triggered for the sample date.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    )}

    {screen === "bills" && (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader><CardTitle>Bill templates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {templates.map((item) => (
              <button key={item.id} onClick={() => { setSelectedBillId(item.id); setScreen("details"); }} className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-400">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.category} · {recurrenceLabel[item.recurrence]}</p>
                    <p className="mt-2 text-sm text-slate-600">Next due {fmtDate(item.nextDueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmtMoney(item.defaultAmount)}</p>
                    <Badge variant={item.active ? "default" : "secondary"} className="mt-2 rounded-full">{item.active ? "Active" : "Paused"}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start rounded-2xl" onClick={openNewForm}><Plus className="mr-2 h-4 w-4" /> Add bill</Button>
            <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => openEditForm(selectedTemplate)}><Pencil className="mr-2 h-4 w-4" /> Edit selected bill</Button>
            <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => pauseTemplate(selectedTemplate.id)}><PauseCircle className="mr-2 h-4 w-4" /> {selectedTemplate.active ? "Pause" : "Resume"} bill</Button>
            <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => deleteTemplate(selectedTemplate.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete bill</Button>
          </CardContent>
        </Card>
      </div>
    )}

    {screen === "upcoming" && (
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader><CardTitle>Upcoming dues</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {hydratedDues.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-slate-500">{fmtDate(item.dueDate)} · {item.category}</p>
                  {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-24 text-right font-semibold">{fmtMoney(item.amount)}</p>
                  <Badge className={`border ${statusTone[item.status]}`}>{item.status}</Badge>
                  <Button size="sm" className="rounded-xl" onClick={() => setDueStatus(item.id, "paid")}>Paid</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDueStatus(item.id, "skipped")}><SkipForward className="mr-1 h-4 w-4" /> Skip</Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )}

    {screen === "calendar" && (
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <CalendarGrid dues={hydratedDues.filter((d) => d.status !== "skipped")} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader><CardTitle>{fmtDate(selectedDate)}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selectedDateItems.length ? selectedDateItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmtMoney(item.amount)}</p>
                    <Badge className={`mt-2 border ${statusTone[item.status]}`}>{item.status}</Badge>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No bills due on this date.</p>}
          </CardContent>
        </Card>
      </div>
    )}

    {screen === "details" && selectedTemplate && (
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-2xl" onClick={() => setScreen("bills")}><ArrowLeft className="h-4 w-4" /></Button>
              <CardTitle>{selectedTemplate.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm space-y-2">
              <p><span className="font-medium">Category:</span> {selectedTemplate.category}</p>
              <p><span className="font-medium">Type:</span> {selectedTemplate.billType.replaceAll("_", " ")}</p>
              <p><span className="font-medium">Default amount:</span> {fmtMoney(selectedTemplate.defaultAmount)}</p>
              <p><span className="font-medium">Recurrence:</span> {recurrenceLabel[selectedTemplate.recurrence]}</p>
              <p><span className="font-medium">Next due:</span> {fmtDate(selectedTemplate.nextDueDate)}</p>
              {selectedTemplate.billType === "installment" ? <p><span className="font-medium">Remaining payments:</span> {selectedTemplate.installmentsRemaining}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl" onClick={() => openEditForm(selectedTemplate)}><Pencil className="mr-2 h-4 w-4" /> Edit recurrence</Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => pauseTemplate(selectedTemplate.id)}><PauseCircle className="mr-2 h-4 w-4" /> {selectedTemplate.active ? "Pause" : "Resume"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader><CardTitle>Payment history and due items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selectedTemplateHistory.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{fmtDate(item.dueDate)}</p>
                    <p className="text-sm text-slate-500">{fmtMoney(item.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border ${statusTone[item.status]}`}>{item.status}</Badge>
                    {item.status !== "paid" ? <Button size="sm" className="rounded-xl" onClick={() => setDueStatus(item.id, "paid")}>Mark paid</Button> : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )}

    {screen === "form" && <BillForm form={form} setForm={setForm} onSave={saveForm} onCancel={() => setScreen("dashboard")} />}
  </div>
</div>

); }

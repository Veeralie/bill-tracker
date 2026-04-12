'use client';

import { useEffect, useMemo, useState } from 'react';

type Frequency = 'once' | 'weekly' | 'fortnightly' | 'monthly';
type DueStatus = 'unpaid' | 'paid';

type BillTemplate = {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: Frequency;
  startDate: string;
  reminderDays: number;
  active: boolean;
  notes: string;
};

type DueItem = {
  id: string;
  billId: string;
  nameSnapshot: string;
  amountSnapshot: number;
  dueDate: string;
  status: DueStatus;
};

type Draft = Omit<BillTemplate, 'id'>;

const STORAGE_KEY = 'dueflow_v1';
const HORIZON_DAYS = 180;

const sampleBills: BillTemplate[] = [
  {
    id: cryptoId(),
    name: 'Barclays Card',
    amount: 120,
    category: 'Credit cards',
    frequency: 'monthly',
    startDate: isoToday(),
    reminderDays: 3,
    active: true,
    notes: 'Editable each month if amount changes.',
  },
  {
    id: cryptoId(),
    name: 'Monzo Flex',
    amount: 80,
    category: 'Buy now pay later',
    frequency: 'monthly',
    startDate: isoToday(),
    reminderDays: 2,
    active: true,
    notes: '',
  },
];

const emptyDraft: Draft = {
  name: '',
  amount: 0,
  category: 'Other',
  frequency: 'monthly',
  startDate: isoToday(),
  reminderDays: 1,
  active: true,
  notes: '',
};

export default function Page() {
  const [templates, setTemplates] = useState<BillTemplate[]>([]);
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { templates: BillTemplate[]; dueItems: DueItem[] };
        setTemplates(parsed.templates ?? []);
        setDueItems(parsed.dueItems ?? []);
      } else {
        const generated = seedDueItems(sampleBills);
        setTemplates(sampleBills);
        setDueItems(generated);
      }
    } catch {
      const generated = seedDueItems(sampleBills);
      setTemplates(sampleBills);
      setDueItems(generated);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ templates, dueItems }));
  }, [templates, dueItems, ready]);

  useEffect(() => {
    if (!ready) return;
    setDueItems((current) => syncDueItems(templates, current));
  }, [templates, ready]);

  const sortedDueItems = useMemo(() => {
    return [...dueItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [dueItems]);

  const visibleDueItems = useMemo(() => {
    const today = isoToday();

    return sortedDueItems.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'paid') return item.status === 'paid';
      if (filter === 'upcoming') return item.status === 'unpaid' && item.dueDate >= today;
      if (filter === 'overdue') return item.status === 'unpaid' && item.dueDate < today;
      return true;
    });
  }, [sortedDueItems, filter]);

  const stats = useMemo(() => {
    const today = new Date();
    const endOfWeek = addDays(today, 7);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let week = 0;
    let month = 0;
    let overdue = 0;
    let paidMonth = 0;

    for (const item of dueItems) {
      const date = new Date(item.dueDate + 'T00:00:00');
      if (item.status === 'unpaid' && date >= stripTime(today) && date <= endOfWeek) week += item.amountSnapshot;
      if (item.status === 'unpaid' && date >= stripTime(today) && date <= endOfMonth) month += item.amountSnapshot;
      if (item.status === 'unpaid' && item.dueDate < isoToday()) overdue += 1;
      if (item.status === 'paid' && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
        paidMonth += item.amountSnapshot;
      }
    }

    return { week, month, overdue, paidMonth };
  }, [dueItems]);

  const submit = () => {
    if (!draft.name.trim()) return;
    if (!draft.startDate) return;
    if (draft.amount < 0) return;

    if (editingId) {
      setTemplates((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...draft,
                name: draft.name.trim(),
              }
            : item,
        ),
      );
    } else {
      const newTemplate: BillTemplate = {
        id: cryptoId(),
        ...draft,
        name: draft.name.trim(),
      };
      setTemplates((current) => [...current, newTemplate]);
    }

    resetForm();
  };

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const startEdit = (template: BillTemplate) => {
    setEditingId(template.id);
    setDraft({
      name: template.name,
      amount: template.amount,
      category: template.category,
      frequency: template.frequency,
      startDate: template.startDate,
      reminderDays: template.reminderDays,
      active: template.active,
      notes: template.notes,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeTemplate = (id: string) => {
    setTemplates((current) => current.filter((item) => item.id !== id));
    setDueItems((current) => current.filter((item) => item.billId !== id));
    if (editingId === id) resetForm();
  };

  const togglePaid = (id: string) => {
    setDueItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'paid' ? 'unpaid' : 'paid',
            }
          : item,
      ),
    );
  };

  const updateAmountSnapshot = (id: string, value: string) => {
    const amount = Number(value);
    setDueItems((current) =>
      current.map((item) =>
        item.id === id && Number.isFinite(amount)
          ? {
              ...item,
              amountSnapshot: amount,
            }
          : item,
      ),
    );
  };

  if (!ready) {
    return <main style={{ padding: 24 }}>Loading…</main>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div>
            <div style={styles.badge}>Next.js + Vercel starter</div>
            <h1 style={styles.title}>Dueflow</h1>
            <p style={styles.subtitle}>
              A manual bill tracker with recurring schedules, upcoming due dates, and paid status.
            </p>
          </div>
        </section>

        <section style={styles.statsGrid}>
          <StatCard label="Due this week" value={money(stats.week)} />
          <StatCard label="Due this month" value={money(stats.month)} />
          <StatCard label="Overdue bills" value={String(stats.overdue)} />
          <StatCard label="Paid this month" value={money(stats.paidMonth)} />
        </section>

        <section style={styles.grid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>{editingId ? 'Edit bill' : 'Add a bill'}</h2>
            <div style={styles.formGrid}>
              <Field label="Bill name">
                <input
                  style={styles.input}
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Barclays Card"
                />
              </Field>

              <Field label="Amount">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) }))}
                />
              </Field>

              <Field label="Category">
                <select
                  style={styles.input}
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                >
                  {['Credit cards', 'Buy now pay later', 'Housing', 'Utilities', 'Subscriptions', 'Insurance', 'Transport', 'Other'].map(
                    (category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field label="Frequency">
                <select
                  style={styles.input}
                  value={draft.frequency}
                  onChange={(e) => setDraft((d) => ({ ...d, frequency: e.target.value as Frequency }))}
                >
                  <option value="once">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>

              <Field label="First due date">
                <input
                  style={styles.input}
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                />
              </Field>

              <Field label="Reminder days before">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step="1"
                  value={draft.reminderDays}
                  onChange={(e) => setDraft((d) => ({ ...d, reminderDays: Number(e.target.value) }))}
                />
              </Field>

              <Field label="Notes">
                <input
                  style={styles.input}
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="Optional"
                />
              </Field>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                />
                Active
              </label>
            </div>

            <div style={styles.buttonRow}>
              <button style={styles.primaryButton} onClick={submit}>
                {editingId ? 'Save changes' : 'Add bill'}
              </button>
              <button style={styles.secondaryButton} onClick={resetForm}>
                Clear
              </button>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Bill templates</h2>
              <span style={styles.smallText}>{templates.length} total</span>
            </div>
            <div style={styles.stack}>
              {templates.length === 0 && <p style={styles.smallText}>No bill templates yet.</p>}
              {templates.map((template) => (
                <div key={template.id} style={styles.card}>
                  <div>
                    <div style={styles.cardTitle}>{template.name}</div>
                    <div style={styles.smallText}>
                      {template.category} · {template.frequency} · {money(template.amount)}
                    </div>
                    <div style={styles.smallText}>Starts {formatDate(template.startDate)}</div>
                  </div>
                  <div style={styles.buttonRow}>
                    <button style={styles.secondaryButton} onClick={() => startEdit(template)}>
                      Edit
                    </button>
                    <button style={styles.dangerButton} onClick={() => removeTemplate(template.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Upcoming dues</h2>
            <div style={styles.filterRow}>
              {(['all', 'upcoming', 'overdue', 'paid'] as const).map((key) => (
                <button
                  key={key}
                  style={filter === key ? styles.filterActive : styles.filterButton}
                  onClick={() => setFilter(key)}
                >
                  {capitalize(key)}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Bill</th>
                  <th style={styles.th}>Due date</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleDueItems.map((item) => {
                  const overdue = item.status === 'unpaid' && item.dueDate < isoToday();
                  return (
                    <tr key={item.id} style={overdue ? styles.rowOverdue : undefined}>
                      <td style={styles.td}>{item.nameSnapshot}</td>
                      <td style={styles.td}>{formatDate(item.dueDate)}</td>
                      <td style={styles.td}>
                        <input
                          style={{ ...styles.input, minWidth: 96 }}
                          type="number"
                          step="0.01"
                          value={item.amountSnapshot}
                          onChange={(e) => updateAmountSnapshot(item.id, e.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <span style={badgeStyle(item.status, overdue)}>
                          {overdue ? 'overdue' : item.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.primaryButton} onClick={() => togglePaid(item.id)}>
                          Mark as {item.status === 'paid' ? 'unpaid' : 'paid'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleDueItems.length === 0 && <p style={styles.smallText}>No due items in this view.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.smallText}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function seedDueItems(bills: BillTemplate[]) {
  return syncDueItems(bills, []);
}

function syncDueItems(templates: BillTemplate[], current: DueItem[]) {
  const next = [...current.filter((item) => templates.some((template) => template.id === item.billId))];

  for (const template of templates) {
    if (!template.active) continue;

    const dates = generateDates(template.startDate, template.frequency, HORIZON_DAYS);
    for (const date of dates) {
      const exists = next.some((item) => item.billId === template.id && item.dueDate === date);
      if (!exists) {
        next.push({
          id: cryptoId(),
          billId: template.id,
          nameSnapshot: template.name,
          amountSnapshot: template.amount,
          dueDate: date,
          status: 'unpaid',
        });
      }
    }
  }

  return next.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function generateDates(startDate: string, frequency: Frequency, horizonDays: number) {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const limit = addDays(new Date(), horizonDays);

  if (frequency === 'once') {
    dates.push(toIso(start));
    return dates;
  }

  let cursor = new Date(start);
  while (cursor <= limit) {
    dates.push(toIso(cursor));
    if (frequency === 'weekly') cursor = addDays(cursor, 7);
    if (frequency === 'fortnightly') cursor = addDays(cursor, 14);
    if (frequency === 'monthly') cursor = addMonths(cursor, 1);
  }

  return dates;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDate(input: string) {
  return new Date(input + 'T00:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function money(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'GBP',
  }).format(value || 0);
}

function toIso(date: Date) {
  return date.toISOString().split('T')[0];
}

function isoToday() {
  return toIso(new Date());
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function cryptoId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function badgeStyle(status: DueStatus, overdue: boolean): React.CSSProperties {
  if (overdue) return { ...styles.badgePill, background: 'rgba(255,122,122,0.16)', color: '#ffb3b3' };
  if (status === 'paid') return { ...styles.badgePill, background: 'rgba(83,209,141,0.16)', color: '#aef0c9' };
  return { ...styles.badgePill, background: 'rgba(255,207,102,0.16)', color: '#ffe09a' };
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: 24,
  },
  shell: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gap: 20,
  },
  hero: {
    background: 'rgba(18, 25, 51, 0.9)',
    border: '1px solid var(--border)',
    borderRadius: 24,
    padding: 24,
  },
  badge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(134,168,255,0.18)',
    color: '#c8d5ff',
    fontSize: 12,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 42,
  },
  subtitle: {
    margin: '10px 0 0',
    color: 'var(--muted)',
    maxWidth: 700,
    lineHeight: 1.5,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
  },
  statCard: {
    background: 'rgba(18, 25, 51, 0.9)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: 18,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    marginTop: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: 20,
  },
  panel: {
    background: 'rgba(18, 25, 51, 0.9)',
    border: '1px solid var(--border)',
    borderRadius: 24,
    padding: 20,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  panelTitle: {
    margin: 0,
    fontSize: 22,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    marginTop: 16,
  },
  field: {
    display: 'grid',
    gap: 8,
  },
  label: {
    color: 'var(--muted)',
    fontSize: 14,
  },
  input: {
    width: '100%',
    background: 'var(--panel-2)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '12px 14px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text)',
    marginTop: 28,
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  primaryButton: {
    border: 0,
    borderRadius: 14,
    padding: '11px 14px',
    background: 'var(--accent)',
    color: '#0e1630',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '11px 14px',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
  },
  dangerButton: {
    border: '1px solid rgba(255,122,122,0.45)',
    borderRadius: 14,
    padding: '11px 14px',
    background: 'transparent',
    color: '#ffc0c0',
    cursor: 'pointer',
  },
  stack: {
    display: 'grid',
    gap: 12,
    marginTop: 16,
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 18,
  },
  cardTitle: {
    fontWeight: 700,
    marginBottom: 4,
  },
  smallText: {
    color: 'var(--muted)',
    fontSize: 14,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '8px 12px',
    background: 'transparent',
    color: 'var(--muted)',
    cursor: 'pointer',
  },
  filterActive: {
    border: '1px solid var(--accent)',
    borderRadius: 999,
    padding: '8px 12px',
    background: 'rgba(134,168,255,0.16)',
    color: '#dbe4ff',
    cursor: 'pointer',
  },
  tableWrap: {
    overflowX: 'auto',
    marginTop: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    color: 'var(--muted)',
    fontSize: 14,
    fontWeight: 600,
    padding: '0 0 12px',
  },
  td: {
    padding: '12px 8px 12px 0',
    borderTop: '1px solid rgba(44,58,115,0.6)',
    verticalAlign: 'middle',
  },
  rowOverdue: {
    background: 'rgba(255,122,122,0.05)',
  },
  badgePill: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    textTransform: 'capitalize',
    fontSize: 13,
    fontWeight: 700,
  },
};

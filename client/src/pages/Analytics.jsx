import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  RefreshCw,
} from "lucide-react";

const API_URL = "https://finora-backend-0qa8.onrender.com/api/transactions";

const COLORS = [
  "#62e6a6",
  "#a78bfa",
  "#60a5fa",
  "#fbbf24",
  "#fb7185",
  "#38bdf8",
];

function getAuthConfig() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getDateKey(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateValue, options = {}) {
  if (!dateValue) return "Selected date";

  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Selected date";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

function sumAmount(items, type) {
  return items
    .filter((transaction) => transaction.type === type)
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0
    );
}

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("monthly");

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedMonth, setSelectedMonth] = useState(
    todayKey.slice(0, 7)
  );

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL, getAuthConfig());
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error("Unexpected transactions response.");
      }

      setTransactions(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load financial analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

   useEffect(() => {
  let cancelled = false;

  async function fetchTransactions() {
    try {
      const response = await axios.get(API_URL, getAuthConfig());
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error("Unexpected transactions response.");
      }

      if (cancelled) return;

      setTransactions(data);
      setError("");
    } catch (err) {
      if (cancelled) return;

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load financial analytics."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchTransactions();

  return () => {
    cancelled = true;
  };
}, []);
  useEffect(() => {
    const handleFocus = () => loadTransactions();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadTransactions();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadTransactions]);

  const selectedTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const dateKey = getDateKey(transaction.date);

      return view === "daily"
        ? dateKey === selectedDate
        : dateKey.startsWith(selectedMonth);
    });
  }, [transactions, view, selectedDate, selectedMonth]);

  const income = sumAmount(selectedTransactions, "Income");
  const expenses = sumAmount(selectedTransactions, "Expense");
  const savings = income - expenses;

  const savingsRate =
    income > 0 ? Math.round((savings / income) * 100) : 0;

  const chartData = useMemo(() => {
    if (view === "daily") {
      if (selectedTransactions.length === 0) return [];

      return [
        {
          label: formatDateLabel(selectedDate),
          income,
          expenses,
        },
      ];
    }

    const [year, month] = selectedMonth.split("-").map(Number);

    if (!year || !month) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyTotals = {};

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${selectedMonth}-${String(day).padStart(2, "0")}`;

      dailyTotals[dateKey] = {
        income: 0,
        expenses: 0,
      };
    }

    selectedTransactions.forEach((transaction) => {
      const dateKey = getDateKey(transaction.date);

      if (!dailyTotals[dateKey]) return;

      const amount = Number(transaction.amount || 0);

      if (transaction.type === "Income") {
        dailyTotals[dateKey].income += amount;
      } else if (transaction.type === "Expense") {
        dailyTotals[dateKey].expenses += amount;
      }
    });

    return Object.entries(dailyTotals).map(([dateKey, totals]) => ({
      label: String(Number(dateKey.slice(-2))),
      fullDate: dateKey,
      ...totals,
    }));
  }, [
    view,
    selectedTransactions,
    selectedDate,
    selectedMonth,
    income,
    expenses,
  ]);

  const categoryData = useMemo(() => {
    const categoryMap = {};

    selectedTransactions
      .filter((transaction) => transaction.type === "Expense")
      .forEach((transaction) => {
        const category = transaction.category || "Other";

        categoryMap[category] =
          (categoryMap[category] || 0) +
          Number(transaction.amount || 0);
      });

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [selectedTransactions]);

  const periodLabel =
    view === "daily"
      ? formatDateLabel(selectedDate)
      : new Date(`${selectedMonth}-15T12:00:00`).toLocaleDateString(
          "en-IN",
          {
            month: "long",
            year: "numeric",
          }
        );

  const periodWord = view === "daily" ? "Daily" : "Monthly";

  return (
    <main className="analytics-page">
      <a href="/" className="analytics-back-link">
        ← Back to Dashboard
      </a>

      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">
            YOUR MONEY, IN PERSPECTIVE
          </p>
          <h1>Wealth Analytics</h1>
          <p>
            Understand your cash flow and build better financial habits.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "analytics-spinning" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <section className="analytics-date-filter">
        <div
          className="analytics-view-toggle"
          role="group"
          aria-label="Analytics view"
        >
          <button
            type="button"
            className={view === "daily" ? "active" : ""}
            onClick={() => setView("daily")}
            aria-pressed={view === "daily"}
          >
            Daily View
          </button>

          <button
            type="button"
            className={view === "monthly" ? "active" : ""}
            onClick={() => setView("monthly")}
            aria-pressed={view === "monthly"}
          >
            Monthly View
          </button>
        </div>

        {view === "daily" ? (
          <>
            <label htmlFor="analytics-date">Select date</label>
            <input
              id="analytics-date"
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
            />
          </>
        ) : (
          <>
            <label htmlFor="analytics-month">Select month</label>
            <input
              id="analytics-month"
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(event.target.value)
              }
            />
          </>
        )}
      </section>

      {error && (
        <div className="analytics-error">
          <p>{error}</p>
          <button type="button" onClick={loadTransactions}>
            Try again
          </button>
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="analytics-empty">
          Loading your financial analytics...
        </div>
      ) : (
        <>
          <section className="analytics-stats">
            <article className="analytics-stat-card">
              <span className="analytics-stat-icon">
                <Wallet />
              </span>
              <p>{periodWord} Income</p>
              <h2>{formatMoney(income)}</h2>
              <small>{periodLabel}</small>
            </article>

            <article className="analytics-stat-card">
              <span className="analytics-stat-icon purple">
                <TrendingDown />
              </span>
              <p>{periodWord} Expenses</p>
              <h2>{formatMoney(expenses)}</h2>
              <small>{periodLabel}</small>
            </article>

            <article className="analytics-stat-card">
              <span className="analytics-stat-icon">
                <PiggyBank />
              </span>
              <p>{periodWord} Savings</p>
              <h2>{formatMoney(savings)}</h2>
              <small>{savingsRate}% savings rate</small>
            </article>

            <article className="analytics-stat-card">
              <span className="analytics-stat-icon blue">
                <TrendingUp />
              </span>
              <p>{periodWord} Net Cash Flow</p>
              <h2>{formatMoney(savings)}</h2>
              <small>Income minus expenses</small>
            </article>
          </section>

          <section className="analytics-panels">
            <article className="analytics-panel analytics-chart-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h2>Cash Flow Overview</h2>
                  <p>
                    {view === "daily"
                      ? "Income and expenses for the selected date"
                      : "Daily income and expenses across the selected month"}
                  </p>
                </div>

                <span className="analytics-period">
                  {view === "daily" ? "Daily view" : "Monthly view"}
                </span>
              </div>

              {chartData.length === 0 ? (
                <div className="analytics-empty">
                  No transactions found for {periodLabel}.
                </div>
              ) : (
                <div className="analytics-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="incomeFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#62e6a6"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor="#62e6a6"
                            stopOpacity={0}
                          />
                        </linearGradient>

                        <linearGradient
                          id="expenseFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#a78bfa"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="100%"
                            stopColor="#a78bfa"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#273039"
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                        stroke="#89958f"
                        tickLine={false}
                        minTickGap={view === "monthly" ? 12 : 5}
                      />

                      <YAxis
                        stroke="#89958f"
                        tickFormatter={(value) =>
                          value >= 1000
                            ? `₹${Math.round(value / 1000)}k`
                            : `₹${value}`
                        }
                      />

                      <Tooltip
                        labelFormatter={(label, payload) =>
                          view === "monthly" &&
                          payload?.[0]?.payload?.fullDate
                            ? formatDateLabel(
                                payload[0].payload.fullDate
                              )
                            : label
                        }
                        contentStyle={{
                          background: "#151c22",
                          border: "1px solid #303a40",
                          borderRadius: 10,
                          color: "#f1f5f3",
                        }}
                        formatter={(value) => formatMoney(value)}
                      />

                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#62e6a6"
                        fill="url(#incomeFill)"
                        strokeWidth={2}
                      />

                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#a78bfa"
                        fill="url(#expenseFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="analytics-legend">
                <span>
                  <i className="legend-income" /> Income
                </span>
                <span>
                  <i className="legend-expense" /> Expenses
                </span>
              </div>
            </article>

            <article className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h2>Spending Breakdown</h2>
                  <p>
                    {view === "daily"
                      ? "Expense categories for the selected date"
                      : "Expense categories for the selected month"}
                  </p>
                </div>
              </div>

              {categoryData.length === 0 ? (
                <div className="analytics-empty">
                  No expenses recorded for {periodLabel}.
                </div>
              ) : (
                <>
                  <div className="analytics-pie-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={90}
                          paddingAngle={4}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => formatMoney(value)}
                          contentStyle={{
                            background: "#151c22",
                            border: "1px solid #303a40",
                            borderRadius: 10,
                            color: "#f1f5f3",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="analytics-category-list">
                    {categoryData
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((category, index) => (
                        <div
                          className="analytics-category-row"
                          key={category.name}
                        >
                          <span
                            className="analytics-category-dot"
                            style={{
                              background:
                                COLORS[index % COLORS.length],
                            }}
                          />
                          <span>{category.name}</span>
                          <strong>
                            {formatMoney(category.value)}
                          </strong>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </article>
          </section>

          <section className="analytics-insight">
            <div>
              <p className="analytics-eyebrow">
                {view === "daily" ? "DAILY INSIGHT" : "MONTHLY INSIGHT"}
              </p>

              <h2>
                {selectedTransactions.length === 0
                  ? "No financial activity recorded for this period."
                  : savings >= 0
                  ? `You're spending less than or equal to your income ${
                      view === "daily" ? "today" : "this month"
                    }.`
                  : `Your expenses are higher than your income ${
                      view === "daily" ? "today" : "this month"
                    }.`}
              </h2>

              <p>
                {selectedTransactions.length === 0
                  ? "Choose another period or add a transaction."
                  : `Your net cash flow for ${periodLabel} is ${formatMoney(
                      savings
                    )}.`}
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
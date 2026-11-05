import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
} from "react-router-dom";
import axios from "axios";
import finoraLogo from "./assets/finora.png";

import {
  LayoutDashboard,
  Wallet,
  Target,
  Repeat2,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  EyeOff,
  X,
  Pencil,
  Trash2,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  Menu,
} from "lucide-react";
import {getNotifications,markAllNotificationsRead,addNotification} from "./utils/notifications";

import "./App.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Goals from "./pages/Goals";
import Habits from "./pages/Habits";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Wealth from "./pages/Wealth";
import Feedback from "./pages/Feedback";
import Transactions from "./pages/Transactions";
import SettingsPage from "./pages/Settings";

const API_URL = "http://localhost:5000/api/transactions";
const GOALS_API_URL = "http://localhost:5000/api/goals";

function getAuthConfig() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

const emptyForm = () => ({
  title: "",
  type: "Expense",
  amount: "",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
});

function Dashboard() {
  const [showBalance, setShowBalance] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [dashboardGoals, setDashboardGoals] = useState([]);

  const [goalsLoading, setGoalsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const [transactionError, setTransactionError] = useState("");
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(getNotifications());
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  // Keep logged-in user information updated
  useEffect(() => {
    const updateUser = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("user")) || null);
      } catch {
        setCurrentUser(null);
      }
    };

    window.addEventListener("auth-change", updateUser);

    return () => {
      window.removeEventListener("auth-change", updateUser);
    };
  }, []);

  // Load dashboard savings goals
  useEffect(() => {
    async function fetchDashboardGoals() {
      try {
        const response = await axios.get(
          GOALS_API_URL,
          getAuthConfig()
        );

        setDashboardGoals(response.data.data || []);
      } catch (error) {
        if (error.response?.status===401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("auth-change"));
          navigate("/login", { replace: true });
          return;
        }
        console.error("Failed to load dashboard goals:", error);
      } finally {
        setGoalsLoading(false);
      }
    }

    fetchDashboardGoals();
  }, [navigate]);

  // Load transactions
  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await axios.get(API_URL, getAuthConfig());

        if (response.data.success) {
          setTransactions(response.data.data);
          setTransactionError("");
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("auth-change"));
          navigate("/login", { replace: true });
          return;
        }
        console.error("Failed to load transactions:", error);

        setTransactionError(
          error.response?.data?.message ||
            "Could not connect to Finora server. Please check that the backend is running."
        );
      } finally {
        setTransactionsLoading(false);
      }
    }

    fetchTransactions();
  }, [navigate]);

  useEffect(() => {
  const refreshNotifications = () => {
    setNotifications(getNotifications());
  };

  window.addEventListener(
    "notifications-updated",
    refreshNotifications
  );

  return () => {
    window.removeEventListener(
      "notifications-updated",
      refreshNotifications
    );
  };
}, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.dispatchEvent(new Event("auth-change"));
    setCurrentUser(null);

    navigate("/login", { replace: true });
  }

  function openAddForm() {
    setEditingTransactionId(null);
    setForm(emptyForm());
    setTransactionError("");
    setShowTransactionForm(true);
  }

  function openEditForm(item) {
    setEditingTransactionId(item._id);

    setForm({
      title: item.title,
      type: item.type,
      amount: String(item.amount),
      category: item.category,
       date: item.date
  ? new Date(item.date).getFullYear() +
    "-" +
    String(new Date(item.date).getMonth() + 1).padStart(2, "0") +
    "-" +
    String(new Date(item.date).getDate()).padStart(2, "0")
  : "",
    });

    setTransactionError("");
    setShowTransactionForm(true);
  }

  function closeTransactionForm() {
    if (savingTransaction) return;

    setShowTransactionForm(false);
    setEditingTransactionId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.title.trim() ||
      !["Income", "Expense"].includes(form.type) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !form.category.trim() ||
      !form.date
    ) {
      setTransactionError("Please enter valid transaction details.");
      return;
    }

    setSavingTransaction(true);
    setTransactionError("");

    const payload = {
      title: form.title.trim(),
      type: form.type,
      amount,
      category: form.category.trim(),
      date: form.date,
    };

    try {
      let response;

      if (editingTransactionId) {
        response = await axios.put(
          `${API_URL}/${editingTransactionId}`,
          payload,
          getAuthConfig()
        );

        if (!response.data.success) {
          throw new Error("Transaction could not be updated.");
        }

        setTransactions((previous) =>
          previous.map((item) =>
            item._id === editingTransactionId
              ? response.data.data
              : item
          )
        );
      } else {
        response = await axios.post(
          API_URL,
          payload,
          getAuthConfig()
        );

        if (!response.data.success) {
          throw new Error("Transaction could not be saved.");
        }

        setTransactions((previous) => [
          response.data.data,
          ...previous,
        ]);
      }

      setForm(emptyForm());
      setEditingTransactionId(null);
      setShowTransactionForm(false);
      setTransactionError("");
    } catch (error) {
      console.error("Failed to save transaction:", error);

      setTransactionError(
        error.response?.data?.message ||
          error.message ||
          "Transaction could not be saved. Please try again."
      );
    } finally {
      setSavingTransaction(false);
    }
    addNotification(
  editingTransactionId ? "Transaction updated" : "New transaction added",
  `${payload.title} · ₹${amount.toLocaleString("en-IN")}`,
  "transaction"
);
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setTransactionError("");

    try {
      const response = await axios.delete(
        `${API_URL}/${item._id}`,
        getAuthConfig()
      );

      if (!response.data.success) {
        throw new Error("Transaction could not be deleted.");
      }

      setTransactions((previous) =>
        previous.filter((transaction) => transaction._id !== item._id)
      );
    } catch (error) {
      console.error("Failed to delete transaction:", error);

      setTransactionError(
        error.response?.data?.message ||
          "Could not delete transaction. Please try again."
      );
    }
    addNotification(
  "Transaction deleted",
  `${item.title} · ₹${Number(item.amount).toLocaleString("en-IN")}`,
  "transaction"
);
  }

  // Current month calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Monthly income and expenses
  const monthlyTransactions = transactions.filter((item) => {
    const date = new Date(item.date);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const income = monthlyTransactions
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = monthlyTransactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // Cash flow chart transactions
  const chartTransactions = transactions.filter((item) => {
    const date = new Date(item.date);

    if (Number.isNaN(date.getTime())) return false;

    if (chartPeriod === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      return date >= weekStart && date <= todayEnd;
    }

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  // Create daily chart data
  const chartDays =
    chartPeriod === "week"
      ? 7
      : new Date(currentYear, currentMonth + 1, 0).getDate();

  const dailyCashFlow = Array.from(
    { length: chartDays },
    (_, index) => {
      const date = new Date(now);

      if (chartPeriod === "week") {
        date.setDate(now.getDate() - 6 + index);
      } else {
        date.setDate(index + 1);
      }

      const dayTransactions = chartTransactions.filter((item) => {
        const transactionDate = new Date(item.date);

        return (
          transactionDate.getDate() === date.getDate() &&
          transactionDate.getMonth() === date.getMonth() &&
          transactionDate.getFullYear() === date.getFullYear()
        );
      });

      return {
        day: index + 1,
        label: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        income: dayTransactions
          .filter((item) => item.type === "Income")
          .reduce((sum, item) => sum + Number(item.amount), 0),
        expenses: dayTransactions
          .filter((item) => item.type === "Expense")
          .reduce((sum, item) => sum + Number(item.amount), 0),
      };
    }
  );

  const maxCashFlow = Math.max(
    1,
    ...dailyCashFlow.map((item) =>
      Math.max(item.income, item.expenses)
    )
  );
  const chartScale = Math.ceil(maxCashFlow / 1000) * 1000 || 1000;

const yAxisValues = [4, 3, 2, 1, 0].map(
  (step) => (chartScale * step) / 4
);

  // Total balance
  const balance = transactions.reduce(
    (sum, item) =>
      sum +
      (item.type === "Income"
        ? Number(item.amount)
        : -Number(item.amount)),
    0
  );
const filteredTransactions = transactions.filter((item) => {
  const query = searchQuery.toLowerCase().trim();

  return (
    item.title?.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query) ||
    item.type?.toLowerCase().includes(query)
  );
});
  return (
    <div className="app-shell">
      <aside className="sidebar">
         <div className="brand">
  <img src={finoraLogo} alt="Finora logo" className="brand-logo" />
  <span>
    finora<span className="brand-dot">₹</span>
  </span>

  <button
    type="button"
    className="mobile-menu-toggle"
    aria-label="Toggle navigation"
    onClick={() => setMobileMenuOpen((prev) => !prev)}
  >
    {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
  </button>
</div>

        
<div className={`sidebar-content ${mobileMenuOpen ? "open" : ""}`}>
        <nav>
          <Link to="/dashboard" className="nav-item active" onClick={()=>setMobileMenuOpen(false)}>
            <LayoutDashboard size={19} /> Dashboard
          </Link>

          <Link to="/transactions" className="nav-item" onClick={()=>setMobileMenuOpen(false)}>
            <Wallet size={19} /> Transactions
          </Link>

          <Link to="/goals" className="nav-item" onClick={()=>setMobileMenuOpen(false)}>
            <Target size={19} /> 
            <span>Savings Goals</span>
          </Link>

          <Link to="/habits" className="nav-item" onClick={()=>setMobileMenuOpen(false)}>
            <Repeat2 size={19} /> Habits
          </Link>

          <Link to="/analytics" className="nav-item" onClick={()=>setMobileMenuOpen(false)}>
            <TrendingUp size={19} /> Wealth Analytics
          </Link>

          <Link to="/wealth" className="nav-item" onClick={()=>setMobileMenuOpen(false)}>
            <Wallet size={18} />
            <span>Wealth Portfolio</span>
          </Link>

          <Link to="/feedback" className="nav-item" onClick={()=>setMobileMenuOpen(false)}>
            <MessageSquare size={19} />
            <span>Feedback & Support</span>
          </Link>

          {currentUser?.role === "admin" && (
            <Link to="/admin" className="nav-item" onClick={()=>setMobileMenuOpen(false)}>
              <ShieldCheck size={19} />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        <p className="nav-label settings-label">PREFERENCES</p>

        <Link to="/settings" className="nav-item">
          <Settings size={19} /> Settings
        </Link>
</div>
        <div className="sidebar-bottom">
          <div className="avatar">
            {currentUser?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <strong>{currentUser ? currentUser.name : "Guest User"}</strong>
            <small>{currentUser ? "Finora account" : "Not signed in"}</small>
          </div>

          {currentUser ? (
            <button
              type="button"
              className="text-button"
              onClick={handleLogout}
              title="Log out"
            >
              Logout
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Link to="/login" style={{ color: "#a3e635", fontSize: 12 }}>
                Login
              </Link>

              <Link to="/signup" style={{ color: "#a3e635", fontSize: 12 }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>

          <div className="top-actions">
            <button
  type="button"
  className="icon-button"
  aria-label="Search"
  title="Search transactions"
  onClick={() => {
    setSearchOpen((previous) => !previous);
    setSearchQuery("");
  }}
>
  {searchOpen ? <X size={18} /> : <Search size={18} />}
</button>
{searchOpen && (
  <input
    type="search"
    className="search-input"
    placeholder="Search transactions..."
    value={searchQuery}
    onChange={(event) => setSearchQuery(event.target.value)}
    autoFocus
  />
)}

            <div className="notification-wrapper">
  <button
    type="button"
    className="icon-button notification"
    aria-label="Notifications"
    onClick={() => setShowNotifications((prev) => !prev)}
  >
    <Bell size={18} />

    {unreadCount > 0 && (
      <span className="notification-count">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </button>

  {showNotifications && (
    <div className="notification-dropdown">
      <div className="notification-header">
        <div>
          <h3>Notifications</h3>
          <small>{unreadCount} unread</small>
        </div>

        <button
          type="button"
          className="text-button"
          onClick={() => {
            markAllNotificationsRead();
            setNotifications(getNotifications());
          }}
        >
          Mark all read
        </button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <p className="notification-empty">
            You're all caught up! No notifications yet.
          </p>
        ) : (
          notifications.map((item) => (
            <div
              className={`notification-item ${
                item.read ? "" : "unread"
              }`}
              key={item.id}
            >
              <div className="notification-dot" />
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>
                  {new Date(item.date).toLocaleString("en-IN")}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )}
</div>

            <div className="top-avatar">
              {currentUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR FINANCIAL CHECK-IN</p>
            <h1>
              Good to see you<span className="green-text">.</span>
            </h1>
            <p className="subtitle">
              Here's what's happening with your money today.
            </p>
          </div>

          <button className="primary-button" onClick={openAddForm}>
            <Plus size={18} /> Add transaction
          </button>
        </section>

        {transactionError && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              marginBottom: 16,
              borderRadius: 10,
              color: "#ff9b9b",
              background: "rgba(255, 80, 80, 0.1)",
            }}
          >
            {transactionError}
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card balance-card">
            <div className="card-top">
              <span>Total balance</span>

              <button
                className="eye-button"
                aria-label="Toggle balance visibility"
                onClick={() => setShowBalance((previous) => !previous)}
              >
                {showBalance ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </div>

            <h2>
              {showBalance
                ? `₹${balance.toLocaleString("en-IN")}`
                : "••••••••"}
            </h2>

            <p className="stat-foot">
              <span className="trend">
                <ArrowUpRight size={15} /> 12.8%
              </span>
              <span>vs. last month</span>
            </p>

            <div className="balance-decoration" />
          </article>

          <article className="stat-card">
            <div className="card-top">
              <span>Monthly income</span>
              <span className="stat-icon income">
                <ArrowDownRight size={18} />
              </span>
            </div>

            <h2>₹{income.toLocaleString("en-IN")}</h2>

            <p className="stat-foot">
              <span className="trend">+8.2%</span>
              <span>vs. last month</span>
            </p>

            <div className="mini-bars">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          </article>

          <article className="stat-card">
            <div className="card-top">
              <span>Monthly expenses</span>
              <span className="stat-icon expense">
                <ArrowUpRight size={18} />
              </span>
            </div>

            <h2>₹{expenses.toLocaleString("en-IN")}</h2>

            <p className="stat-foot">
              <span className="trend">−4.6%</span>
              <span>vs. last month</span>
            </p>

            <div className="expense-line">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel analytics-panel">
            <div className="panel-heading">
              <div>
                <h3>Cash flow</h3>
                <p>Your income and spending overview</p>
              </div>

               <select
  value={chartPeriod}
  onChange={(e) => setChartPeriod(e.target.value)}
  aria-label="Chart period"
>
  <option value="month">This month</option>
  <option value="week">This week</option>
</select>
            </div>

            <div className="chart-legend">
              <span>
                <i className="legend-income" /> Income
              </span>
              <span>
                <i className="legend-expense" /> Expenses
              </span>
            </div>

            <div className="chart">
              <div className="chart-y-labels">
  {yAxisValues.map((value) => (
    <span key={value}>
      ₹{Math.round(value).toLocaleString("en-IN")}
    </span>
  ))}
</div>

              <div className="chart-area">
                <div className="grid-line line-1" />
                <div className="grid-line line-2" />
                <div className="grid-line line-3" />
                <div className="grid-line line-4" />
                <div className="grid-line line-5" />

              <svg
  viewBox="0 0 600 210"
  preserveAspectRatio="none"
  role="img"
  aria-label="Cash flow chart based on your actual transactions"
>
  <defs>
    <linearGradient
      id="incomeFill"
      x1="0"
      x2="0"
      y1="0"
      y2="1"
    >
      <stop offset="0%" stopColor="#62e6a6" stopOpacity=".22" />
      <stop offset="100%" stopColor="#62e6a6" stopOpacity="0" />
    </linearGradient>
  </defs>

  {[0, 1, 2, 3, 4].map((index) => (
    <line
      key={index}
      x1="0"
      y1={index * 52.5}
      x2="600"
      y2={index * 52.5}
      stroke="#ffffff"
      strokeOpacity=".08"
      strokeDasharray="4 5"
    />
  ))}

  {dailyCashFlow.map((item, index) => {
    const x =
      dailyCashFlow.length > 1
        ? (index / (dailyCashFlow.length - 1)) * 600
        : 300;

    const incomeY = 190 - (item.income / chartScale) * 170;
    const expenseY = 190 - (item.expenses / chartScale) * 170;

    return (
      <g key={item.day}>
        <circle
          cx={x}
          cy={incomeY}
          r="3"
          fill="#62e6a6"
        />
        <circle
          cx={x}
          cy={expenseY}
          r="3"
          fill="#a18cff"
        />
      </g>
    );
  })}

  <polyline
    points={dailyCashFlow
      .map((item, index) => {
        const x =
          dailyCashFlow.length > 1
            ? (index / (dailyCashFlow.length - 1)) * 600
            : 300;

        const y = 190 - (item.income / chartScale) * 170;

        return `${x},${y}`;
      })
      .join(" ")}
    fill="none"
    stroke="#62e6a6"
    strokeWidth="3"
    strokeLinejoin="round"
    strokeLinecap="round"
  />

  <polyline
    points={dailyCashFlow
      .map((item, index) => {
        const x =
          dailyCashFlow.length > 1
            ? (index / (dailyCashFlow.length - 1)) * 600
            : 300;

        const y = 190 - (item.expenses / chartScale) * 170;

        return `${x},${y}`;
      })
      .join(" ")}
    fill="none"
    stroke="#a18cff"
    strokeWidth="3"
    strokeLinejoin="round"
    strokeLinecap="round"
  />
</svg>

                 <div className="chart-x-labels">
  {dailyCashFlow
    .filter((_, index) =>
      chartPeriod === "week" ||
      index % Math.ceil(chartDays / 7) === 0
    )
    .map((item) => (
      <span key={item.label}>{item.label}</span>
    ))}
</div>
              </div>
            </div>
          </article>

          <article className="panel savings-panel" id="savings">
            <div className="panel-heading">
              <div>
                <h3>Savings goals</h3>
                <p>Small steps, big future</p>
              </div>

              <Link
                to="/goals"
                className="more-button"
                aria-label="Manage savings goals"
              >
                •••
              </Link>
            </div>

            {goalsLoading ? (
              <p className="subtitle">Loading your goals...</p>
            ) : dashboardGoals.length === 0 ? (
              <div className="goal-empty-dashboard">
                <Target size={30} />
                <p>No savings goals yet.</p>
                <Link to="/goals" className="text-button">
                  Create your first goal →
                </Link>
              </div>
            ) : (
              <>
                {(() => {
                  const totalTarget = dashboardGoals.reduce(
                    (sum, goal) => sum + Number(goal.targetAmount || 0),
                    0
                  );

                  const totalSaved = dashboardGoals.reduce(
                    (sum, goal) => sum + Number(goal.savedAmount || 0),
                    0
                  );

                  const overallProgress =
                    totalTarget > 0
                      ? Math.min(
                          100,
                          Math.round((totalSaved / totalTarget) * 100)
                        )
                      : 0;

                  return (
                    <>
                      <div className="goal-ring-wrap">
                        <div
                          className="goal-ring"
                          style={{
                            background: `conic-gradient(#62e6a6 ${overallProgress}%, #263440 ${overallProgress}% 100%)`,
                          }}
                        >
                          <div>
                            <strong>{overallProgress}%</strong>
                            <small>overall saved</small>
                          </div>
                        </div>
                      </div>

                      {dashboardGoals.slice(0, 3).map((goal) => {
                        const target = Number(goal.targetAmount) || 0;
                        const saved = Number(goal.savedAmount) || 0;
                        const progress =
                          target > 0
                            ? Math.min(
                                100,
                                Math.round((saved / target) * 100)
                              )
                            : 0;

                        return (
                          <div className="goal-item" key={goal._id}>
                            <div className="goal-emoji">
                              <Target size={18} />
                            </div>

                            <div className="goal-info">
                              <strong>{goal.title}</strong>
                              <small>
                                ₹{saved.toLocaleString("en-IN")} of ₹
                                {target.toLocaleString("en-IN")}
                              </small>

                              <div className="progress-track">
                                <span style={{ width: `${progress}%` }} />
                              </div>
                            </div>

                            <b>{progress}%</b>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}

                <Link to="/goals" className="text-button">
                  Manage all goals →
                </Link>
              </>
            )}
          </article>
        </section>

        <section className="panel transactions-panel" id="transactions">
          <div className="panel-heading">
            <div>
              <h3>Recent transactions</h3>
              <p>Your latest money moves</p>
            </div>

            <button className="text-button" onClick={openAddForm}>
              <Plus size={15} /> Add new
            </button>
          </div>

          {transactionsLoading && (
            <p className="subtitle">Loading transactions...</p>
          )}

          {!transactionsLoading && filteredTransactions.length === 0 && (
            <p className="subtitle">
              No transactions yet. Add your first transaction to get started.
            </p>
          )}

          {!transactionsLoading &&
            filteredTransactions.map((item) => (
              <div className="transaction-row" key={item._id}>
                <div
                  className={`transaction-symbol ${
                    item.type === "Income" ? "salary" : "food"
                  }`}
                >
                  {item.type === "Income" ? "↙" : "↗"}
                </div>

                <div className="transaction-name">
                  <strong>{item.title}</strong>
                  <small>
                    {item.category} ·{" "}
                    {item.date
                      ? new Date(item.date).toLocaleDateString("en-IN")
                      : ""}
                  </small>
                </div>

                <b
                  className={
                    item.type === "Income"
                      ? "amount-positive"
                      : "amount-negative"
                  }
                >
                  {item.type === "Income" ? "+" : "−"} ₹
                  {Number(item.amount).toLocaleString("en-IN")}
                </b>

                <span className="status-pill completed">{item.type}</span>

                <div className="transaction-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Edit ${item.title}`}
                    title="Edit transaction"
                    onClick={() => openEditForm(item)}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Delete ${item.title}`}
                    title="Delete transaction"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </section>

        <section className="panel" id="habits" style={{ marginTop: 19 }}>
          <div className="panel-heading">
            <div>
              <h3>Money habits</h3>
              <p>Build a healthier financial routine, one day at a time.</p>
            </div>
          </div>

          <p className="subtitle">
            Your habit tracker is ready. Visit the Habits section to manage your routine.
          </p>

          <Link to="/habits" className="text-button">
            Open habit tracker →
          </Link>
        </section>

        <footer className="footer-note">
          Built for better money habits <span>✳</span>
          <span>Finora · Personal finance, made clearer.</span>
        </footer>
      </main>

      {showTransactionForm && (
        <div className="modal-backdrop" onClick={closeTransactionForm}>
          <section
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">MONEY MOVEMENT</p>
                <h2 id="transaction-title">
                  {editingTransactionId
                    ? "Edit transaction"
                    : "Add transaction"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Close form"
                disabled={savingTransaction}
                onClick={closeTransactionForm}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="transaction-form">
              <label>
                Transaction name
                <input
                  required
                  maxLength={80}
                  placeholder="e.g. Groceries or Salary"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </label>

              <label>
                Transaction type
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </label>

              <label>
                Amount (₹)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  <option>Food</option>
                  <option>Salary</option>
                  <option>Housing</option>
                  <option>Transport</option>
                  <option>Shopping</option>
                  <option>Health</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                  <option>Savings</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Date
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeTransactionForm}
                  disabled={savingTransaction}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingTransaction}
                >
                  {editingTransactionId ? (
                    <Pencil size={16} />
                  ) : (
                    <Plus size={17} />
                  )}

                  {savingTransaction
                    ? "Saving..."
                    : editingTransactionId
                      ? "Update transaction"
                      : "Save transaction"}
                </button>
              </div>

              <p className="form-note">
                Transactions are saved to the Finora database.
              </p>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("auth-change", syncAuth);

    return () => {
      window.removeEventListener("auth-change", syncAuth);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
  path="/dashboard"
  element={token ? <Dashboard /> : <Navigate to="/login" replace />}
/>

      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/signup"
        element={token ? <Navigate to="/" replace /> : <Signup />}
      />

      <Route
        path="/goals"
        element={token ? <Goals /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/habits"
        element={token ? <Habits /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/analytics"
        element={token ? <Analytics /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/admin"
        element={token ? <Admin /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/wealth"
        element={token ? <Wealth /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/feedback"
        element={token ? <Feedback /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/transactions"
        element={token ? <Transactions/> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings"
        element={token ? <SettingsPage /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
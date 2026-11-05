import { useEffect, useMemo, useState } from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {
  Plus, Search, Pencil, Trash2, Wallet,
  ArrowUpRight, ArrowDownRight, X
} from "lucide-react";

const API_URL = "http://localhost:5000/api/transactions";

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const emptyForm = () => ({
  title: "",
  type: "Expense",
  amount: "",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
});

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();

   useEffect(() => {
  let cancelled = false;

  async function fetchTransactions() {
    try {
      const response = await axios.get(API_URL, authConfig());

      if (cancelled) return;

      if (response.data.success) {
        setTransactions(response.data.data || []);
        setError("");
      } else {
        setError("Unable to load transactions.");
      }
    } catch (err) {
      if (cancelled) return;

      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
      }

      setError(
        err.response?.data?.message ||
        "Could not connect to the Finora server."
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
}, [navigate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesType =
        filter === "All" || item.type === filter;

      const query = search.toLowerCase();

      const matchesSearch =
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [transactions, filter, search]);

  const totalIncome = transactions
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      type: item.type,
      amount: String(item.amount),
      category: item.category,
      date: new Date(item.date).toISOString().slice(0, 10),
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid title and amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        title: form.title.trim(),
        amount,
      };

      const response = editingId
        ? await axios.put(`${API_URL}/${editingId}`, payload, authConfig())
        : await axios.post(API_URL, payload, authConfig());

      if (!response.data.success) {
        throw new Error("Transaction could not be saved.");
      }

      if (editingId) {
        setTransactions((previous) =>
          previous.map((item) =>
            item._id === editingId ? response.data.data : item
          )
        );
      } else {
        setTransactions((previous) => [
          response.data.data,
          ...previous,
        ]);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (err) {
        if (err.response && err.response.status === 401) {
            navigate("/login", { replace: true });
        }
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to save transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;

    try {
      await axios.delete(`${API_URL}/${item._id}`, authConfig());

      setTransactions((previous) =>
        previous.filter((transaction) => transaction._id !== item._id)
      );
    } catch (err) {
        if (err.response && err.response.status === 401) {
            navigate("/login", { replace: true });
        }
      setError(
        err.response?.data?.message ||
        "Unable to delete transaction."
      );
    }
  }

  return (
    <div className="app-shell">
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Transactions</strong>
          </div>
        </header>

        <section className="welcome-row">
            <button
  type="button"
  className="secondary-button"
  onClick={() => navigate("/")}
>
  ← Back to Dashboard
</button>

          <div>
            <p className="eyebrow">MONEY MANAGEMENT</p>
            <h1>
              Transactions<span className="green-text">.</span>
            </h1>
            <p className="subtitle">
              Track and manage all your money movements.
            </p>
          </div>
          

          <button className="primary-button" onClick={openAdd}>
            <Plus size={17} /> Add transaction
          </button>
        </section>

        {error && (
          <div role="alert" style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 9,
            color: "#ff9b9b",
            background: "rgba(255,80,80,.1)",
          }}>
            {error}
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="card-top">
              <span>Total income</span>
              <span className="stat-icon income">
                <ArrowDownRight size={18} />
              </span>
            </div>
            <h2>{money(totalIncome)}</h2>
          </article>

          <article className="stat-card">
            <div className="card-top">
              <span>Total expenses</span>
              <span className="stat-icon expense">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <h2>{money(totalExpenses)}</h2>
          </article>

          <article className="stat-card balance-card">
            <div className="card-top">
              <span>Net balance</span>
              <Wallet size={19} />
            </div>
            <h2>{money(totalIncome - totalExpenses)}</h2>
          </article>
        </section>

        <section className="panel" style={{ marginTop: 20 }}>
          <div className="panel-heading">
            <div>
              <h3>All transactions</h3>
              <p>
                {filteredTransactions.length} transactions found
              </p>
            </div>
          </div>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            margin: "22px 0",
          }}>
            <div style={{ flex: "1 1 220px", position: "relative" }}>
              <Search
                size={17}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  color: "#89939f",
                }}
              />
              <input
                placeholder="Search transactions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 12px 11px 38px",
                  borderRadius: 9,
                  border: "1px solid #29303a",
                  background: "#171d25",
                  color: "#f0f2f5",
                }}
              />
            </div>

            {["All", "Income", "Expense"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: filter === type ? "#62e6a6" : "#29303a",
                  background: filter === type ? "#17271f" : "#171d25",
                  color: filter === type ? "#62e6a6" : "#aab3bf",
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="subtitle">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: "35px 10px", textAlign: "center" }}>
              <Wallet size={30} color="#62e6a6" />
              <p className="subtitle">No matching transactions found.</p>
              <button className="primary-button" onClick={openAdd}>
                <Plus size={16} /> Add your first transaction
              </button>
            </div>
          ) : (
            filteredTransactions.map((item) => (
              <div className="transaction-row" key={item._id}>
                <div className={`transaction-symbol ${
                  item.type === "Income" ? "salary" : "food"
                }`}>
                  {item.type === "Income" ? "↙" : "↗"}
                </div>

                <div className="transaction-name">
                  <strong>{item.title}</strong>
                  <small>
                    {item.category} ·{" "}
                    {new Date(item.date).toLocaleDateString("en-IN")}
                  </small>
                </div>

                <b className={
                  item.type === "Income"
                    ? "amount-positive"
                    : "amount-negative"
                }>
                  {item.type === "Income" ? "+" : "−"} {money(item.amount)}
                </b>

                <span className="status-pill completed">
                  {item.type}
                </span>

                <div className="transaction-actions">
                  <button
                    className="icon-button"
                    title="Edit"
                    aria-label="Edit transaction"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button"
                    title="Delete"
                    aria-label="Delete transaction"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onClick={() => !saving && setShowForm(false)}
        >
          <section
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">MONEY MOVEMENT</p>
                <h2>{editingId ? "Edit transaction" : "Add transaction"}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleSubmit}>
              <label>
                Transaction name
                <input
                  required
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Salary"
                />
              </label>

              <label>
                Type
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
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
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {[
                    "Food", "Salary", "Housing", "Transport",
                    "Shopping", "Health", "Education",
                    "Entertainment", "Savings", "Other",
                  ].map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update transaction" : "Save transaction"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
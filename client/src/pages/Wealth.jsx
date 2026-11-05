import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Wallet, TrendingUp, PiggyBank, Plus, X, Trash2, Pencil,
  RefreshCw, Coins, Building2, Landmark, ChartPie, ArrowLeft,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

const API = "http://localhost:5000/api/assets";
const LIABILITY_API = "http://localhost:5000/api/liabilities";
const NET_WORTH_API = "http://localhost:5000/api/net-worth";

const assetTypes = [
  "Savings", "Fixed Deposit", "Stocks", "Mutual Funds",
  "Gold", "Real Estate", "Other",
];

const liabilityTypes = [
  "Personal Loan", "Home Loan", "Car Loan",
  "Education Loan", "Credit Card", "Other",
];

const colors = [
  "#62e6a6", "#8b9cff", "#f6c76b", "#c792ea",
  "#ff8c9b", "#5bc0eb", "#a7b0bd",
];

const emptyForm = {
  name: "",
  type: "Savings",
  currentValue: "",
  investedAmount: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  notes: "",
};

const emptyLiabilityForm = {
  name: "",
  type: "Personal Loan",
  outstandingAmount: "",
  originalAmount: "",
  dueDate: "",
  notes: "",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function Wealth() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [liabilityLoading, setLiabilityLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [showLiabilityForm, setShowLiabilityForm] = useState(false);
  const [editingLiabilityId, setEditingLiabilityId] = useState(null);
  const [liabilityForm, setLiabilityForm] = useState(emptyLiabilityForm);
  const [liabilitySaving, setLiabilitySaving] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const authConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAssets(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        } 

      setError(err.response?.data?.message || "Unable to load assets.");
    } 
    finally {
      setLoading(false);
    }
  };

  const fetchLiabilities = async () => {
    try {
      setLiabilityLoading(true);

      const response = await axios.get(LIABILITY_API, authConfig());

      setLiabilities(response.data.liabilities || []);
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        } 
      setError(
        err.response?.data?.message || "Unable to load liabilities."
      );
    }
    finally {
      setLiabilityLoading(false);
    }
  };

  const fetchNetWorthHistory = async () => {
    try {
      const response = await axios.get(
        `${NET_WORTH_API}/history`,
        authConfig()
      );

      setHistory(response.data.history || []);
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        } 
      console.error("Net worth history error:", err);
    }
  };

  const saveNetWorthSnapshot = async () => {
    try {
      setSnapshotLoading(true);

      await axios.post(
        `${NET_WORTH_API}/snapshot`,
        {},
        authConfig()
      );

      await fetchNetWorthHistory();
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(
        err.response?.data?.message || "Unable to save net worth snapshot."
      );
    } finally {
      setSnapshotLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchAssets(),
      fetchLiabilities(),
      fetchNetWorthHistory(),
    ]);
  };

   useEffect(() => {
  let cancelled = false;

  async function fetchInitialData() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      setLoading(true);
      setLiabilityLoading(true);

      const [assetsResponse, liabilitiesResponse, historyResponse] =
        await Promise.all([
          axios.get(API, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(LIABILITY_API, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${NET_WORTH_API}/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (cancelled) return;

      setAssets(
        Array.isArray(assetsResponse.data)
          ? assetsResponse.data
          : []
      );

      setLiabilities(
        liabilitiesResponse.data.liabilities || []
      );

      setHistory(
        historyResponse.data.history || []
      );

      setError("");
    } catch (err) {
      if (cancelled) return;

      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load wealth portfolio."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
        setLiabilityLoading(false);
      }
    }
  }

  fetchInitialData();

  return () => {
    cancelled = true;
  };
}, [navigate]);

  const totalValue = useMemo(
    () => assets.reduce(
      (sum, item) => sum + Number(item.currentValue || 0), 0
    ),
    [assets]
  );

  const totalInvested = useMemo(
    () => assets.reduce(
      (sum, item) => sum + Number(item.investedAmount || 0), 0
    ),
    [assets]
  );

  const totalLiabilities = useMemo(
    () => liabilities.reduce(
      (sum, item) => sum + Number(item.outstandingAmount || 0), 0
    ),
    [liabilities]
  );

  const netWorth = totalValue - totalLiabilities;
  const profit = totalValue - totalInvested;

  const profitPercent =
    totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  const distribution = useMemo(() => {
    const grouped = {};

    assets.forEach((asset) => {
      const type = asset.type || "Other";
      grouped[type] =
        (grouped[type] || 0) + Number(asset.currentValue || 0);
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [assets]);

  // ASSET FUNCTIONS

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (asset) => {
    setEditingId(asset._id);

    setForm({
      name: asset.name || "",
      type: asset.type || "Savings",
      currentValue: asset.currentValue ?? "",
      investedAmount: asset.investedAmount ?? "",
      purchaseDate: asset.purchaseDate
        ? new Date(asset.purchaseDate).toISOString().split("T")[0]
        : "",
      notes: asset.notes || "",
    });

    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const current = Number(form.currentValue);
    const invested = Number(form.investedAmount || 0);

    if (
      !form.name.trim() ||
      !form.type ||
      form.currentValue === "" ||
      !Number.isFinite(current) ||
      current < 0 ||
      !Number.isFinite(invested) ||
      invested < 0
    ) {
      setError("Please enter valid asset details and amounts.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        currentValue: current,
        investedAmount: invested,
      };

      if (editingId) {
        await axios.put(`${API}/${editingId}`, payload, authConfig());
      } else {
        await axios.post(API, payload, authConfig());
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);

      await fetchAssets();
      await saveNetWorthSnapshot();
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(err.response?.data?.message || "Unable to save asset.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    try {
      setError("");

      await axios.delete(`${API}/${id}`, authConfig());

      await fetchAssets();
      await saveNetWorthSnapshot();
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(err.response?.data?.message || "Unable to delete asset.");
    }
  };

  // LIABILITY FUNCTIONS

  const openAddLiabilityForm = () => {
    setEditingLiabilityId(null);
    setLiabilityForm(emptyLiabilityForm);
    setShowLiabilityForm(true);
  };

  const openEditLiabilityForm = (item) => {
    setEditingLiabilityId(item._id);

    setLiabilityForm({
      name: item.name || "",
      type: item.type || "Personal Loan",
      outstandingAmount: item.outstandingAmount ?? "",
      originalAmount: item.originalAmount ?? "",
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().split("T")[0]
        : "",
      notes: item.notes || "",
    });

    setShowLiabilityForm(true);
  };

  const handleLiabilitySubmit = async (e) => {
    e.preventDefault();

    const outstanding = Number(liabilityForm.outstandingAmount);
    const original = Number(liabilityForm.originalAmount || 0);

    if (
      !liabilityForm.name.trim() ||
      !liabilityForm.type ||
      liabilityForm.outstandingAmount === "" ||
      !Number.isFinite(outstanding) ||
      outstanding < 0 ||
      !Number.isFinite(original) ||
      original < 0 ||
      (original > 0 && outstanding > original)
    ) {
       setError(
  original > 0 && outstanding > original
    ? "Outstanding amount cannot exceed original amount."
    : "Please enter valid liability details and amounts."
);
      return;
    }

    try {
      setLiabilitySaving(true);
      setError("");

      const payload = {
        ...liabilityForm,
        outstandingAmount: outstanding,
        originalAmount: original,
      };

      if (editingLiabilityId) {
        await axios.put(
          `${LIABILITY_API}/${editingLiabilityId}`,
          payload,
          authConfig()
        );
      } else {
        await axios.post(LIABILITY_API, payload, authConfig());
      }

      setShowLiabilityForm(false);
      setLiabilityForm(emptyLiabilityForm);
      setEditingLiabilityId(null);

      await fetchLiabilities();
      await saveNetWorthSnapshot();
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(
        err.response?.data?.message || "Unable to save liability."
      );
    } finally {
      setLiabilitySaving(false);
    }
  };

  const deleteLiability = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this liability?")
    ) {
      return;
    }

    try {
      setError("");

      await axios.delete(`${LIABILITY_API}/${id}`, authConfig());

      await fetchLiabilities();
      await saveNetWorthSnapshot();
    } catch (err) {
        if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(
        err.response?.data?.message || "Unable to delete liability."
      );
    }
  };

  return (
    <div className="wealth-page">

      {/* HEADER */}

      <div className="wealth-header">
        <button
          className="wealth-refresh"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div>
          <div className="wealth-eyebrow">FINANCIAL OVERVIEW</div>
          <h1>Wealth <span>Portfolio</span></h1>
          <p>Track your assets, liabilities and wealth growth.</p>
        </div>

        <div className="wealth-actions">
          <button className="wealth-refresh" onClick={refreshAll}>
            <RefreshCw size={16} /> Refresh
          </button>

          <button className="wealth-add" onClick={openAddForm}>
            <Plus size={18} /> Add Asset
          </button>
        </div>
      </div>

      {error && <div className="wealth-error">{error}</div>}

      {/* SUMMARY CARDS */}

      <div className="wealth-stats">
        <div className="wealth-stat-card main">
          <div className="wealth-stat-top">
            <span>Total Portfolio Value</span>
            <div className="wealth-icon"><Wallet size={20} /></div>
          </div>
          <h2>{money(totalValue)}</h2>
          <small>Current value of all assets</small>
        </div>

        <div className="wealth-stat-card">
          <div className="wealth-stat-top">
            <span>Total Invested</span>
            <div className="wealth-icon purple">
              <PiggyBank size={20} />
            </div>
          </div>
          <h2>{money(totalInvested)}</h2>
          <small>Capital invested so far</small>
        </div>

        <div className="wealth-stat-card">
          <div className="wealth-stat-top">
            <span>Profit / Loss</span>
            <div className="wealth-icon yellow">
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 className={profit >= 0 ? "positive" : "negative"}>
            {profit >= 0 ? "+" : ""}{money(profit)}
          </h2>
          <small>{profitPercent.toFixed(2)}% overall return</small>
        </div>

        <div className="wealth-stat-card">
          <div className="wealth-stat-top">
            <span>Total Assets</span>
            <div className="wealth-icon blue"><Coins size={20} /></div>
          </div>
          <h2>{assets.length}</h2>
          <small>Assets in your portfolio</small>
        </div>

        <div className="wealth-stat-card">
          <div className="wealth-stat-top">
            <span>Total Liabilities</span>
            <div className="wealth-icon yellow">
              <Landmark size={20} />
            </div>
          </div>
          <h2>{money(totalLiabilities)}</h2>
          <small>Outstanding loans and dues</small>
        </div>

        <div className="wealth-stat-card main">
          <div className="wealth-stat-top">
            <span>Net Worth</span>
            <div className="wealth-icon"><Wallet size={20} /></div>
          </div>
          <h2 className={netWorth >= 0 ? "positive" : "negative"}>
            {money(netWorth)}
          </h2>
          <small>Assets minus liabilities</small>
        </div>
      </div>

      {/* CHARTS AND INSIGHTS */}

      <div className="wealth-content-grid">
        <section className="wealth-panel">
          <div className="wealth-panel-heading">
            <div>
              <h3>Asset Distribution</h3>
              <p>Portfolio breakdown by asset type</p>
            </div>
            <ChartPie size={20} />
          </div>

          {loading ? (
            <div className="wealth-empty">Loading portfolio...</div>
          ) : distribution.length === 0 ? (
            <div className="wealth-empty">
              <ChartPie size={36} />
              <h4>No assets yet</h4>
              <p>Add your first asset to see the distribution.</p>
            </div>
          ) : (
            <>
              <div className="wealth-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {distribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="wealth-legend">
                {distribution.map((item, index) => (
                  <div className="wealth-legend-item" key={item.name}>
                    <span>
                      <i style={{ background: colors[index % colors.length] }} />
                      {item.name}
                    </span>
                    <strong>{money(item.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="wealth-panel">
          <div className="wealth-panel-heading">
            <div>
              <h3>Portfolio Insights</h3>
              <p>A quick look at your financial position</p>
            </div>
            <Landmark size={20} />
          </div>

          <div className="wealth-insight">
            <span>Current portfolio value</span>
            <strong>{money(totalValue)}</strong>
          </div>

          <div className="wealth-insight">
            <span>Invested capital</span>
            <strong>{money(totalInvested)}</strong>
          </div>

          <div className="wealth-insight">
            <span>Total outstanding dues</span>
            <strong className="negative">{money(totalLiabilities)}</strong>
          </div>

          <div className="wealth-insight">
            <span>Actual net worth</span>
            <strong className={netWorth >= 0 ? "positive" : "negative"}>
              {money(netWorth)}
            </strong>
          </div>

          <div className="wealth-note">
            <Building2 size={18} />
            <p>Keep your asset and liability values updated to monitor your wealth accurately.</p>
          </div>
        </section>
      </div>

      {/* NET WORTH GROWTH */}

      <section className="wealth-panel wealth-assets-panel">
        <div className="wealth-panel-heading">
          <div>
            <h3>Net Worth Growth</h3>
            <p>Track your actual wealth over time</p>
          </div>

          <button
            className="wealth-add"
            onClick={saveNetWorthSnapshot}
            disabled={snapshotLoading}
          >
            <Plus size={16} />
            {snapshotLoading ? "Saving..." : "Save Snapshot"}
          </button>
        </div>

        {history.length === 0 ? (
          <div className="wealth-empty">
            <TrendingUp size={36} />
            <h4>No growth history yet</h4>
            <p>Save your first snapshot to start tracking net worth.</p>
          </div>
        ) : (
          <div className="wealth-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid stroke="#26313b" strokeDasharray="3 3" />
                <XAxis
                  dataKey="snapshotDate"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                  stroke="#8995a3"
                />
                <YAxis
                  stroke="#8995a3"
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  formatter={(value) => money(value)}
                  labelFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-IN")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#62e6a6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* LIABILITIES TABLE */}

      <section className="wealth-panel wealth-assets-panel">
        <div className="wealth-panel-heading">
          <div>
            <h3>My Liabilities</h3>
            <p>Manage your loans and outstanding dues</p>
          </div>

          <button className="wealth-add" onClick={openAddLiabilityForm}>
            <Plus size={17} /> Add Liability
          </button>
        </div>

        {liabilityLoading ? (
          <div className="wealth-empty">Loading liabilities...</div>
        ) : liabilities.length === 0 ? (
          <div className="wealth-empty">
            <Landmark size={36} />
            <h4>No liabilities recorded</h4>
            <p>Add your loans or credit card dues to calculate your net worth.</p>
          </div>
        ) : (
          <div className="wealth-table-wrap">
            <table className="wealth-table">
              <thead>
                <tr>
                  <th>Liability</th>
                  <th>Type</th>
                  <th>Original Amount</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {liabilities.map((item) => (
                  <tr key={item._id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="wealth-type">{item.type}</span></td>
                    <td>{money(item.originalAmount)}</td>
                    <td className="negative">
                      <strong>{money(item.outstandingAmount)}</strong>
                    </td>
                    <td>
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      <div className="wealth-row-actions">
                        <button
                          onClick={() => openEditLiabilityForm(item)}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="delete"
                          onClick={() => deleteLiability(item._id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ASSETS TABLE */}

      <section className="wealth-panel wealth-assets-panel">
        <div className="wealth-panel-heading">
          <div>
            <h3>My Assets</h3>
            <p>Manage your savings, investments and other assets</p>
          </div>
          <span className="wealth-count">{assets.length} assets</span>
        </div>

        {loading ? (
          <div className="wealth-empty">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="wealth-empty">
            <Wallet size={38} />
            <h4>Your portfolio is waiting</h4>
            <p>Add savings, fixed deposits, stocks, gold or property.</p>
            <button className="wealth-add" onClick={openAddForm}>
              <Plus size={17} /> Add your first asset
            </button>
          </div>
        ) : (
          <div className="wealth-table-wrap">
            <table className="wealth-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>Profit / Loss</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {assets.map((asset) => {
                  const gain =
                    Number(asset.currentValue || 0) -
                    Number(asset.investedAmount || 0);

                  return (
                    <tr key={asset._id}>
                      <td>
                        <strong>{asset.name}</strong>
                        <small>
                          {asset.purchaseDate
                            ? new Date(asset.purchaseDate).toLocaleDateString("en-IN")
                            : "—"}
                        </small>
                      </td>
                      <td><span className="wealth-type">{asset.type}</span></td>
                      <td>{money(asset.investedAmount)}</td>
                      <td><strong>{money(asset.currentValue)}</strong></td>
                      <td className={gain >= 0 ? "positive" : "negative"}>
                        {gain >= 0 ? "+" : ""}{money(gain)}
                      </td>
                      <td>
                        <div className="wealth-row-actions">
                          <button onClick={() => openEditForm(asset)} title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button
                            className="delete"
                            onClick={() => deleteAsset(asset._id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ADD / EDIT ASSET MODAL */}

      {showForm && (
        <div
          className="wealth-modal-backdrop"
          onClick={() => setShowForm(false)}
        >
          <form
            className="wealth-modal"
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wealth-modal-heading">
              <div>
                <h3>{editingId ? "Edit Asset" : "Add New Asset"}</h3>
                <p>Enter your asset details below.</p>
              </div>

              <button
                type="button"
                className="wealth-close"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label>Asset Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. HDFC Fixed Deposit"
            />

            <label>Asset Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {assetTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <div className="wealth-form-row">
              <div>
                <label>Invested Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.investedAmount}
                  onChange={(e) =>
                    setForm({ ...form, investedAmount: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label>Current Value (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.currentValue}
                  onChange={(e) =>
                    setForm({ ...form, currentValue: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <label>Purchase Date</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm({ ...form, purchaseDate: e.target.value })
              }
            />

            <label>Notes</label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
            />

            <button className="wealth-submit" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Asset" : "Save Asset"}
            </button>
          </form>
        </div>
      )}

      {/* ADD / EDIT LIABILITY MODAL */}

      {showLiabilityForm && (
        <div
          className="wealth-modal-backdrop"
          onClick={() => setShowLiabilityForm(false)}
        >
          <form
            className="wealth-modal"
            onSubmit={handleLiabilitySubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wealth-modal-heading">
              <div>
                <h3>
                  {editingLiabilityId ? "Edit Liability" : "Add New Liability"}
                </h3>
                <p>Enter your loan or outstanding dues details.</p>
              </div>

              <button
                type="button"
                className="wealth-close"
                onClick={() => setShowLiabilityForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            {error && (
  <div className="wealth-error" role="alert">
    {error}
  </div>
)}

            <label>Liability Name *</label>
            <input
              required
              value={liabilityForm.name}
              onChange={(e) =>
                setLiabilityForm({ ...liabilityForm, name: e.target.value })
              }
              placeholder="e.g. HDFC Home Loan"
            />

            <label>Liability Type *</label>
            <select
              value={liabilityForm.type}
              onChange={(e) =>
                setLiabilityForm({ ...liabilityForm, type: e.target.value })
              }
            >
              {liabilityTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <div className="wealth-form-row">
              <div>
                <label>Original Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={liabilityForm.originalAmount}
                  onChange={(e) =>
                    setLiabilityForm({
                      ...liabilityForm,
                      originalAmount: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label>Outstanding Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={liabilityForm.outstandingAmount}
                  onChange={(e) =>
                    setLiabilityForm({
                      ...liabilityForm,
                      outstandingAmount: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <label>Due Date</label>
            <input
              type="date"
              value={liabilityForm.dueDate}
              onChange={(e) =>
                setLiabilityForm({
                  ...liabilityForm,
                  dueDate: e.target.value,
                })
              }
            />

            <label>Notes</label>
            <textarea
              rows="3"
              value={liabilityForm.notes}
              onChange={(e) =>
                setLiabilityForm({
                  ...liabilityForm,
                  notes: e.target.value,
                })
              }
              placeholder="Optional notes..."
            />

            <button
              className="wealth-submit"
              type="submit"
              disabled={liabilitySaving}
            >
              {liabilitySaving
                ? "Saving..."
                : editingLiabilityId
                ? "Update Liability"
                : "Save Liability"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
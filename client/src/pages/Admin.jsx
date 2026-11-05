import { useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  ReceiptText,
  TrendingUp,
  Wallet,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  Clock,
} from "lucide-react";

const API = "https://finora-backend-0qa8.onrender.com/api/admin";
const FEEDBACK_API = "https://finora-backend-0qa8.onrender.com/api/feedback";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    currentUser = {};
  }

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [statsResponse, usersResponse, feedbackResponse] =
        await Promise.all([
          axios.get(`${API}/stats`, config),
          axios.get(`${API}/users`, config),
          axios.get(`${FEEDBACK_API}/admin`, config),
        ]);

      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setFeedbackList(feedbackResponse.data.feedback || []);
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "Admin access only. Your account is not an admin."
          : err.response?.status === 401
          ? "Your session expired. Please log in again."
          : "Could not load admin data. Check the backend and API routes."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateFeedbackStatus(id, status) {
    setFeedbackLoading(true);

    try {
      const response = await axios.patch(
        `${FEEDBACK_API}/admin/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFeedbackList((previous) =>
        previous.map((item) =>
          item._id === id ? response.data.feedback : item
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Could not update feedback status."
      );
    } finally {
      setFeedbackLoading(false);
    }
  }

useEffect(() => {
  if (!token || currentUser.role !== "admin") return;

  let cancelled = false;

  async function fetchAdminData() {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [statsResponse, usersResponse, feedbackResponse] =
        await Promise.all([
          axios.get(`${API}/stats`, config),
          axios.get(`${API}/users`, config),
          axios.get(`${FEEDBACK_API}/admin`, config),
        ]);

      if (cancelled) return;

      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setFeedbackList(feedbackResponse.data.feedback || []);
      setError("");
    } catch (err) {
      if (cancelled) return;

      setError(
        err.response?.status === 403
          ? "Admin access only. Your account is not an admin."
          : err.response?.status === 401
          ? "Your session expired. Please log in again."
          : "Could not load admin data. Check the backend and API routes."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchAdminData();

  return () => {
    cancelled = true;
  };
}, [token, currentUser.role]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="admin-denied">
        <ShieldCheck size={42} />
        <h2>Admin access required</h2>
        <p>This page is only available to authorized administrators.</p>
        <Link to="/">Back to Dashboard</Link>
      </div>
    );
  }

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <Link to="/" className="admin-back">
            <ArrowLeft size={17} /> Dashboard
          </Link>

          <div className="admin-heading">
            <ShieldCheck size={28} />
            <div>
              <h1>Admin Console</h1>
              <p>Finora platform overview and user management</p>
            </div>
          </div>
        </div>

        <button
          className="admin-refresh"
          onClick={loadAdminData}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p className="admin-message">Loading admin data...</p>
      ) : (
        <>
          {stats && (
            <section className="admin-stats">
              <article className="admin-stat">
                <Users />
                <span>Total Users</span>
                <strong>{stats.totalUsers ?? 0}</strong>
              </article>

              <article className="admin-stat">
                <ReceiptText />
                <span>Total Transactions</span>
                <strong>{stats.totalTransactions ?? 0}</strong>
              </article>

              <article className="admin-stat">
                <TrendingUp />
                <span>Recorded Income</span>
                <strong>{money(stats.totalIncome)}</strong>
              </article>

              <article className="admin-stat">
                <Wallet />
                <span>Recorded Expenses</span>
                <strong>{money(stats.totalExpenses)}</strong>
              </article>

              <article className="admin-stat">
                <Users />
                <span>Active Users (30 Days)</span>
                <strong>{stats.activeUsers ?? 0}</strong>
              </article>

              <article className="admin-stat">
                <TrendingUp />
                <span>Total Habit Completions</span>
                <strong>{stats.totalHabitCompletions ?? 0}</strong>
              </article>

              <article className="admin-stat">
                <Wallet />
                <span>Average Goal Completion</span>
                <strong>{stats.averageGoalCompletion ?? 0}%</strong>
              </article>
            </section>
          )}

          {/* Registered Users */}
          <section className="admin-users">
            <div className="admin-section-title">
              <div>
                <h2>Registered Users</h2>
                <p>Latest accounts on the platform (up to 100)</p>
              </div>
              <span>{users.length} shown</span>
            </div>

            {users.length === 0 ? (
              <p className="admin-message">No users found.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={
                              user.role === "admin"
                                ? "admin-role admin-role-active"
                                : "admin-role"
                            }
                          >
                            {user.role || "user"}
                          </span>
                        </td>
                        <td>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Feedback and Complaints */}
          <section className="admin-users">
            <div className="admin-section-title">
              <div>
                <h2>
                  <MessageSquare size={20} /> Feedback & Complaints
                </h2>
                <p>
                  Review user feedback, suggestions and complaints
                </p>
              </div>
              <span>{feedbackList.length} submissions</span>
            </div>

            {feedbackList.length === 0 ? (
              <p className="admin-message">
                No feedback submissions found.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Subject & Message</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {feedbackList.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <strong>
                            {item.user?.name || "Unknown"}
                          </strong>
                          <br />
                          <small>
                            {item.user?.email || "—"}
                          </small>
                        </td>

                        <td>{item.type}</td>

                        <td>
                          <strong>{item.subject}</strong>
                          <br />
                          <small>{item.message}</small>
                        </td>

                        <td>
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>

                        <td>
                          <select
                            value={item.status}
                            disabled={feedbackLoading}
                            onChange={(e) =>
                              updateFeedbackStatus(
                                item._id,
                                e.target.value
                              )
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>

                          <span className="feedback-admin-status">
                            {item.status === "Resolved" ? (
                              <CheckCircle size={13} />
                            ) : (
                              <Clock size={13} />
                            )}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
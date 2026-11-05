import {useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Target } from "lucide-react";
import {Link , useNavigate} from "react-router-dom";
import {addNotification} from "../utils/notifications.js";

const API_URL = "https://finora-backend-0qa8.onrender.com/api/goals";

function getAuthConfig() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

   const loadGoals = useCallback(async () => {
  try {
    const response = await axios.get(API_URL, getAuthConfig());
    setGoals(response.data.data || []);
    setError("");
  } catch (err) {
    if (err.response && err.response.status === 401) {
      navigate("/login", { replace: true });
    }

    setError(err.response?.data?.message || "Could not load goals.");
  } finally {
    setLoading(false);
  }
}, [navigate]);
 useEffect(() => {
  let cancelled = false;

  async function fetchGoals() {
    try {
      const response = await axios.get(API_URL, getAuthConfig());

      if (!cancelled) {
        setGoals(response.data.data || []);
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
        }

        setError(
          err.response?.data?.message || "Could not load goals."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchGoals();

  return () => {
    cancelled = true;
  };
}, [navigate]);

  async function addGoal(e) {
    e.preventDefault();

    const target = Number(targetAmount);
    const saved = savedAmount === "" ? 0 : Number(savedAmount);

    if (
  !title.trim() ||
  !Number.isFinite(target) ||
  target < 1 ||
  !Number.isFinite(saved) ||
  saved < 0 ||
  saved > target
) {
      setError("Enter a title and valid amounts. Savings cannot exceed the target.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await axios.post(
        API_URL,
        {
          title: title.trim(),
          targetAmount: target,
          savedAmount: saved,
          deadline: deadline || null,
        },
        getAuthConfig()
      );

      setTitle("");
      setTargetAmount("");
      setSavedAmount("");
      setDeadline("");
      setShowForm(false);
      await loadGoals();
    } catch (err) {
        if(err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(err.response?.data?.message || "Could not create goal.");
    }
    finally {
      setSaving(false);
    }
    addNotification(
  "New savings goal created",
  `${title.trim()} · Target ₹${Number(targetAmount).toLocaleString("en-IN")}`,
  "goal"
);
  }

  async function deleteGoal(id) {
    if (!window.confirm("Delete this savings goal?")) return;

    try {
      setError("");
      await axios.delete(`${API_URL}/${id}`, getAuthConfig());
      setGoals((current) => current.filter((goal) => goal._id !== id));
      const deletedGoal = goals.find((goal) => goal._id === id);

if (deletedGoal) {
  addNotification(
    "Savings goal deleted",
    deletedGoal.title,
    "goal"
  );
}
    } catch (err) {
        if(err.response?.status === 401) {
            navigate("/login", { replace: true });
        }
      setError(err.response?.data?.message || "Could not delete goal.");
    }
  }

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  return (
    <main className="goals-page">
        <Link to="/" className="goals-back-link">
  ← Back to Dashboard
</Link>
      <header className="goals-header">
        <div>
          <p className="goals-eyebrow">BUILD YOUR FUTURE</p>
          <h1>Savings Goals</h1>
          <p>Small steps today. Bigger milestones tomorrow.</p>
        </div>

        <button
          className="goals-add-button"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          New Goal
        </button>
      </header>

      {error && <p className="goals-error">{error}</p>}

      {showForm && (
        <form className="goals-form" onSubmit={addGoal}>
          <h2>Create a savings goal</h2>

          <label>
            Goal name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Emergency Fund"
              required
            />
          </label>

          <div className="goals-form-grid">
            <label>
              Target amount (₹)
              <input
                type="number"
                min="1"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </label>

            <label>
              Already saved (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
              />
            </label>
          </div>

          <label>
            Target date (optional)
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>

           <button
  className="goals-add-button"
  type="submit"
  disabled={saving}
>
  {saving ? "Saving..." : "Save Goal"}
</button>
        </form>
      )}

      {loading ? (
        <p>Loading your goals...</p>
      ) : goals.length === 0 ? (
        <section className="goals-empty">
          <Target size={38} />
          <h2>Your next milestone starts here</h2>
          <p>Create your first goal and start tracking your progress.</p>
          <button
            className="goals-add-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} /> Create your first goal
          </button>
        </section>
      ) : (
        <section className="goals-grid">
          {goals.map((goal) => {
            const target = Number(goal.targetAmount) || 0;
            const saved = Number(goal.savedAmount) || 0;
            const progress = target > 0
              ? Math.min(100, Math.round((saved / target) * 100))
              : 0;

            return (
              <article className="goal-card" key={goal._id}>
                <div className="goal-card-top">
                  <span className="goal-icon"><Target size={21} /></span>
                  <button
                    className="goal-delete"
                    onClick={() => deleteGoal(goal._id)}
                    aria-label={`Delete ${goal.title}`}
                    title="Delete goal"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <h2>{goal.title}</h2>
                <p className="goal-deadline">
                  {goal.deadline
                    ? `Target date: ${new Date(goal.deadline).toLocaleDateString("en-IN")}`
                    : "No deadline set"}
                </p>

                <div className="goal-amounts">
                  <strong>{money(saved)}</strong>
                  <span>of {money(target)}</span>
                </div>

                <div
                  className="goal-progress-track"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${goal.title} progress`}
                >
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="goal-progress-footer">
                  <span>{progress}% completed</span>
                  <span>{money(Math.max(0, target - saved))} left</span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
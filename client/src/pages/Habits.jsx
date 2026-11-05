import { useCallback,useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, CheckCircle2, Flame, Repeat2 } from "lucide-react";
import {useNavigate} from "react-router-dom";

const API_URL = "http://localhost:5000/api/habits";

function getAuthConfig() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [reminderTime, setReminderTime] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

   const loadHabits = useCallback(async () => {
  try {
    const response = await axios.get(API_URL, getAuthConfig());
    setHabits(response.data.data || []);
    setError("");
  } catch (err) {
    if (err.response?.status === 401) {
      navigate("/login", { replace: true });
      return;
    }

    setError(err.response?.data?.message || "Could not load habits.");
  } finally {
    setLoading(false);
  }
}, [navigate]);

  useEffect(() => {
  let cancelled = false;

  const fetchHabits = async () => {
    try {
      const response = await axios.get(API_URL, getAuthConfig());

      if (!cancelled) {
        setHabits(response.data.data || []);
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setError(err.response?.data?.message || "Could not load habits.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchHabits();

  return () => {
    cancelled = true;
  };
}, [navigate]);

  async function addHabit(e) {
    setSaving(true);
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a habit name.");
      return;
    }

    try {
      setError("");
      await axios.post(
        API_URL,
        { title: title.trim(), frequency, reminderTime },
        getAuthConfig()
      );

      setTitle("");
      setFrequency("Daily");
      setReminderTime("");
      setShowForm(false);
      await loadHabits();
    } catch (err) {
        if(err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(err.response?.data?.message || "Could not create habit.");
    }
    finally {
      setSaving(false);
    }
  }

  async function toggleHabit(id) {
    try {
      setError("");
      const response = await axios.patch(
        `${API_URL}/${id}/toggle`,
        {},
        getAuthConfig()
      );

      setHabits((current) =>
        current.map((habit) =>
          habit._id === id ? response.data.data : habit
        )
      );
    } catch (err) {
        if(err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(err.response?.data?.message || "Could not update habit.");
    }
  }

  async function deleteHabit(id) {
    if (!window.confirm("Delete this habit?")) return;

    try {
      setError("");
      await axios.delete(`${API_URL}/${id}`, getAuthConfig());
      setHabits((current) => current.filter((habit) => habit._id !== id));
    } catch (err) {
        if(err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
        }
      setError(err.response?.data?.message || "Could not delete habit.");
    }
  }

  const completedCount = habits.filter((habit) =>
    (habit.completedDates || []).includes(today)
  ).length;

  const completion = habits.length
    ? Math.round((completedCount / habits.length) * 100)
    : 0;
  function getStreak(completedDates = []) {
    const completed = new Set(completedDates);
    const todayDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    let streak = 0;
    const cursor = new Date(todayDate);
    const today = cursor.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

     
    if (!completed.has(today)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const dateKey = cursor.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      if (!completed.has(dateKey)) break;

      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  return (
    <main className="habits-page">
      <a href="/" className="habits-back-link">← Back to Dashboard</a>

      <header className="habits-header">
        <div>
          <p className="habits-eyebrow">CONSISTENCY BUILDS WEALTH</p>
          <h1>Financial Habits</h1>
          <p>Small daily actions. Stronger financial future.</p>
        </div>

        <button
          className="habits-primary-button"
          onClick={() => setShowForm((value) => !value)}
        >
          <Plus size={18} /> New Habit
        </button>
      </header>

      {error && <p className="habits-error">{error}</p>}

      <section className="habits-summary">
        <article className="habits-summary-card">
          <span className="habits-summary-icon"><CheckCircle2 /></span>
          <p>Completed Today</p>
          <h2>{completedCount}<span> / {habits.length}</span></h2>
        </article>

        <article className="habits-summary-card">
          <span className="habits-summary-icon"><Flame /></span>
          <p>Daily Progress</p>
          <h2>{completion}%</h2>
          <div className="habits-progress-track">
            <div className="habits-progress-fill" style={{ width: `${completion}%` }} />
          </div>
        </article>

        <article className="habits-summary-card">
          <span className="habits-summary-icon"><Repeat2 /></span>
          <p>Active Habits</p>
          <h2>{habits.length}</h2>
        </article>
      </section>

      {showForm && (
        <form className="habits-form" onSubmit={addHabit}>
          <h2>Create a new habit</h2>

          <label>
            Habit name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Track today's expenses"
              required
            />
          </label>

          <div className="habits-form-grid">
            <label>
              Frequency
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </label>

            <label>
              Reminder time (optional)
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </label>
          </div>

           <button
  className="habits-primary-button"
  type="submit"
  disabled={saving}
>
  {saving ? "Saving..." : "Save Habit"}
</button>
        </form>
      )}

      {loading ? (
        <p className="habits-loading">Loading your habits...</p>
      ) : habits.length === 0 ? (
        <section className="habits-empty">
          <Repeat2 size={38} />
          <h2>Build your first money habit</h2>
          <p>Add a habit and mark it complete as you make progress.</p>
          <button className="habits-primary-button" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Create First Habit
          </button>
        </section>
      ) : (
        <section className="habits-list">
          <h2>Your habits <span>({habits.length})</span></h2>

          {habits.map((habit) => {
            const done = (habit.completedDates || []).includes(today);
            const streak = getStreak(habit.completedDates || []);

            return (
              <article className={`habit-card ${done ? "is-complete" : ""}`} key={habit._id}>
                <button
                  className="habit-check-button"
                  onClick={() => toggleHabit(habit._id)}
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  <CheckCircle2 size={23} />
                </button>

                <div className="habit-card-content">
                  <h3>{habit.title}</h3>
                  <p>
                    {habit.frequency}
                    {habit.reminderTime ? ` · Reminder ${habit.reminderTime}` : ""}
                  </p>
                  <p className="habit-streak">
  🔥 {streak} day streak
</p>
                </div>

                <span className={`habit-frequency ${done ? "done" : ""}`}>
                  {done ? "Completed" : "In progress"}
                </span>

                <button
                  className="habit-delete-button"
                  onClick={() => deleteHabit(habit._id)}
                  aria-label={`Delete ${habit.title}`}
                  title="Delete habit"
                >
                  <Trash2 size={18} />
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
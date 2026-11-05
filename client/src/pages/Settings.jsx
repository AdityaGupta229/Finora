import  { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Bell,
  ShieldCheck,
  SlidersHorizontal,
  Save,
} from "lucide-react";

function Settings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      name: user.name || user.username || "",
      email: user.email || "",
    };
  });

  const [currency, setCurrency] = useState("INR");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [goalReminders, setGoalReminders] = useState(true);
  const [message, setMessage] = useState("");

  const handleSave = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const updatedUser = {
      ...user,
      name: profile.name,
      email: profile.email,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("finoraSettings", JSON.stringify({
      currency,
      emailAlerts,
      goalReminders,
    }));

    setMessage("Settings saved successfully!");
  };

  return (
    <main className="main-content">
      <div className="welcome-row">
        <div>
          <div className="breadcrumb">Preferences / Settings</div>
          <h1>Settings</h1>
          <p>Manage your Finora account and preferences.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={17} /> Back to Dashboard
        </button>
      </div>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-heading">
          <h2><User size={19} /> Profile Settings</h2>
        </div>

        <div className="transaction-form">
          <label>Full Name</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Your name"
          />

          <label>Email Address</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Your email"
          />
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-heading">
          <h2><SlidersHorizontal size={19} /> Preferences</h2>
        </div>

        <div className="transaction-form">
          <label>Display Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-heading">
          <h2><Bell size={19} /> Notifications</h2>
        </div>

        <div className="settings-option">
          <div>
            <strong>Email Alerts</strong>
            <p>Receive important account updates.</p>
          </div>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
          />
        </div>

        <div className="settings-option">
          <div>
            <strong>Goal Reminders</strong>
            <p>Get reminders about your savings goals.</p>
          </div>
          <input
            type="checkbox"
            checked={goalReminders}
            onChange={(e) => setGoalReminders(e.target.checked)}
          />
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-heading">
          <h2><ShieldCheck size={19} /> Security</h2>
        </div>
        <p>Keep your account secure. Password changes should be handled through a secure backend flow.</p>
      </section>

      {message && <p style={{ color: "#62e6a6" }}>{message}</p>}

      <button className="primary-button" onClick={handleSave}>
        <Save size={17} /> Save Changes
      </button>
    </main>
  );
}

export default Settings;
import { useEffect, useState } from "react";
import {Link } from "react-router-dom";
import {ArrowLeft} from "lucide-react";
import axios from "axios";
import { MessageSquare, Send, Clock, CheckCircle } from "lucide-react";
import "./Feedback.css";

const API = "https://finora-backend-0qa8.onrender.com/api/feedback";

function Feedback() {
  const [form, setForm] = useState({
    subject: "",
    message: "",
    type: "Feedback",
  });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("token");

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(`${API}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(response.data.feedback || []);
    } catch  {
      setNotice("Unable to load your submissions.");
    }
  };

useEffect(() => {
  if (!token) return;

  const loadFeedback = async () => {
    try {
      const response = await axios.get(`${API}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubmissions(response.data.feedback || []);
    } catch {
      setNotice("Unable to load your submissions.");
    }
  };

  loadFeedback();
}, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice("");

    if (!form.subject.trim() || !form.message.trim()) {
      setNotice("Please fill in both subject and message.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(API, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm({ subject: "", message: "", type: "Feedback" });
      setNotice("Your submission was sent successfully!");
      await fetchFeedback();
    } catch (error) {
      setNotice(error.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page">
        <Link to="/" className="feedback-back">
  <ArrowLeft size={17} />
  Back to Dashboard
</Link>
      <div className="feedback-heading">
        <div>
          <span className="feedback-eyebrow">WE VALUE YOUR VOICE</span>
          <h1>Feedback & Support</h1>
          <p>Share your thoughts, suggestions, or report an issue.</p>
        </div>
        <div className="feedback-heading-icon">
          <MessageSquare size={28} />
        </div>
      </div>

      <div className="feedback-layout">
        <form className="feedback-card" onSubmit={handleSubmit}>
          <h2>Send us a message</h2>

          <label>Submission type</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="Feedback">Feedback</option>
            <option value="Complaint">Complaint</option>
            <option value="Suggestion">Suggestion</option>
          </select>

          <label>Subject</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="What is this about?"
            maxLength={100}
            required
          />

          <label>Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Write your message here..."
            rows={6}
            maxLength={2000}
            required
          />

          {notice && <p className="feedback-notice">{notice}</p>}

          <button type="submit" disabled={loading}>
            <Send size={16} />
            {loading ? "Sending..." : "Submit message"}
          </button>
        </form>

        <div className="feedback-card feedback-history">
          <h2>Your submissions</h2>
          {submissions.length === 0 ? (
            <p className="feedback-empty">
              You haven't submitted any feedback yet.
            </p>
          ) : (
            submissions.map((item) => (
              <div className="feedback-item" key={item._id}>
                <div className="feedback-item-top">
                  <strong>{item.subject}</strong>
                  <span
                    className={`feedback-status ${item.status
                      ?.toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {item.status === "Resolved" ? (
                      <CheckCircle size={13} />
                    ) : (
                      <Clock size={13} />
                    )}
                    {item.status}
                  </span>
                </div>
                <span className="feedback-type">{item.type}</span>
                <p>{item.message}</p>
                <small>
                  {new Date(item.createdAt).toLocaleDateString()}
                </small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Feedback;
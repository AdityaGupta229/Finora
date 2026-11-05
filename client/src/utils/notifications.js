const STORAGE_KEY = "finora_notifications";

export function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function addNotification(title, message, type = "activity") {
  const notifications = getNotifications();

  const newNotification = {
    id: `${Date.now()}-${Math.random()}`,
    title,
    message,
    type,
    date: new Date().toISOString(),
    read: false,
  };

  const updated = [newNotification, ...notifications].slice(0, 50);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  window.dispatchEvent(new Event("notifications-updated"));
}

export function markAllNotificationsRead() {
  const updated = getNotifications().map((item) => ({
    ...item,
    read: true,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  window.dispatchEvent(new Event("notifications-updated"));
}
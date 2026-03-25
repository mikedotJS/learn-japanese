import { useGamification } from '../context/GamificationContext';

export default function XPNotifications() {
  const { notifications } = useGamification();

  if (notifications.length === 0) return null;

  return (
    <div className="xp-notifications">
      {notifications.map((n) => (
        <div key={n.id} className={`xp-toast ${n.type}`}>
          <span className="xp-toast-icon">{n.icon}</span>
          <span className="xp-toast-text">{n.text}</span>
        </div>
      ))}
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsHeader({ title }) {
  const navigate = useNavigate();
  return (
    <header className="settings-header">
      <button
        onClick={() => navigate(-1)}
        className="icon-btn-dark"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
      </button>
      <h1 className="settings-header-title">{title}</h1>
      <div className="w-10" />
    </header>
  );
}
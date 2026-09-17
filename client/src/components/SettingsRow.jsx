import { ChevronRight } from "lucide-react";

export default function SettingsRow({
  icon: Icon,
  label,
  description,
  onClick,
  right,
  danger,
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`settings-row ${danger ? "danger" : ""}`}
    >
      {Icon && (
        <div className="settings-row-icon">
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
      )}
      <div className="settings-row-body">
        <p className="settings-row-label">{label}</p>
        {description && (
          <p className="settings-row-description">{description}</p>
        )}
      </div>
      {right !== undefined ? right : <ChevronRight className="w-4 h-4 text-blue-200/40" />}
    </button>
  );
}
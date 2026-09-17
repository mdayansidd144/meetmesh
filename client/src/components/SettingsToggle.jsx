export default function SettingsToggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`settings-toggle ${checked ? "on" : ""}`}
      aria-pressed={checked}
      aria-label="Toggle"
    >
      <span className="settings-toggle-thumb" />
    </button>
  );
}
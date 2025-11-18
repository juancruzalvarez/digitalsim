type DigitalToggleProps = {
  value: number;
  onChange: (newValue: number) => void;
};


export const DigitalToggle = ({ value, onChange }: DigitalToggleProps) => {
  const isOn = value === 1;

  return (
    <div
      className={`w-12 h-6 relative flex items-center px-1 rounded-full cursor-pointer transition-colors duration-200 ${
        isOn ? "bg-blue-500" : "bg-neutral-700"
      }`}
      onClick={() => onChange(isOn ? 0 : 1)}
    >
      {/* Knob */}
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
          isOn ? "translate-x-6" : "translate-x-0"
        }`}
      />

      {/* Number outside knob, opposite side */}
      <span
        className={`absolute w-4 text-xs font-bold text-white ${
          isOn ? "left-3.5" : "right-1"
        }`}
      >
        {isOn ? 1 : 0}
      </span>
    </div>
  );
};
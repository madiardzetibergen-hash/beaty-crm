import type { Master } from "../types";

type Props = {
  masters: Master[];
  selectedMasterId: number | "all";
  onChange: (value: number | "all") => void;
};

export function MasterFilter({ masters, selectedMasterId, onChange }: Props) {
  return (
    <div className="master-filter">
      <button
        className={selectedMasterId === "all" ? "chip active-red" : "chip"}
        onClick={() => onChange("all")}
      >
        Все
      </button>

      {masters.map((master) => (
        <button
          key={master.id}
          className={selectedMasterId === master.id ? "chip active" : "chip"}
          style={
            selectedMasterId === master.id
              ? { background: master.colorHex, color: "white" }
              : undefined
          }
          onClick={() => onChange(master.id)}
        >
          {master.name}
        </button>
      ))}
    </div>
  );
}
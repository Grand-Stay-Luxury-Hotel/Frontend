import { useState, useRef, useEffect } from "react";
import "./GuestSelector.css";

const CHEVRON = (
  <svg
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * GuestSelector — selector de adultos y niños para el booking-widget.
 *
 * Props:
 *   adultos      : number   (mínimo 1)
 *   ninos        : number   (mínimo 0)
 *   onChange     : ({ adultos, ninos }) => void
 *   capacidadMax : number | null   — capacidad máxima de la hab. seleccionada
 */
export default function GuestSelector({ adultos, ninos, onChange, capacidadMax }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  /* Cierra el panel al hacer clic fuera */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const adjust = (field, delta) => {
    if (field === "adultos") {
      onChange({ adultos: Math.max(1, adultos + delta), ninos });
    } else {
      onChange({ adultos, ninos: Math.max(0, ninos + delta) });
    }
  };

  const totalGuests  = adultos + ninos;
  const overCapacity = capacidadMax !== null && capacidadMax !== undefined && totalGuests > capacidadMax;

  const label =
    adultos + " adulto" + (adultos !== 1 ? "s" : "") +
    (ninos > 0 ? ", " + ninos + " niño" + (ninos !== 1 ? "s" : "") : "");

  return (
    <div ref={wrapRef} className="gs-sel">
      <button
        type="button"
        className={`booking-input gs-sel-btn${overCapacity ? " gs-sel-btn--warn" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="gs-sel-label">{label}</span>
        <span className={`gs-sel-chevron${open ? " open" : ""}`}>
          {CHEVRON}
        </span>
      </button>

      {open && (
        <div className="gs-sel-panel" role="dialog" aria-label="Seleccionar huéspedes">
          <CounterRow
            label="Adultos"
            value={adultos}
            min={1}
            onMinus={() => adjust("adultos", -1)}
            onPlus={() => adjust("adultos", 1)}
          />
          <CounterRow
            label="Niños"
            hint="0–12 años"
            value={ninos}
            min={0}
            onMinus={() => adjust("ninos", -1)}
            onPlus={() => adjust("ninos", 1)}
          />
          {overCapacity && (
            <p className="gs-sel-warn">
              ⚠ Máximo {capacidadMax} huésped{capacidadMax !== 1 ? "es" : ""} para este tipo
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CounterRow({ label, hint, value, min, onMinus, onPlus }) {
  return (
    <div className="gs-sel-row">
      <div className="gs-sel-row-label">
        <span>{label}</span>
        {hint && <span className="gs-sel-hint">{hint}</span>}
      </div>
      <div className="gs-sel-controls">
        <button
          type="button"
          className="gs-sel-counter-btn"
          onClick={onMinus}
          disabled={value <= min}
          aria-label={`Restar ${label}`}
        >
          −
        </button>
        <span className="gs-sel-count">{value}</span>
        <button
          type="button"
          className="gs-sel-counter-btn"
          onClick={onPlus}
          aria-label={`Sumar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

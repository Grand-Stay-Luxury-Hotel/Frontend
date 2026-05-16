import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './GoldDatePicker.css';

registerLocale('es', es);

/**
 * GoldDatePicker — a styled date picker for Grand Stay.
 *
 * Props mirror a subset of react-datepicker:
 *   value      : string  'YYYY-MM-DD'  (controlled, ISO string)
 *   onChange   : (isoString) => void
 *   placeholder: string
 *   minDate    : string  'YYYY-MM-DD'
 *   maxDate    : string  'YYYY-MM-DD'
 *   className  : string  (added to the wrapper div)
 *   inputClass : string  (added to the <input>)
 */
function toDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function GoldDatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  minDate,
  maxDate,
  className = '',
  inputClass = '',
}) {
  return (
    <div className={`gsdp-wrap ${className}`}>
      <DatePicker
        locale="es"
        selected={toDate(value)}
        onChange={(date) => onChange(toISO(date))}
        minDate={toDate(minDate)}
        maxDate={toDate(maxDate)}
        placeholderText={placeholder}
        dateFormat="dd/MM/yyyy"
        calendarClassName="gs-calendar"
        className={`gsdp-input ${inputClass}`}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        autoComplete="off"
      />
      <span className="gsdp-icon" aria-hidden="true">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </span>
    </div>
  );
}

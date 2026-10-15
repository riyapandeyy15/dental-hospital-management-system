// Premium replacement for a plain Bootstrap btn-group status filter.
// options: [{ value, label, icon, count }]. Counts are always real numbers
// passed in by the caller (from the existing list API's own totals/stats) -
// this component never invents or hardcodes them.
function SegmentedFilter({ options, value, onChange, ariaLabel }) {
  return (
    <div className="dhms-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`dhms-segmented-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.icon && <i className={`bi ${option.icon}`} />}
            {option.label}
            {typeof option.count === 'number' && <span className="dhms-segmented-count">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedFilter;

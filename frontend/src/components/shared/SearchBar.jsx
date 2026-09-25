function SearchBar({ value, onChange, placeholder = 'Search...', ariaLabel = 'Search' }) {
  return (
    <div className="position-relative">
      <i
        className="bi bi-search position-absolute text-muted"
        style={{ left: 14, top: '50%', transform: 'translateY(-50%)' }}
        aria-hidden="true"
      />
      <input
        className="form-control ps-5 pe-5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {value && (
        <button
          type="button"
          className="btn btn-sm btn-link text-muted position-absolute p-0"
          style={{ right: 10, top: '50%', transform: 'translateY(-50%)' }}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <i className="bi bi-x-circle-fill" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;

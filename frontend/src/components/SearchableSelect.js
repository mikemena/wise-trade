import React, { useEffect, useRef, useState } from "react";

// A single-select dropdown that opens on click and narrows its
// options as you type. Selecting an option calls onChange with the
// exact value; the x button clears it.
const SearchableSelect = ({ value, options, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  // Close when clicking anywhere outside the component.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleOptions = options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  );

  const select = (option) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="searchable-select" ref={containerRef}>
      <div className="searchable-select-control">
        <input
          type="text"
          className="filter-input searchable-select-input"
          placeholder={placeholder}
          value={open ? query : value}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
              e.target.blur();
            }
            if (e.key === "Enter" && visibleOptions.length === 1) {
              select(visibleOptions[0]);
            }
          }}
        />

        {value && (
          <button
            type="button"
            className="searchable-select-clear"
            onClick={clear}
            aria-label="Clear filter"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul className="searchable-select-options">
          {visibleOptions.length === 0 ? (
            <li className="searchable-select-empty">No matches</li>
          ) : (
            visibleOptions.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  className={
                    option === value
                      ? "searchable-select-option selected"
                      : "searchable-select-option"
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(option)}
                >
                  {option}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;

'use client';

/**
 * Platform picker for listings (sets the icon, e.g. Google Voice). Pick one from the list or type a new one.
 * Customers browse by Category, chosen separately (Admin → Categories).
 */
export default function CategoryInput({ id, categories, defaultValue }: { id: string; categories: string[]; defaultValue?: string }) {
  const listId = `${id}-options`;
  return (
    <div>
      <label htmlFor={id} className="label">Platform</label>
      <input
        id={id}
        name="platform"
        list={listId}
        required
        maxLength={40}
        autoComplete="off"
        defaultValue={defaultValue}
        placeholder="e.g. Google Voice"
        className="input"
      />
      <datalist id={listId}>
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
      <p className="mt-1.5 text-[13px] text-muted">Pick one or type a new name.</p>
    </div>
  );
}

'use client';

/**
 * Category picker for listings. Pick an existing category from the list,
 * or type a new name (e.g. "Germany Facebook") to create a new category.
 * New categories show up as filters in the marketplace automatically.
 */
export default function CategoryInput({ id, categories, defaultValue }: { id: string; categories: string[]; defaultValue?: string }) {
  const listId = `${id}-options`;
  return (
    <div>
      <label htmlFor={id} className="label">Category</label>
      <input
        id={id}
        name="platform"
        list={listId}
        required
        maxLength={40}
        autoComplete="off"
        defaultValue={defaultValue}
        placeholder="Pick one or type a new category"
        className="input"
      />
      <datalist id={listId}>
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
      <p className="mt-1.5 text-[13px] text-muted">Type a new name to create a new category.</p>
    </div>
  );
}

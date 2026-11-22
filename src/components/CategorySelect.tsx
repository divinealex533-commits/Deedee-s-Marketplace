/** Dropdown of the categories made in Admin → Categories. Sends "categoryId" (empty = none). */
export default function CategorySelect({ id, categories, value }: { id: string; categories: { id: string; name: string; emoji: string }[]; value?: string | null }) {
  return (
    <div>
      <label htmlFor={id} className="label">Category</label>
      <select id={id} name="categoryId" defaultValue={value ?? ''} className="input">
        <option value="">No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.name}</option>
        ))}
      </select>
    </div>
  );
}

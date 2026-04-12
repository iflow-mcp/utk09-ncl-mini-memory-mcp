import { MemoryForm } from "./components/MemoryFOrm";
import { MemoryList } from "./components/MemoryList";
import { SearchBar } from "./components/SearchBar";
import { useMemories } from "./hooks/useMemories";

const App = () => {
    const {
    displayMemories,
    loading,
    search,
    setSearch,
    activeTags,
    setActiveTags,
    formOpen,
    editingMemory,
    isFiltered,
    countLabel,
    handleTagClick,
    openCreateForm,
    openEditForm,
    closeForm,
    handleSave,
    handleDelete,
    } = useMemories();

   return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">🧠</span>
          <h1 className="header-title">Mini Memory MCP</h1>
          <span className="header-count">{countLabel}</span>
        </div>
        <button className="btn btn--primary" onClick={openCreateForm}>
          + New Memory
        </button>
      </header>

      <main className="app-main">
        <SearchBar value={search} onChange={setSearch} />

        {activeTags.length > 0 && (
          <div className="tag-filters">
            <span className="tag-filters-label">Tag filters:</span>
            {activeTags.map((tag) => (
              <button key={tag} className="tag-filter-pill" onClick={() => handleTagClick(tag)}>
                {tag} <span className="tag-filter-remove">✕</span>
              </button>
            ))}
            <button className="tag-filters-clear" onClick={() => setActiveTags([])}>
              Clear all
            </button>
          </div>
        )}

        <MemoryList
          memories={displayMemories}
          loading={loading}
          isFiltered={isFiltered}
          activeTags={activeTags}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onTagClick={handleTagClick}
        />
      </main>

      {formOpen && (
        <MemoryForm memory={editingMemory} onSave={handleSave} onClose={closeForm} />
      )}
    </div>
  );
}

export default App
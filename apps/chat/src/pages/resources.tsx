import { useState, useMemo } from "react";

type Resource = {
  id: string;
  name: string;
  type: string; // e.g. 'application/pdf'
  url: string;
  uploadedAt: string;
  tags: string[];
};

const mockResources: Resource[] = [
  {
    id: "1",
    name: "Project Proposal.pdf",
    type: "application/pdf",
    url: "/uploads/Project-Proposal.pdf",
    uploadedAt: "2025-08-10T14:30:00Z",
    tags: ["pdf", "project"],
  },
  {
    id: "2",
    name: "Design Mockup.png",
    type: "image/png",
    url: "/uploads/Design-Mockup.png",
    uploadedAt: "2025-08-11T09:15:00Z",
    tags: ["image", "design"],
  },
  {
    id: "3",
    name: "Meeting Notes.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    url: "/uploads/Meeting-Notes.docx",
    uploadedAt: "2025-08-13T11:00:00Z",
    tags: ["doc", "meeting"],
  },
];

const Resources = () => {
  const [selected, setSelected] = useState<Resource | null>(null);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  // Collect unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    mockResources.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, []);

  // Apply search, tag filter, and sorting
  const filteredResources = useMemo(() => {
    let items = [...mockResources];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((r) => r.name.toLowerCase().includes(q));
    }

    // Tags
    if (activeTags.length > 0) {
      items = items.filter((r) => activeTags.every((t) => r.tags.includes(t)));
    }

    // Sort
    if (sortBy === "date") {
      items.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [search, activeTags, sortBy]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-900">
      <h1 className="text-xl font-semibold mb-4">Resources</h1>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 text-sm w-64"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border border-slate-300 rounded px-3 py-2 text-sm"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </select>

        <div className="flex gap-2 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded-full text-xs border ${
                activeTags.includes(tag)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
          <h2 className="text-sm font-medium mb-2">
            Files ({filteredResources.length})
          </h2>
          <ul className="space-y-2">
            {filteredResources.map((r) => (
              <li
                key={r.id}
                onClick={() => setSelected(r)}
                className={`p-2 rounded cursor-pointer hover:bg-slate-100 ${
                  selected?.id === r.id ? "bg-slate-200" : ""
                }`}
              >
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs text-slate-500">
                  {new Date(r.uploadedAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col">
          {!selected && (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a resource to preview
            </div>
          )}
          {selected && (
            <>
              <div className="mb-3 border-b pb-2">
                <h2 className="text-lg font-medium">{selected.name}</h2>
                <p className="text-xs text-slate-500">
                  Uploaded {new Date(selected.uploadedAt).toLocaleString()}
                </p>
                <div className="flex gap-1 mt-1">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-xs bg-slate-100 border border-slate-300 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {selected.type === "application/pdf" ? (
                  <iframe
                    src={selected.url}
                    className="w-full h-[70vh]"
                    title={selected.name}
                  />
                ) : selected.type.startsWith("image/") ? (
                  <img
                    src={selected.url}
                    alt={selected.name}
                    className="max-w-full max-h-[70vh] mx-auto"
                  />
                ) : (
                  <div className="text-sm text-slate-600">
                    Preview not available.{" "}
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Download file
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resources;

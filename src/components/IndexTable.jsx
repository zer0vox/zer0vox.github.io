export default function IndexTable() {
  const entries = [
    {
      title: 'DNA Brand Identity',
      type: 'Branding',
      year: 2023,
      status: 'Featured'
    },
    {
      title: 'Linear Design System',
      type: 'Design System',
      year: 2023,
      status: 'Active'
    },
    {
      title: 'Future Archive',
      type: 'Website',
      year: 2023,
      status: 'Featured'
    },
    {
      title: 'Project Echo',
      type: 'App Design',
      year: 2023,
      status: 'Active'
    },
    {
      title: 'Studio Atlas',
      type: 'Editorial',
      year: 2023,
      status: 'Active'
    },
    {
      title: 'Minimal Framework',
      type: 'Design System',
      year: 2022,
      status: 'Archive'
    },
    {
      title: 'Semantic Web',
      type: 'Branding',
      year: 2022,
      status: 'Archive'
    },
    {
      title: 'Horizon Identity',
      type: 'Website',
      year: 2022,
      status: 'Archive'
    }
  ]

  return (
    <section className="bg-black px-6 py-[clamp(120px,16vw,240px)] sm:px-8" id="index">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[clamp(32px,5vw,64px)] font-normal mb-[clamp(60px,8vw,100px)]">
          Index
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-0 text-white/50 text-sm font-normal">Title</th>
                <th className="text-left py-4 px-4 text-white/50 text-sm font-normal hidden sm:table-cell">Type</th>
                <th className="text-left py-4 px-4 text-white/50 text-sm font-normal hidden md:table-cell">Year</th>
                <th className="text-left py-4 px-4 text-white/50 text-sm font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors duration-200">
                  <td className="py-4 px-0 text-white font-normal">{entry.title}</td>
                  <td className="py-4 px-4 text-white/60 text-sm hidden sm:table-cell">{entry.type}</td>
                  <td className="py-4 px-4 text-white/60 text-sm hidden md:table-cell">{entry.year}</td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-normal ${
                      entry.status === 'Featured' ? 'bg-emerald-500/20 text-emerald-300' :
                      entry.status === 'Active' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-white/5 text-white/50'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default function WorkGrid() {
  const projects = [
    {
      id: 1,
      title: 'DNA Brand Identity',
      year: '2023',
      category: 'Branding',
      description: 'Comprehensive brand system',
      color: '#6dd9a8'
    },
    {
      id: 2,
      title: 'Linear Design System',
      year: '2023',
      category: 'Design System',
      description: 'Scalable UI components',
      color: '#FFD700'
    },
    {
      id: 3,
      title: 'Future Archive',
      year: '2023',
      category: 'Website',
      description: 'Interactive digital experience',
      color: '#FF6B5B'
    },
    {
      id: 4,
      title: 'Project Echo',
      year: '2023',
      category: 'App Design',
      description: 'Mobile application design',
      color: '#4B7BE5'
    },
    {
      id: 5,
      title: 'Studio Atlas',
      year: '2023',
      category: 'Editorial',
      description: 'Publication design',
      color: '#E74C5C'
    },
    {
      id: 6,
      title: 'Minimal Framework',
      year: '2022',
      category: 'Design System',
      description: 'Component library',
      color: '#9B59B6'
    }
  ]

  return (
    <section className="bg-black px-6 py-[clamp(120px,16vw,240px)] sm:px-8" id="work">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[clamp(32px,5vw,64px)] font-normal mb-[clamp(60px,8vw,100px)]">
          Work
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(40px,6vw,80px)]">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`#project-${project.id}`}
              className="group cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="mb-6 aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
                <div
                  className="w-full h-full flex items-center justify-center text-white/40 group-hover:text-white/60 transition-colors duration-300"
                  style={{ backgroundColor: project.color + '22' }}
                >
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-normal mb-2 group-hover:text-white/85 transition-opacity duration-300">
                    {project.title}
                  </h3>
                  <p className="text-sm text-white/50 group-hover:text-white/70 transition-opacity duration-300">
                    {project.category}
                  </p>
                </div>
                <span className="text-sm text-white/50 group-hover:text-white/70 transition-opacity duration-300 whitespace-nowrap">
                  {project.year}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

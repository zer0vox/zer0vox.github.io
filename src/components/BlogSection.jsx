import { motion } from 'framer-motion'

const blogPosts = [
  {
    title: 'AI and the Future of Visual Storytelling',
    date: 'Sep 4, 2026',
    excerpt: 'Exploring how artificial intelligence is reshaping the landscape of visual communication and design.'
  },
  {
    title: 'Designing for Digital Culture: How Aesthetics Shape Interaction',
    date: 'Oct 8, 2026',
    excerpt: 'An examination of how contemporary design principles influence user experience in digital environments.'
  },
  {
    title: 'Generative Art and Its Impact on Contemporary Design',
    date: 'Nov 10, 2026',
    excerpt: 'How generative systems and algorithmic processes are redefining what it means to create in the digital age.'
  }
]

export default function BlogSection() {
  return (
    <section id="blog" className="blog-sect wrap">
      <div className="blog-head">
        <h2>Blog</h2>
        <p className="blog-sub">
          We share perspectives on design, technology and culture, exploring ideas that inspire practice and spark conversation.
        </p>
      </div>
      <div className="blog-grid">
        {blogPosts.map((post, index) => (
          <motion.article
            key={index}
            className="blog-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: index * 0.1, duration: 0.65, ease: 'easeOut' }}
          >
            <a href="#" className="blog-card-inner">
              <div className="blog-thumb" />
              <div className="blog-meta">
                <span className="blog-date">{post.date}</span>
                <h3 className="blog-title">{post.title}</h3>
                <p className="blog-excerpt">{post.excerpt}</p>
                <span className="blog-read">Read more →</span>
              </div>
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

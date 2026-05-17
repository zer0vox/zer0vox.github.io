export default function Footer() {
  return (
    <footer className="bg-black px-6 py-12 sm:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 mb-12">
          {/* Studio info */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4">Studio</h3>
            <p className="text-white/85 leading-relaxed">
              greenhueblues® is an independent design studio based in Kathmandu, working globally with brands and cultural institutions.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4">Links</h3>
            <ul className="space-y-2">
              <li><a href="#work" className="text-white/85 hover:text-white transition-opacity duration-300">Work</a></li>
              <li><a href="#about" className="text-white/85 hover:text-white transition-opacity duration-300">About</a></li>
              <li><a href="#contact" className="text-white/85 hover:text-white transition-opacity duration-300">Contact</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4">Social</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/85 hover:text-white transition-opacity duration-300">Instagram</a></li>
              <li><a href="#" className="text-white/85 hover:text-white transition-opacity duration-300">Twitter</a></li>
              <li><a href="#" className="text-white/85 hover:text-white transition-opacity duration-300">Dribbble</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4">Get In Touch</h3>
            <a href="mailto:hello@greenhueblues.com" className="text-white/85 hover:text-white transition-opacity duration-300 break-words">
              hello@greenhueblues.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-white/50">© 2024 greenhueblues®. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/50">
            <a href="#" className="hover:text-white transition-opacity duration-300">Privacy</a>
            <a href="#" className="hover:text-white transition-opacity duration-300">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
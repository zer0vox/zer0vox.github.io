export default function CTASection() {
  return (
    <section className="bg-black px-6 py-[clamp(120px,16vw,240px)] sm:px-8" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(40px,6vw,80px)]">
          {/* Left side - Heading */}
          <div>
            <h2 className="text-[clamp(40px,6vw,80px)] font-normal leading-[1.05] mb-8">
              Let's work together.
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              We're always interested in hearing about new projects and opportunities.
            </p>
          </div>

          {/* Right side - Contact info */}
          <div className="flex flex-col justify-end space-y-8">
            {/* Email */}
            <div>
              <p className="text-sm text-white/50 uppercase tracking-wider mb-2">Email</p>
              <a 
                href="mailto:hello@greenhueblues.com"
                className="text-lg text-white hover:text-white/70 transition-opacity duration-300 break-words"
              >
                hello@greenhueblues.com
              </a>
            </div>

            {/* Social links */}
            <div>
              <p className="text-sm text-white/50 uppercase tracking-wider mb-4">Socials</p>
              <ul className="flex flex-col space-y-2">
                <li>
                  <a 
                    href="#" 
                    className="text-white hover:text-white/70 transition-opacity duration-300 text-lg"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="text-white hover:text-white/70 transition-opacity duration-300 text-lg"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="text-white hover:text-white/70 transition-opacity duration-300 text-lg"
                  >
                    Dribbble
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
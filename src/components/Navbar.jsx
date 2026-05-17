export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-black/30 backdrop-blur-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <a href="#top" className="text-xl font-bold tracking-tight text-white">
          greenhueblues<sup className="text-xs ml-1 align-super opacity-85">®</sup>
        </a>

        <ul className="hidden md:flex items-center justify-center gap-8 text-white">
          <li><a href="#work" className="text-lg font-normal hover:opacity-70 transition">Work</a></li>
          <li><a href="#index" className="text-lg font-normal hover:opacity-70 transition">Index</a></li>
          <li><a href="#about" className="text-lg font-normal hover:opacity-70 transition">About</a></li>
          <li><a href="#playground" className="text-lg font-normal hover:opacity-70 transition">Playground</a></li>
        </ul>

        <a href="#contact" className="text-lg font-normal text-white hover:opacity-70 transition">
          Contact
        </a>
      </div>
    </nav>
  )
}

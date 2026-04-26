export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full flex justify-between items-center p-6 text-sm z-10 glass-effect backdrop-blur-lg">
      <div className="font-semibold text-cyan-400">greenhueblues</div>
      <div className="space-x-8 text-gray-300">
        <a href="#" className="hover:text-cyan-400 transition-colors duration-300">Work</a>
        <a href="#" className="hover:text-cyan-400 transition-colors duration-300">About</a>
        <a href="#" className="hover:text-cyan-400 transition-colors duration-300">Contact</a>
      </div>
    </nav>
  )
}

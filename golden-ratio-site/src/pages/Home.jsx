import FibonacciBackground from '../components/FibonacciBackground.jsx'
import Hero from '../components/Hero.jsx'
import Navbar from '../components/Navbar.jsx'
import ScrollSection from '../components/ScrollSection.jsx'

export default function Home() {
  return (
    <div className="relative">
      <FibonacciBackground />
      <Navbar />
      <Hero />
      <ScrollSection />
    </div>
  )
}
export default function BackgroundPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-[52%] bg-[radial-gradient(circle_at_left,rgba(59,130,246,0.18),transparent_25%)] blur-3xl" />
      <div className="absolute right-0 top-0 h-full w-[52%] bg-[radial-gradient(circle_at_right,rgba(59,130,246,0.14),transparent_25%)] blur-3xl" />
      <div className="absolute inset-y-0 left-1/2 right-1/2 mx-auto h-[56rem] w-[78%] rounded-[3rem] border border-white/10 bg-[#10152a]/80 shadow-[0_0_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl" />
      <div className="absolute inset-x-0 top-[12%] h-[2px] bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent)] opacity-70" />
      <div className="absolute inset-x-0 top-[28%] h-[2px] bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent)] opacity-50" />
      <div className="absolute inset-x-0 top-[44%] h-[2px] bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent)] opacity-40" />
    </div>
  )
}

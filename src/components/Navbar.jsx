import { Aperture, Menu, Orbit } from 'lucide-react'

const links = ['星图', '时间轴', '回声']

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 pt-4 sm:px-8 sm:pt-6">
      <nav className="glass-nav mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6" aria-label="主导航">
        <a href="#" className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ion" aria-label="记忆星云首页">
          <span className="grid h-9 w-9 place-items-center border border-ion/25 bg-ion/[0.06] text-ion transition group-hover:border-ion/50">
            <Orbit className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </span>
          <span className="font-display text-[15px] text-white sm:text-base">记忆星云</span>
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.18em] text-mist/25 xl:inline">Memory Nebula</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link, index) => (
            <a
              key={link}
              href={`#${link}`}
              className={`relative px-5 py-3 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ion ${
                index === 0 ? 'text-white' : 'text-mist/45 hover:text-mist/80'
              }`}
            >
              {link}
              {index === 0 && <span className="absolute inset-x-5 -bottom-[10px] h-px bg-ion" />}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden h-9 items-center gap-2 border border-white/10 bg-white/[0.035] px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-mist/55 transition hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ion sm:flex">
            <Aperture className="h-3.5 w-3.5 text-ember" />
            捕捉记忆
          </button>
          <button className="grid h-9 w-9 place-items-center text-mist/70 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ion md:hidden" aria-label="打开菜单">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </header>
  )
}

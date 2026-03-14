import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UtensilsCrossed, MapPin, Phone, Clock, Star, ChevronDown,
  Flame, Leaf, Heart, Award, Instagram, MessageCircle, ArrowRight
} from 'lucide-react'

// ── Cores extraídas da logo ───────────────────────────────────────────────────
// Vermelho principal: #C8221A  |  Marrom escuro: #3D1A0E  |  Creme: #FDF6EC

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const DIFERENCIAIS = [
  { icon: Flame,  titulo: 'Cozido no fogão a lenha',   texto: 'Cada prato é preparado no fogo de lenha, preservando o sabor e o aroma que só a tradição mineira tem.' },
  { icon: Leaf,   titulo: 'Ingredientes frescos',       texto: 'Verduras, legumes e carnes selecionados diariamente. Comida de verdade, sem conservantes.' },
  { icon: Heart,  titulo: 'Feito com amor',              texto: 'A Leninha e sua equipe colocam carinho em cada detalhe, do tempero à apresentação.' },
  { icon: Award,  titulo: 'Tradição que alimenta',      texto: 'Anos de história servindo o povo da cidade com almoço caseiro de qualidade.' },
]

const AVALIACOES = [
  { nome: 'Maria Clara',  nota: 5, texto: 'Melhor marmitex da cidade! O feijão tropeiro da Leninha é simplesmente incrível.' },
  { nome: 'João Paulo',   nota: 5, texto: 'Comida gostosa, caprichada e preço justo. Entrega sempre no horário.' },
  { nome: 'Ana Beatriz',  nota: 5, texto: 'Todo dia de semana peço aqui. Não consigo comer em outro lugar depois que experimentei.' },
  { nome: 'Roberto S.',   nota: 5, texto: 'A panela de barro no fogão a lenha faz toda a diferença. Sabor de casa da vovó.' },
]

const HORARIOS = [
  { dia: 'Segunda a Sexta', hora: '10h30 – 14h30' },
  { dia: 'Sábado',          hora: '10h30 – 14h00' },
  { dia: 'Domingo',         hora: 'Fechado' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuAberto(false)
  }

  return (
    <div className="font-sans" style={{ background: '#FDF6EC', color: '#3D1A0E' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 shadow-md" style={{ background: '#3D1A0E' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo-horizontal.png" alt="Fogão a Lenha da Leninha" className="h-10 object-contain" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-amber-100">
            {[['início','hero'],['sobre','sobre'],['cardápio','cardapio'],['avaliações','avaliacoes'],['contato','contato']].map(([l,id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="hover:text-red-400 transition-colors uppercase tracking-wider text-xs">
                {l}
              </button>
            ))}
            <button onClick={() => navigate('/pedidos')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{ background: '#C8221A', color: '#fff' }}>
              Área Interna
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuAberto(v => !v)} className="md:hidden text-amber-100 p-2">
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-current transition-all ${menuAberto ? 'rotate-45 translate-y-2' : ''}`}/>
              <span className={`block w-6 h-0.5 bg-current transition-all ${menuAberto ? 'opacity-0' : ''}`}/>
              <span className={`block w-6 h-0.5 bg-current transition-all ${menuAberto ? '-rotate-45 -translate-y-2' : ''}`}/>
            </div>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuAberto && (
          <div className="md:hidden border-t border-amber-900 px-6 py-4 space-y-3" style={{ background: '#3D1A0E' }}>
            {[['Início','hero'],['Sobre','sobre'],['Cardápio','cardapio'],['Avaliações','avaliacoes'],['Contato','contato']].map(([l,id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="block text-amber-100 hover:text-red-400 text-sm font-semibold uppercase tracking-wider">
                {l}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3D1A0E 0%, #5C2310 40%, #C8221A 100%)' }}>

        {/* Textura sutil */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Gradiente inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to bottom, transparent, #FDF6EC)' }} />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <img src="/logo-vertical.png" alt="Fogão a Lenha da Leninha"
              className="w-64 md:w-80 object-contain drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))' }} />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            Comida de verdade,<br />
            <span style={{ color: '#FFBB44' }}>feita com lenha</span>
          </h1>
          <p className="text-amber-100 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Marmitex caseira com tempero mineiro, cozida no fogão a lenha todos os dias.
            Porque comida boa tem cheiro, tem história e tem amor.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/5532999999999?text=Olá! Gostaria de fazer um pedido 🍽️"
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-transform hover:scale-105"
              style={{ background: '#25D366' }}>
              <MessageCircle size={22} /> Pedir pelo WhatsApp
            </a>
            <button onClick={() => scrollTo('cardapio')}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-transform hover:scale-105 border-2 border-white text-white hover:bg-white"
              style={{ color: 'white' }}
              onMouseOver={e => { e.currentTarget.style.color = '#C8221A' }}
              onMouseOut={e => { e.currentTarget.style.color = 'white' }}>
              Ver Cardápio <ArrowRight size={20} />
            </button>
          </div>

          <button onClick={() => scrollTo('sobre')}
            className="mt-16 text-amber-200 opacity-60 hover:opacity-100 transition-opacity animate-bounce block mx-auto">
            <ChevronDown size={32} />
          </button>
        </div>
      </section>

      {/* ── SOBRE ───────────────────────────────────────────────────────────── */}
      <section id="sobre" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full rounded-2xl border-4 opacity-20"
                style={{ borderColor: '#C8221A' }} />
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-gradient-to-br flex items-center justify-center shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #5C2310, #C8221A)' }}>
                <img src="/logo-vertical.png" alt="Logo" className="w-3/4 object-contain p-8 drop-shadow-2xl" />
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#C8221A' }}>
                Nossa História
              </span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6" style={{ color: '#3D1A0E' }}>
                Do fogão a lenha<br />para a sua mesa
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ color: '#5C2310', opacity: 0.85 }}>
                A Leninha aprendeu a cozinhar com a avó, no fogão a lenha de casa.
                O cheiro da panela de ferro, o tempero na hora certa, o feijão que cozinha devagar —
                tudo isso ela trouxe para o restaurante com um único objetivo: fazer você sentir o gosto de casa.
              </p>
              <p className="text-lg leading-relaxed mb-8" style={{ color: '#5C2310', opacity: 0.85 }}>
                Cada dia tem um cardápio especial, com duas opções de marmitex, carnes selecionadas
                e acompanhamentos frescos. Porque comida boa não se apressa — ela se cuida.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[['500+','Marmitex/mês'],['100%','Lenha natural'],['Diário','Cardápio fresco']].map(([num,label]) => (
                  <div key={label} className="text-center p-4 rounded-xl" style={{ background: '#FBE8D0' }}>
                    <p className="text-2xl font-black mb-1" style={{ color: '#C8221A' }}>{num}</p>
                    <p className="text-xs font-semibold opacity-70">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── DIFERENCIAIS ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#3D1A0E' }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FFBB44' }}>
                Por que a Leninha?
              </span>
              <h2 className="text-4xl font-black text-white">
                Mais do que comida —<br/>é experiência
              </h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIFERENCIAIS.map(({ icon: Icon, titulo, texto }, i) => (
              <FadeIn key={titulo} delay={i * 0.1}>
                <div className="p-6 rounded-2xl h-full transition-transform hover:-translate-y-1"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: '#C8221A' }}>
                    <Icon size={22} color="#fff" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{titulo}</h3>
                  <p className="text-amber-200 text-sm leading-relaxed opacity-80">{texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARDÁPIO ────────────────────────────────────────────────────────── */}
      <section id="cardapio" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#C8221A' }}>
                O que tem hoje?
              </span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight" style={{ color: '#3D1A0E' }}>
                Cardápio do Dia
              </h2>
              <p className="mt-4 text-lg opacity-70">Sempre fresco. Sempre gostoso. Sempre diferente.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              { opcao: 'Opção 1', cor: '#C8221A', itens: ['Arroz', 'Feijão tropeiro', 'Farofa', 'Couve refogada', 'Salada'] },
              { opcao: 'Opção 2', cor: '#5C2310', itens: ['Arroz', 'Feijão carioca', 'Macarrão', 'Batata frita', 'Salada'] },
            ].map(({ opcao, cor, itens }) => (
              <FadeIn key={opcao} delay={0.1}>
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-6 py-4 text-white font-black text-xl" style={{ background: cor }}>
                    {opcao}
                  </div>
                  <div className="p-6 bg-white">
                    <ul className="space-y-2">
                      {itens.map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#3D1A0E' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cor }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="rounded-2xl p-6 bg-white shadow-lg">
              <h3 className="font-black text-lg mb-4" style={{ color: '#3D1A0E' }}>Proteínas do dia</h3>
              <div className="flex flex-wrap gap-3 mb-6">
                {['Frango assado', 'Carne moída', 'Bife acebolado'].map(c => (
                  <span key={c} className="px-4 py-2 rounded-full text-sm font-bold text-white"
                    style={{ background: '#C8221A' }}>{c}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: '#F0E0C8' }}>
                <div className="text-center p-3 rounded-xl" style={{ background: '#FBE8D0' }}>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-60 mb-1">Marmitex P</p>
                  <p className="text-2xl font-black" style={{ color: '#C8221A' }}>R$ 17,00</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: '#FBE8D0' }}>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-60 mb-1">Marmitex G</p>
                  <p className="text-2xl font-black" style={{ color: '#C8221A' }}>R$ 20,00</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="text-center mt-8 text-sm opacity-60 italic">
              * Cardápio ilustrativo. O cardápio real do dia é atualizado diariamente.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── AVALIAÇÕES ──────────────────────────────────────────────────────── */}
      <section id="avaliacoes" className="py-24 px-6" style={{ background: '#FBE8D0' }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#C8221A' }}>
                O que dizem nossos clientes
              </span>
              <h2 className="text-4xl font-black" style={{ color: '#3D1A0E' }}>
                Quem prova, volta
              </h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AVALIACOES.map(({ nome, nota, texto }, i) => (
              <FadeIn key={nome} delay={i * 0.1}>
                <div className="bg-white p-6 rounded-2xl shadow-sm h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: nota }).map((_, j) => (
                      <Star key={j} size={16} fill="#FFBB44" color="#FFBB44" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-4 italic opacity-80" style={{ color: '#3D1A0E' }}>
                    "{texto}"
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#C8221A' }}>— {nome}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO PEDIR ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#C8221A' }}>
                Simples assim
              </span>
              <h2 className="text-4xl font-black" style={{ color: '#3D1A0E' }}>
                Como fazer seu pedido
              </h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', titulo: 'Escolha sua marmitex', texto: 'Opção 1 ou 2, tamanho P ou G, e a proteína do dia que você preferir.' },
              { num: '02', titulo: 'Fale no WhatsApp', texto: 'Mande uma mensagem para a Leninha com seu pedido, endereço e forma de pagamento.' },
              { num: '03', titulo: 'Receba em casa', texto: 'Sua marmitex fresquinha chega até você com entrega rápida na região.' },
            ].map(({ num, titulo, texto }, i) => (
              <FadeIn key={num} delay={i * 0.15}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-xl shadow-lg"
                    style={{ background: '#C8221A' }}>
                    {num}
                  </div>
                  <h3 className="font-black text-xl mb-2" style={{ color: '#3D1A0E' }}>{titulo}</h3>
                  <p className="text-sm leading-relaxed opacity-70">{texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA PRINCIPAL ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(135deg, #C8221A, #8B1510)' }}>
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <img src="/logo-horizontal.png" alt="Logo" className="h-16 object-contain mx-auto mb-8 opacity-90" />
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Tá com fome?<br />A Leninha resolve!
            </h2>
            <p className="text-red-100 text-xl mb-10">
              Peça agora pelo WhatsApp e receba sua marmitex quentinha em casa.
            </p>
            <a href="https://wa.me/5532999999999?text=Olá Leninha! Quero fazer um pedido 🍽️"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-black text-xl shadow-2xl transition-transform hover:scale-105"
              style={{ background: '#25D366' }}>
              <MessageCircle size={28} /> Pedir agora no WhatsApp
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ── CONTATO / HORÁRIOS ──────────────────────────────────────────────── */}
      <section id="contato" className="py-24 px-6" style={{ background: '#3D1A0E' }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          <FadeIn>
            <div>
              <img src="/logo-vertical.png" alt="Logo" className="w-36 mb-6 opacity-90" />
              <p className="text-amber-200 text-sm leading-relaxed opacity-80 mb-6">
                Comida caseira feita com lenha, amor e tradição mineira. Atendemos na região com entrega rápida.
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com/fogaodaleninha" target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ background: '#C8221A' }}>
                  <Instagram size={18} color="#fff" />
                </a>
                <a href="https://wa.me/5532999999999" target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ background: '#25D366' }}>
                  <MessageCircle size={18} color="#fff" />
                </a>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div>
              <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                <Clock size={18} style={{ color: '#FFBB44' }} /> Horário de Funcionamento
              </h3>
              <div className="space-y-3">
                {HORARIOS.map(({ dia, hora }) => (
                  <div key={dia} className="flex justify-between items-center py-2 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-amber-200 text-sm">{dia}</span>
                    <span className={`text-sm font-bold ${hora === 'Fechado' ? 'text-red-400' : 'text-white'}`}>
                      {hora}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div>
              <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                <MapPin size={18} style={{ color: '#FFBB44' }} /> Contato
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#C8221A' }} />
                  <div>
                    <p className="text-white text-sm font-bold">WhatsApp</p>
                    <a href="https://wa.me/5532999999999" className="text-amber-200 text-sm hover:text-white transition-colors">
                      (32) 9 9999-9999
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#C8221A' }} />
                  <div>
                    <p className="text-white text-sm font-bold">Atendemos na região</p>
                    <p className="text-amber-200 text-sm opacity-80">Entrega a domicílio</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UtensilsCrossed size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#C8221A' }} />
                  <div>
                    <p className="text-white text-sm font-bold">Pedidos pelo WhatsApp</p>
                    <p className="text-amber-200 text-sm opacity-80">Atendimento das 9h às 13h</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="py-6 px-6 text-center text-xs" style={{ background: '#1A0A05', color: 'rgba(255,255,255,0.4)' }}>
        © {new Date().getFullYear()} Fogão a Lenha da Leninha — Todos os direitos reservados
      </footer>

    </div>
  )
}

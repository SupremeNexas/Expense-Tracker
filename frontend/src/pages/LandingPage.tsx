import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Play, CheckCircle2, ChevronDown,
  Wallet, PieChart, Sparkles, TrendingUp, CreditCard,
  ScanLine, HelpCircle, Receipt, PiggyBank, Target, RefreshCcw, FileSpreadsheet
} from 'lucide-react';
import BorderGlow from '../components/UI/BorderGlow';
import SpotlightCard from '../components/UI/SpotlightCard';
import GlassSurface from '../components/UI/GlassSurface';
import CircularGallery from '../components/UI/CircularGallery';


const DEMO_PANEL_GLOW_COLORS = ['#0f766e', '#22d3ee', '#34d399'];

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  delay: number;
}

function FeatureCard({ title, description, icon: Icon, gradient, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      className="relative w-full h-[220px]"
    >
      <SpotlightCard className="h-full rounded-[30px] p-0 overflow-hidden border-2 border-emerald-500 shadow-xl transition-all duration-500 group-hover:scale-[1.02]" spotlightColor="rgba(255, 255, 255, 0.15)">
        {/* Intense colored aura right behind the glass */}
        <div
          className="absolute inset-0 opacity-50 rounded-[30px] pointer-events-none transition-all duration-700 group-hover:opacity-95"
          style={{
            background: gradient,
            filter: "blur(35px)",
            transform: "scale(0.95)"
          }}
        />

        {/* The Apple Liquid Glass Slab */}
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={30}
          backgroundOpacity={0.72}
          saturation={1.8}
          blur={22}
          opacity={0.9}
          brightness={30}
          borderWidth={0}
          className="relative w-full h-full"
          style={{ minHeight: '220px' }}
        >
          <div className="relative h-full flex flex-col justify-between p-6 w-full">
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-[30px]" />
            {/* Apple floating glass button/icon container */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 8px 16px rgba(0,0,0,0.1)'
              }}
            >
              <Icon size={20} className="text-white drop-shadow-md" />
            </div>

            {/* Text bottom alignment matches image precisely */}
            <div className="mt-auto z-10">
              <h3 className="text-white font-bold text-lg mb-1 tracking-tight drop-shadow-md">{title}</h3>
              <p className="text-gray-200/90 text-xs leading-relaxed font-semibold drop-shadow-sm line-clamp-3">{description}</p>
            </div>
          </div>
        </GlassSurface>
      </SpotlightCard>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const expenseFeatures = [
    {
      title: 'Add Transaction',
      description: 'Quickly record income or expenses with categories, payment methods, receipts, notes, recurring entries, and smart tagging.',
      icon: Receipt,
      gradient: 'linear-gradient(137deg, #22C55E 0%, #86EFAC 45%, #BBF7D0 100%)',
      delay: 0.1
    },
    {
      title: 'Wallets & Accounts',
      description: 'Manage cash, bank accounts, UPI wallets, and credit cards in one place while tracking balances across every source.',
      icon: Wallet,
      gradient: 'linear-gradient(137deg, #3B82F6 0%, #93C5FD 45%, #BFDBFE 100%)',
      delay: 0.2
    },
    {
      title: 'Smart Analytics',
      description: 'Visualize spending habits with interactive charts, monthly trends, category breakdowns, and AI-powered financial insights.',
      icon: PieChart,
      gradient: 'linear-gradient(137deg, #8B5CF6 0%, #C4B5FD 45%, #DDD6FE 100%)',
      delay: 0.3
    },
    {
      title: 'Budget Planner',
      description: 'Set monthly budgets, monitor spending in real time, and receive alerts before exceeding your limits.',
      icon: PiggyBank,
      gradient: 'linear-gradient(137deg, #10B981 0%, #F59E0B 45%, #FBBF24 100%)',
      delay: 0.4
    },
    {
      title: 'Credit Cards',
      description: 'Track outstanding balances, billing cycles, payment due dates, interest charges, and available credit.',
      icon: CreditCard,
      gradient: 'linear-gradient(137deg, #F97316 0%, #FB923C 45%, #FFEDD5 100%)',
      delay: 0.5
    },
    {
      title: 'Savings Goals',
      description: 'Create financial goals for travel, gadgets, emergencies, or investments and monitor your progress over time.',
      icon: Target,
      gradient: 'linear-gradient(137deg, #2563EB 0%, #7C3AED 45%, #C084FC 100%)',
      delay: 0.6
    },
    {
      title: 'Subscriptions',
      description: 'Monitor recurring payments, identify unused subscriptions, and never miss upcoming renewal dates.',
      icon: RefreshCcw,
      gradient: 'linear-gradient(137deg, #EC4899 0%, #F472B6 45%, #FCE7F3 100%)',
      delay: 0.7
    },
    {
      title: 'AI Receipt Scanner',
      description: 'Upload receipts and automatically extract merchant details, amount, date, tax, and spending category using OCR.',
      icon: ScanLine,
      gradient: 'linear-gradient(137deg, #06B6D4 0%, #4F46E5 45%, #818CF8 100%)',
      delay: 0.8
    },
    {
      title: 'Reports & Export',
      description: 'Generate detailed daily, monthly, and yearly reports, then export your financial data to CSV, Excel, or PDF.',
      icon: FileSpreadsheet,
      gradient: 'linear-gradient(137deg, #10B981 0%, #14B8A6 45%, #A7F3D0 100%)',
      delay: 0.9
    }
  ];

  const pricingPlans = [
    {
      name: 'Free Starter',
      price: '0',
      desc: 'Essential personal tracking.',
      features: ['Up to 50 transactions / mo', '1 Wallet & 3 Categories', 'Basic spending list', 'CSV Export'],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro Professional',
      price: '499',
      desc: 'AI-powered financial optimization.',
      features: ['Unlimited transactions', 'Unlimited Wallets & Categories', 'AI Receipt Scanner (50 uploads/mo)', 'AI Coach & Chat Assistant', 'Budget progress circular rings', 'PDF & Excel Export'],
      cta: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Enterprise Custom',
      price: 'Custom',
      desc: 'Multi-user sharing & shared bills.',
      features: ['Co-operative Group splitting', 'Infinite shared expense sheets', 'Unlimited AI receipt uploads', 'Priority server SLA support', 'Dedicated financial advisors'],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const aiWorkflowSteps = [
    {
      step: '01',
      title: 'Receipt Upload',
      desc: 'Drag receipt PDF or image into interface.',
      glowColor: '158 90 68',
      colors: ['#34d399', '#22d3ee', '#a78bfa'],
    },
    {
      step: '02',
      title: 'OCR Extraction',
      desc: 'AI reads text, parses details & currency.',
      glowColor: '192 95 68',
      colors: ['#22d3ee', '#60a5fa', '#c084fc'],
    },
    {
      step: '03',
      title: 'Smart Categorization',
      desc: 'Automatically maps to correct spending tags.',
      glowColor: '268 92 74',
      colors: ['#c084fc', '#f472b6', '#38bdf8'],
    },
    {
      step: '04',
      title: 'Behavior Insight',
      desc: 'Financial coach computes impacts on budgets.',
      glowColor: '42 95 72',
      colors: ['#facc15', '#fb923c', '#34d399'],
    },
    {
      step: '05',
      title: 'Dashboard Update',
      desc: 'Wallets, goals, and metrics sync instantly.',
      glowColor: '164 92 62',
      colors: ['#10b981', '#38bdf8', '#f472b6'],
    },
  ];

  const faqs = [
    {
      q: 'How does the AI Receipt Scanner work?',
      a: 'Simply drag and drop an image or PDF of any receipt. Our system reads the receipt using OCR and passes the contents to a Gemini model which extracts key details like the merchant name, total, tax, items, and date, creating the expense record automatically.'
    },
    {
      q: 'Can I link multiple bank accounts and cards?',
      a: 'Yes! Expense Tracker supports multi-wallet sync. You can create different wallets for Cash, Bank Accounts, UPI accounts, and Credit Cards, allowing you to log transactions against specific payment channels.'
    },
    {
      q: 'Is my data secure?',
      a: 'Security is our core design standard. All data is transferred over SSL, passwords are cryptographically salted and hashed using bcrypt, and user-space PostgreSQL databases run isolated with strict JWT authorization headers.'
    },
    {
      q: 'Can I export my transaction data?',
      a: 'Absolutely. You can export all your financial reports and logs as CSV spreadsheets, Microsoft Excel sheets, or print clean PDF summaries directly from the Reports portal.'
    }
  ];

  return (
    <div className="min-h-screen relative selection:bg-emerald-500 selection:text-white font-body">
      {/* 1. Page-Wide Bright Moving Motion Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover scale-105"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
            type="video/mp4"
          />
        </video>
        {/* Very light, bright translucent layer to maximize background visibility while ensuring crisp contrast */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/15 backdrop-brightness-110" />
      </div>

      {/* 2. Page Content Layers */}
      <div className="relative z-10 w-full flex flex-col min-h-screen">
        {/* Floating Liquid Glass Topbar */}
        <header className="sticky top-6 z-50 w-full px-6 flex justify-center">
          <SpotlightCard
            className="w-full max-w-5xl rounded-[32px] p-0 overflow-hidden shadow-xl"
            spotlightColor="rgba(255, 255, 255, 0.15)"
          >
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={32}
              backgroundOpacity={0.62}
              saturation={2}
              blur={32}
              opacity={0.85}
              brightness={24}
              displace={0}
              borderWidth={0}
              className="w-full"
              style={{ minHeight: '64px' }}
            >
              <div className="flex items-center justify-between px-6 py-4 w-full">
                <div className="flex items-center gap-1 text-xl font-semibold tracking-tight">
                  <span className="text-emerald-500 font-serif text-2xl font-bold drop-shadow-md">antigravity.</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-[15px] text-white font-semibold drop-shadow-sm">
                  <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
                  <a href="#ai" className="hover:text-emerald-400 transition-colors">AI Module</a>
                  <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
                  <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
                </nav>

                <div>
                  <Link
                    to="/auth"
                    className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold text-gray-900 shadow-xl transition-transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #e2e2e2 100%)',
                      boxShadow: 'inset 0 -2px 5px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.15)'
                    }}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </GlassSurface>
          </SpotlightCard>
        </header>

        {/* Clean Hero Section */}
        <section className="w-full flex flex-col items-center justify-center text-center pt-28 md:pt-40 pb-24 md:pb-36 px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 backdrop-blur-md px-5 py-2 text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-300 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
            <span>Powered by Gemini AI Vision</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight text-foreground drop-shadow-md"
          >
            Take control of your <span className="font-display italic text-emerald-500">wealth</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base md:text-xl text-foreground/90 font-medium max-w-2xl leading-relaxed drop-shadow-sm"
          >
            Track spending, build budgets, analyze habits, and grow your savings with AI-powered financial insights designed for professionals.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex items-center gap-4"
          >
            <Link to="/auth" className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-bold text-background hover:opacity-90 transition-colors shadow-xl">
              Start Tracking Free <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <button className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-md shadow-md hover:bg-muted transition-colors group cursor-pointer">
              <Play className="h-4 w-4 fill-foreground text-foreground group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>
        </section>

        {/* Circular Gallery Showcase */}
        <section className="w-full h-[600px] relative overflow-hidden my-12 md:my-20">
          <CircularGallery
             items={[
               { image: "https://picsum.photos/seed/finance1/800/600", text: "Automated Receipts" },
               { image: "https://picsum.photos/seed/finance2/800/600", text: "Smart Budgeting" },
               { image: "https://picsum.photos/seed/finance3/800/600", text: "Deep Financial Insights" },
               { image: "https://picsum.photos/seed/finance4/800/600", text: "Asset Monitoring" }
             ]}
             bend={2}
             textColor="#ffffff"
             borderRadius={0.05}
             font="bold 30px Figtree"
          />
        </section>

        {/* Features Bento Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 md:py-32 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-md">Handcrafted tools for personal ledger auditing.</h2>
            <p className="text-foreground/80 font-medium text-base md:text-lg drop-shadow-sm">No bloat. Simply powerful, beautiful finance mechanics designed to move as fast as you do.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full max-w-7xl mx-auto px-4">
            {expenseFeatures.map((f, idx) => (
              <FeatureCard
                key={idx}
                title={f.title}
                description={f.description}
                icon={f.icon}
                gradient={f.gradient}
                delay={f.delay}
              />
            ))}
          </div>
        </section>

        {/* Demo Section (Analytics Preview) - Dark Liquid Glass Developer Dashboard */}
        <section id="demo" className="px-4 py-20 md:py-32">
          <BorderGlow
            className="mx-auto w-full max-w-7xl"
            edgeSensitivity={14}
            glowColor="164 92 62"
            backgroundColor="rgba(4, 12, 13, 0.62)"
            borderRadius={42}
            glowRadius={72}
            glowIntensity={1.65}
            coneSpread={38}
            colors={DEMO_PANEL_GLOW_COLORS}
            fillOpacity={0.72}
            alwaysVisible
          >
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={42}
              backgroundOpacity={0.72}
              saturation={1.9}
              blur={48}
              brightness={22}
              opacity={0.9}
              borderWidth={0.05}
              style={{ minHeight: '520px' }}
              className="min-h-[520px]"
            >
              <div className="relative w-full h-full px-6 py-12 md:px-12 md:py-16">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(255,255,255,0.30),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(34,211,238,0.22),transparent_32%),radial-gradient(circle_at_78%_88%,rgba(16,185,129,0.20),transparent_30%),linear-gradient(115deg,rgba(255,255,255,0.20),rgba(255,255,255,0.03)_36%,rgba(255,255,255,0.10)_58%,rgba(255,255,255,0.02))] opacity-90 rounded-[42px]" />
                <div className="pointer-events-none absolute inset-x-8 top-5 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent" />
                <div className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full border border-white/20 bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -right-28 bottom-10 h-72 w-72 rounded-full border border-emerald-300/20 bg-emerald-400/10 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 rounded-[42px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),inset_18px_18px_70px_rgba(255,255,255,0.07),inset_-22px_-18px_70px_rgba(0,0,0,0.28)]" />

                <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <GlassSurface
                    width="100%"
                    height="auto"
                    borderRadius={32}
                    backgroundOpacity={0.55}
                    saturation={1.75}
                    blur={30}
                    brightness={18}
                    opacity={0.88}
                    borderWidth={0.08}
                    className="min-h-[300px]"
                  >
                    <div className="relative w-full p-7 md:p-8">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.10),transparent_46%,rgba(255,255,255,0.06))] rounded-[32px]" />
                      <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_22px_rgba(0,0,0,0.45)] md:text-5xl">A dashboard that looks like developer tooling.</h2>
                        <p className="text-sm font-medium leading-relaxed text-white/78 drop-shadow-sm md:text-base">Quiet, monochromatic typography stacked against dense layouts. Visualize your cash balances, credit liabilities, and investment earnings instantly without shiny distractions.</p>
                        <button onClick={() => navigate('/auth')} className="btn-premium btn-premium-primary gap-2 cursor-pointer shadow-xl">
                          Enter Command Center <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GlassSurface>
                </div>
                <div className="lg:col-span-7">
                  {/* Liquid Glass Container - mirrors `.glassEffectContainer` for grouped elements */}
                  <GlassSurface
                    width="100%"
                    height="auto"
                    borderRadius={32}
                    backgroundOpacity={0.5}
                    saturation={1.85}
                    blur={34}
                    brightness={20}
                    opacity={0.9}
                    borderWidth={0.07}
                  >
                    <div className="glass-effect-container relative w-full overflow-hidden rounded-[32px] p-4">
                      {/* Liquid Glass sub-layer - creates depth and refraction */}
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_54%,rgba(255,255,255,0.08))] opacity-95" />
                      {/* Developer Chrome Bar - integrates with glass container shape */}
                      <div className="relative z-10 mb-4 flex h-8 w-full items-center gap-2 border-b border-white/10 pb-4 pl-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/90 shadow-sm" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/90 shadow-sm" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/90 shadow-sm" />
                        <span className="ml-3 font-mono text-[10px] tracking-wider text-gray-300/80">localhost:5173/dashboard</span>
                      </div>
                      {/* Dashboard Glass Panel - aligns shape with parent container (containerRelativeShape) */}
                      <GlassSurface
                        width="100%"
                        height="auto"
                        borderRadius={28}
                        backgroundOpacity={0.62}
                        saturation={1.65}
                        blur={22}
                        brightness={16}
                        opacity={0.86}
                        borderWidth={0.09}
                        className="relative z-10 transition-all duration-500"
                      >
                        <div className="glass-panel flex w-full flex-col justify-between rounded-[28px] p-6 transition-all duration-500">
                      {/* Metrics Header */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-300/70">Cash Flow Trend</div>
                          <div className="mt-1 text-2xl font-bold text-white">₹1,56,800 total credits</div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex h-8 w-16 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/18 text-xs font-bold text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),0_0_22px_rgba(16,185,129,0.18)] backdrop-blur-sm transition-colors hover:bg-emerald-500/30">
                            +12%
                          </div>
                        </div>
                      </div>
                      {/* Chart Bars - with morphing hover states (Liquid Glass interaction) */}
                      <div className="flex h-32 w-full items-end gap-3 pt-6">
                        <div className="h-[30%] flex-1 origin-bottom rounded-xl border border-white/15 bg-white/10 transition-all duration-300 hover:scale-y-105 hover:border-emerald-400/40 hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.55)]" />
                        <div className="h-[45%] flex-1 origin-bottom rounded-xl border border-white/15 bg-white/10 transition-all duration-300 hover:scale-y-105 hover:border-emerald-400/40 hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.55)]" />
                        <div className="h-[60%] flex-1 origin-bottom rounded-xl border border-white/15 bg-white/10 transition-all duration-300 hover:scale-y-105 hover:border-emerald-400/40 hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.55)]" />
                        <div className="h-[50%] flex-1 origin-bottom rounded-xl border border-white/15 bg-white/10 transition-all duration-300 hover:scale-y-105 hover:border-emerald-400/40 hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.55)]" />
                        <div className="h-[80%] flex-1 origin-bottom rounded-xl border border-white/15 bg-white/10 transition-all duration-300 hover:scale-y-105 hover:border-emerald-400/40 hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.55)]" />
                        <div className="h-[95%] flex-1 origin-bottom rounded-xl border border-white/15 bg-white/10 transition-all duration-300 hover:scale-y-105 hover:border-emerald-400/40 hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.55)]" />
                      </div>
                        </div>
                      </GlassSurface>
                    </div>
                  </GlassSurface>
                </div>
              </div>
            </div>
            </GlassSurface>
          </BorderGlow>
        </section>

        {/* AI Workflow Section */}
        <section id="ai" className="max-w-7xl mx-auto px-6 py-20 md:py-32 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-md">Powered by Gemini AI</h2>
            <p className="text-foreground/80 text-base md:text-lg font-medium drop-shadow-sm">Upload receipts, ask questions to your chatbot assistant, and receive budget alerts generated in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch relative">
            {aiWorkflowSteps.map((item, i) => (
              <BorderGlow
                key={item.step}
                className="group h-full min-h-[300px]"
                edgeSensitivity={16}
                glowColor={item.glowColor}
                backgroundColor="rgba(255, 255, 255, 0.04)"
                borderRadius={30}
                glowRadius={52}
                glowIntensity={1.85}
                coneSpread={34}
                animated={i === 0}
                colors={item.colors}
                fillOpacity={0.95}
                alwaysVisible
              >
                <GlassSurface
                  width="100%"
                  height="100%"
                  borderRadius={30}
                  backgroundOpacity={0.24}
                  saturation={1.8}
                  blur={28}
                  brightness={18}
                  opacity={0.88}
                  borderWidth={0.06}
                  className="transition-transform duration-300 ease-out group-hover:scale-[1.015]"
                  style={{ minHeight: '300px' }}
                >
                  <div className="relative flex h-full flex-col justify-between overflow-hidden p-6 w-full">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02)_54%,rgba(255,255,255,0.08))] opacity-95 rounded-[30px]" />
                    <span className="relative z-10 text-3xl font-bold text-white/35 font-sans drop-shadow-sm transition-colors duration-300 group-hover:text-white/55">{item.step}</span>
                    <div className="relative z-10 mt-8">
                      <h4 className="text-lg font-bold mb-2 text-white drop-shadow-md">{item.title}</h4>
                      <p className="text-xs text-white/82 leading-relaxed font-medium drop-shadow-sm">{item.desc}</p>
                    </div>
                  </div>
                </GlassSurface>
              </BorderGlow>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 md:py-32 border-t border-white/20 dark:border-white/10 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-md">Pricing aligned with value.</h2>
            <p className="text-foreground/80 text-base md:text-lg font-medium drop-shadow-sm">No hidden fees, no credit card lockups. Choose the space that matches your goals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch w-full max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <SpotlightCard
                key={i}
                className={`h-full rounded-[24px] p-0 overflow-hidden shadow-xl transition-all duration-300 ${plan.popular ? 'scale-105 border-emerald-500 border-2' : 'hover:scale-[1.02] border-emerald-500 border-2'}`}
              >
                <GlassSurface
                  width="100%"
                  height="100%"
                  borderRadius={24}
                  backgroundOpacity={0.65}
                  saturation={1.8}
                  blur={30}
                  brightness={22}
                  opacity={0.88}
                  borderWidth={0}
                  className="w-full h-full"
                >
                  <div className="relative h-full flex flex-col justify-between p-8 w-full rounded-[24px] overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02)_54%,rgba(255,255,255,0.08))] opacity-95 transition-opacity" />
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1 rounded-b-lg bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest z-20">
                      RECOMMENDED
                    </div>
                  )}
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-foreground/70 mt-2 font-medium">{plan.desc}</p>
                    <div className="flex items-baseline gap-1 mt-6 mb-8">
                      <span className="text-4xl font-bold font-sans text-foreground">₹{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-sm text-foreground/70 font-medium">/ mo</span>}
                    </div>
                    <ul className="space-y-4">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-foreground/80 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => navigate('/auth')}
                    className={`w-full relative z-10 btn-premium mt-8 cursor-pointer py-3 font-semibold ${plan.popular ? 'btn-premium-primary' : 'btn-premium-secondary'}`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </GlassSurface>
            </SpotlightCard>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="max-w-3xl mx-auto px-6 py-20 md:py-32 border-t border-white/20 dark:border-white/10 w-full">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-md">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <SpotlightCard
                key={i}
                className="w-full rounded-[20px] p-0 overflow-hidden shadow-md border-2 border-emerald-500 transition-all duration-300 hover:scale-[1.01]"
              >
                <GlassSurface
                  width="100%"
                  height="auto"
                  borderRadius={20}
                  backgroundOpacity={0.65}
                  saturation={1.8}
                  blur={24}
                  brightness={22}
                  opacity={0.88}
                  borderWidth={0}
                  className="w-full"
                >
                  <div className="w-full flex justify-between relative overflow-hidden rounded-[20px] flex-col text-left">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)_54%,rgba(255,255,255,0.04))] opacity-95 transition-opacity" />
                    <button
                      onClick={() => toggleFaq(i)}
                      className="w-full p-6 text-left flex items-center justify-between font-semibold text-foreground hover:bg-white/10 dark:hover:bg-white/5 transition-colors relative z-10"
                    >
                      <span className="text-base md:text-lg flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-emerald-500" />
                        {faq.q}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-foreground/60 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {activeFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="relative z-10"
                        >
                          <div className="px-6 pb-6 pt-2 text-xs md:text-sm text-foreground/80 leading-relaxed border-t border-white/10 font-medium">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </GlassSurface>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 w-full flex justify-center pb-12 px-6">
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={24}
            backgroundOpacity={0.65}
            saturation={1.7}
            blur={32}
            brightness={18}
            opacity={0.8}
            borderWidth={0.06}
            className="w-full max-w-7xl"
          >
            <div className="w-full flex justify-between relative overflow-hidden rounded-[24px] flex-col md:flex-row items-center gap-6 px-10 py-8 text-sm text-foreground/70 font-medium">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)_54%,rgba(255,255,255,0.04))] opacity-95" />
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-base font-bold tracking-tight text-foreground">Expense Tracker</span>
              </div>
              <p className="relative z-10">© 2026 Expense Tracker Inc. Built with React 19, TypeScript, and Prisma.</p>
              <div className="flex gap-6 relative z-10">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              </div>
            </div>
          </GlassSurface>
        </footer>

      </div>
    </div>
  );
}

// Simple placeholder icons
function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

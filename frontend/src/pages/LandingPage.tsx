import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Play, CheckCircle2, ChevronDown,
  Wallet, PieChart, Sparkles, TrendingUp, CreditCard,
  ScanLine, HelpCircle, Receipt, PiggyBank, Target, RefreshCcw, FileSpreadsheet
} from 'lucide-react';

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
      className="relative flex flex-col justify-start items-start w-full max-w-[260px] md:max-w-[300px] group mx-auto h-[260px] md:h-[300px]"
    >
      {/* Glow Background */}
      <div
        className="absolute inset-0 opacity-40 rounded-[24px] pointer-events-none transition-all duration-300 group-hover:opacity-75"
        style={{
          background: gradient,
          filter: "blur(30px)",
          width: "100%",
          height: "100%"
        }}
      />
      {/* Foreground Card with Liquid Glass Finish */}
      <div
        className="self-stretch h-full rounded-[24px] z-10 overflow-hidden backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.1)] transition-all duration-300"
        style={{
          background: 'radial-gradient(120% 120% at 50% 10%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.15) 100%)'
        }}
      >
        {/* Content Inner Layout */}
        <div className="w-full h-full p-7 flex flex-col justify-between">
          <div className="text-foreground/90">
            <Icon size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-lg mb-2 tracking-tight">{title}</h3>
            <p className="text-foreground/80 text-[13px] leading-[1.6] font-medium selection:bg-white/20">{description}</p>
          </div>
        </div>
      </div>
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
        {/* Header / Navbar */}
        <header className="sticky top-0 z-50 w-full px-6 md:px-12 lg:px-20 py-5 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-foreground">
              <span className="text-emerald-500 font-serif text-2xl">antigravity.</span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm text-foreground/90 font-semibold drop-shadow-sm">
              <a href="#features" className="hover:text-emerald-500 transition-colors">Features</a>
              <a href="#ai" className="hover:text-emerald-500 transition-colors">AI Module</a>
              <a href="#pricing" className="hover:text-emerald-500 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-emerald-500 transition-colors">FAQ</a>
            </nav>

            <div>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-colors shadow-md"
              >
                Sign In
              </Link>
            </div>
          </div>
        </header>

        {/* Clean Hero Section (Dashboard Preview removed as requested) */}
        <section className="w-full flex flex-col items-center justify-center text-center pt-20 md:pt-32 pb-24 md:pb-36 px-6 max-w-4xl mx-auto">
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

        {/* Features Bento Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 md:py-32 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-md">Handcrafted tools for personal ledger auditing.</h2>
            <p className="text-foreground/80 font-medium text-base md:text-lg drop-shadow-sm">No bloat. Simply powerful, beautiful finance mechanics designed to move as fast as you do.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mt-12 w-full max-w-[936px] mx-auto">
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

        {/* Demo Section (Analytics Preview) */}
        <section id="demo" className="py-20 md:py-32 bg-white/20 dark:bg-black/20 backdrop-blur-xl border-y border-white/20 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-md">A dashboard that looks like developer tooling.</h2>
                <p className="text-foreground/80 leading-relaxed text-sm md:text-base font-medium drop-shadow-sm">Quiet, monochromatic typography stacked against dense layouts. Visualize your cash balances, credit liabilities, and investment earnings instantly without shiny distractions.</p>
                <button onClick={() => navigate('/auth')} className="btn-premium btn-premium-primary gap-2 cursor-pointer shadow-xl">
                  Enter Command Center <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="lg:col-span-7">
                <div className="p-4 rounded-3xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="h-6 w-full flex gap-1.5 items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04] mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-gray-400 ml-4 font-mono">http://localhost:5173/dashboard</span>
                  </div>
                  <div className="aspect-[16/9] w-full flex flex-col justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase">Cash Flow Trend</div>
                        <div className="text-2xl font-bold mt-1 text-foreground">₹1,56,800 total credits</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-16 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">+12%</div>
                      </div>
                    </div>
                    <div className="w-full flex items-end gap-3 h-32 pt-4">
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] h-[30%] rounded-lg hover:bg-emerald-500/25 transition-colors cursor-pointer" />
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] h-[45%] rounded-lg hover:bg-emerald-500/25 transition-colors cursor-pointer" />
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] h-[60%] rounded-lg hover:bg-emerald-500/25 transition-colors cursor-pointer" />
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] h-[50%] rounded-lg hover:bg-emerald-500/25 transition-colors cursor-pointer" />
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] h-[80%] rounded-lg hover:bg-emerald-500/25 transition-colors cursor-pointer" />
                      <div className="flex-1 bg-emerald-500 h-[95%] rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Workflow Section */}
        <section id="ai" className="max-w-7xl mx-auto px-6 py-20 md:py-32 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-md">Powered by Gemini AI</h2>
            <p className="text-foreground/80 text-base md:text-lg font-medium drop-shadow-sm">Upload receipts, ask questions to your chatbot assistant, and receive budget alerts generated in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch relative">
            {[
              { step: '01', title: 'Receipt Upload', desc: 'Drag receipt PDF or image into interface.' },
              { step: '02', title: 'OCR Extraction', desc: 'AI reads text, parses details & currency.' },
              { step: '03', title: 'Smart Categorization', desc: 'Automatically maps to correct spending tags.' },
              { step: '04', title: 'Behavior Insight', desc: 'Financial coach computes impacts on budgets.' },
              { step: '05', title: 'Dashboard Update', desc: 'Wallets, goals, and metrics sync instantly.' }
            ].map((item, i) => (
              <div key={i} className="premium-card bg-white/20 dark:bg-black/30 backdrop-blur-2xl p-6 flex flex-col justify-between border-white/40 dark:border-white/10 relative shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/30 dark:hover:bg-black/40 transition-colors">
                <span className="text-3xl font-bold text-gray-900/40 dark:text-white/20 font-sans drop-shadow-sm">{item.step}</span>
                <div className="mt-8">
                  <h4 className="text-lg font-bold mb-2 text-foreground drop-shadow-md">{item.title}</h4>
                  <p className="text-xs text-foreground/80 leading-relaxed font-medium drop-shadow-sm">{item.desc}</p>
                </div>
              </div>
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
              <div
                key={i}
                className={`premium-card bg-white/60 dark:bg-[#121214]/70 backdrop-blur-xl p-8 flex flex-col justify-between relative shadow-xl ${plan.popular ? 'border-emerald-500 border-2' : 'border-white/40 dark:border-white/[0.05]'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest">
                    RECOMMENDED
                  </div>
                )}
                <div>
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
                  className={`w-full btn-premium mt-8 cursor-pointer py-3 font-semibold ${plan.popular ? 'btn-premium-primary' : 'btn-premium-secondary'}`}
                >
                  {plan.cta}
                </button>
              </div>
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
              <div key={i} className="premium-card p-0 overflow-hidden border-white/30 dark:border-white/[0.05] bg-white/50 dark:bg-[#121214]/60 backdrop-blur-xl shadow-md">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-6 text-left flex items-center justify-between font-semibold text-foreground hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
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
                    >
                      <div className="px-6 pb-6 pt-2 text-xs md:text-sm text-foreground/80 leading-relaxed border-t border-white/10 font-medium">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/20 dark:border-white/10 py-12 bg-white/30 dark:bg-black/30 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-foreground/70 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-foreground">Expense Tracker</span>
            </div>
            <p>© 2026 Expense Tracker Inc. Built with React 19, TypeScript, and Prisma.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Play, Cpu, ShieldCheck, CheckCircle2, ChevronDown, 
  Wallet, PieChart, Sparkles, TrendingUp, Calendar, CreditCard, 
  ScanLine, HelpCircle, Layers, FileText,
  Receipt, PiggyBank, Target, RefreshCcw, FileSpreadsheet
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
        className="absolute inset-0 opacity-60 rounded-[40px] pointer-events-none transition-all duration-300 group-hover:opacity-85"
        style={{ 
          background: gradient,
          filter: "blur(45px)",
          width: "100%",
          height: "100%"
        }}
      />
      {/* Foreground Card with Gradient Border */}
      <div 
        className="self-stretch h-full rounded-[40px] z-10 overflow-hidden"
        style={{
          border: '8px solid transparent',
          background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${gradient} border-box`
        }}
      >
        {/* Content Inner Layout */}
        <div className="w-full h-full p-7 flex flex-col justify-between">
          <div className="text-white/90">
            <Icon size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-white font-medium text-xl mb-3 tracking-tight">{title}</h3>
            <p className="text-gray-400 text-[14px] leading-[1.6] font-normal selection:bg-white/20">{description}</p>
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0C0C0C] selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] bg-[#FAFAFA]/80 dark:bg-[#0C0C0C]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-black dark:text-white">Expense Tracker</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
          <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
          <a href="#ai" className="hover:text-black dark:hover:text-white transition-colors">AI Module</a>
          <a href="#pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-black dark:hover:text-white transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/auth')} className="text-sm font-medium hover:text-black dark:hover:text-white transition-colors cursor-pointer">
            Sign In
          </button>
          <button onClick={() => navigate('/auth')} className="btn-premium btn-premium-primary cursor-pointer text-xs md:text-sm">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-28 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Personal Wealth Space</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
          >
            Take control of your <span className="serif-brand italic font-normal text-emerald-500">money</span>, one expense at a time.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl"
          >
            Track spending, build budgets, analyze habits, and grow your savings with AI-powered financial insights.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button onClick={() => navigate('/auth')} className="btn-premium btn-premium-primary gap-2 cursor-pointer py-3 px-6 text-base">
              Start Tracking Free <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#demo" className="btn-premium btn-premium-secondary gap-2 py-3 px-6 text-base">
              <Play className="w-4 h-4 fill-current" /> Watch Demo
            </a>
          </motion.div>
        </div>

        {/* Hero Interactive Floating Preview */}
        <div className="lg:col-span-5 relative flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[420px] aspect-[9/10] premium-card glass-effect relative border border-black/[0.06] dark:border-white/[0.06]"
          >
            <div className="flex items-center justify-between pb-6 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400">FINTECH WORKSPACE</span>
            </div>

            <div className="space-y-6 pt-6">
              {/* Fake Balance Card */}
              <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/[0.02] dark:border-white/[0.02]">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Total Available Balance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-sans">₹1,36,999</span>
                  <span className="text-xs text-emerald-500 font-medium">+14.2%</span>
                </div>
              </div>

              {/* Floating Widgets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-black/[0.05] dark:border-white/[0.05]">
                  <span className="text-[10px] text-gray-400 font-medium">Food spends</span>
                  <div className="text-lg font-semibold mt-0.5">₹14,500</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[58%]" />
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-black/[0.05] dark:border-white/[0.05]">
                  <span className="text-[10px] text-gray-400 font-medium">Goal Status</span>
                  <div className="text-lg font-semibold mt-0.5">74% Saved</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[74%]" />
                  </div>
                </div>
              </div>

              {/* Recent Transaction */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Recent Transactions</span>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                      <ShoppingBagIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Zara Apparel Store</div>
                      <div className="text-[10px] text-gray-400">Credit Card • Today</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-red-500">-₹4,299</div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Salary Credit</div>
                      <div className="text-[10px] text-gray-400">Bank Transfer • 1d ago</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-500">+₹1,25,000</div>
                </div>
              </div>
            </div>

            {/* Visual Decorative Accent */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Honest Product Statement Section */}
      <section className="py-12 border-t border-b border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
            Open-source personal finance management platform built for individuals who want complete control over their money.
          </p>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Handcrafted tools for personal ledger auditing.</h2>
          <p className="text-gray-400 text-base md:text-lg">No bloat. Simply powerful, beautiful finance mechanics designed to move as fast as you do.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-3 lg:gap-3 w-full max-w-[936px] mx-auto mt-12">
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
      <section id="demo" className="py-20 md:py-32 bg-black/[0.02] dark:bg-white/[0.02] border-t border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">A dashboard that looks like developer tooling.</h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Quiet, monochromatic typography stacked against dense layouts. Visualize your cash balances, credit liabilities, and investment earnings instantly without shiny distractions.</p>
              <button onClick={() => navigate('/auth')} className="btn-premium btn-premium-primary gap-2 cursor-pointer">
                Enter Command Center <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="lg:col-span-7">
              <div className="p-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] shadow-2xl relative overflow-hidden">
                <div className="h-6 w-full flex gap-1.5 items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04] mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-gray-400 ml-4 font-mono">http://localhost:5173/dashboard</span>
                </div>
                {/* Simulated Chart preview */}
                <div className="aspect-[16/9] w-full flex flex-col justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase">Cash Flow Trend</div>
                      <div className="text-2xl font-bold mt-1">₹1,56,800 total credits</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">+12%</div>
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
      <section id="ai" className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Powered by Gemini AI</h2>
          <p className="text-gray-400 text-base md:text-lg">Upload receipts, ask questions to your chatbot assistant, and receive budget alerts generated in real-time.</p>
        </div>

        {/* Animated AI flow card steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch relative">
          {[
            { step: '01', title: 'Receipt Upload', desc: 'Drag receipt PDF or image into interface.' },
            { step: '02', title: 'OCR Extraction', desc: 'AI reads text, parses details & currency.' },
            { step: '03', title: 'Smart Categorization', desc: 'Automatically maps to correct spending tags.' },
            { step: '04', title: 'Behavior Insight', desc: 'Financial coach computes impacts on budgets.' },
            { step: '05', title: 'Dashboard Update', desc: 'Wallets, goals, and metrics sync instantly.' }
          ].map((item, i) => (
            <div key={i} className="premium-card p-6 flex flex-col justify-between border-black/[0.05] dark:border-white/[0.05] relative">
              <span className="text-3xl font-bold text-black/[0.08] dark:text-white/[0.08] font-sans">{item.step}</span>
              <div className="mt-8">
                <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 md:py-32 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Pricing aligned with value.</h2>
          <p className="text-gray-400 text-base md:text-lg">No hidden fees, no credit card lockups. Choose the space that matches your goals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan, i) => (
            <div 
              key={i} 
              className={`premium-card p-8 flex flex-col justify-between relative ${plan.popular ? 'border-emerald-500 border-2' : 'border-black/[0.05] dark:border-white/[0.05]'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest">
                  RECOMMENDED
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-2">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mt-6 mb-8">
                  <span className="text-4xl font-bold font-sans">₹{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-sm text-gray-400">/ mo</span>}
                </div>
                <ul className="space-y-4">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => navigate('/auth')} 
                className={`w-full btn-premium mt-8 cursor-pointer py-3 ${plan.popular ? 'btn-premium-primary' : 'btn-premium-secondary'}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 md:py-32 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="premium-card p-0 overflow-hidden border-black/[0.05] dark:border-white/[0.05]">
              <button 
                onClick={() => toggleFaq(i)}
                className="w-full p-6 text-left flex items-center justify-between font-semibold hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
              >
                <span className="text-base md:text-lg flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-emerald-500" />
                  {faq.q}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 pt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-black/[0.02] dark:border-white/[0.02]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-black/[0.04] dark:border-white/[0.04] py-12 bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-black dark:text-white">Expense Tracker</span>
          </div>
          <p>© 2026 Expense Tracker Inc. Built with React 19, TypeScript, and Prisma.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple placeholder icons to avoid missing imports
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

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles, Plus,
  Bot, ScanLine, ShoppingBag,
  ShieldCheck, Swords, Receipt
} from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../components/UI/Toast';
import { SkeletonCard, SkeletonChart } from '../components/UI/Skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import Ferrofluid from '../components/UI/Ferrofluid';
import StaggeredMenu from '../components/StaggeredMenu/StaggeredMenu';
import ExpandableActionMenu from '../components/UI/ExpandableActionMenu';
import SpecularButton from '../components/UI/SpecularButton';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const menuRef = React.useRef(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const [quests, setQuests] = useState([
    { id: 1, title: 'Zero Spend', reward: '150XP', progress: '1/3', completed: false, rewardClaimed: false },
    { id: 2, title: 'Check In', reward: '50XP', progress: '0/1', completed: false, rewardClaimed: false },
    { id: 3, title: 'Add Ledger', reward: '100XP', progress: '1/1', completed: true, rewardClaimed: false },
    { id: 4, title: 'Scan Receipt', reward: '200XP', progress: '0/1', completed: false, rewardClaimed: false }
  ]);

  const claimQuestReward = (questId: number) => {
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, rewardClaimed: true } : q));
    showToast('REWARD CLAIMED. XP UPDATED.', 'success');
  };

  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ['summary'], queryFn: () => api.getSummary() });
  const { data: trend, isLoading: trendLoading } = useQuery({ queryKey: ['trend'], queryFn: () => api.getTrend() });
  const { data: expenses, isLoading: expensesLoading } = useQuery({ queryKey: ['expenses'], queryFn: () => api.getExpenses({ take: 5 }) });
  const { data: coachData } = useQuery({ queryKey: ['coach'], queryFn: () => api.request('/ai/coach') });
  const { data: categoriesData } = useQuery({ queryKey: ['categories-pie'], queryFn: () => api.getByCategory() });

  const totalExpense = summary?.total || 0;
  const estimatedIncome = trend && trend.length > 0 ? trend[trend.length - 1].income : 125000;
  const netWorth = estimatedIncome - totalExpense;
  const savingsRate = estimatedIncome > 0 ? ((netWorth / estimatedIncome) * 100).toFixed(0) : '0';

  const chatMutation = useMutation({
    mutationFn: (data: { message: string; history: any[] }) => api.request('/ai/chat', { method: 'POST', body: data }),
    onSuccess: (data) => setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]),
    onError: (err: any) => showToast(err.message || 'SYS.ERROR', 'error'),
    onSettled: () => setIsSending(false)
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setIsSending(true);
    const newMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: newMsg }]);
    setChatMessage('');
    chatMutation.mutate({ message: newMsg, history: chatHistory });
  };

  const CATEGORY_COLORS = ['#10B981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#a855f7', '#6366f1'];

  return (
    <div className="space-y-8 pb-10 relative min-h-screen">
      {/* Background Ferrofluid - Green Theme */}
      <div className="fixed inset-0 z-0">
        <Ferrofluid
            colors={["#3e9c35", "#168118", "#157811"]}
            speed={0.2}
            turbulence={0.5}
            opacity={0.15}
            mouseInteraction={true}
        />
      </div>

      <div className="relative z-10 space-y-8 p-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 pb-6 border-b-2 border-[#168118]">
            <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#168118] bg-[#168118]/10 px-2 py-1 mb-2 inline-block">SYS.ACTIVE</div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-display uppercase leading-none text-[#0b1c30] mb-2">
                DASHBOARD
            </h1>
            </div>
            <div className="flex items-center gap-3">
              <SpecularButton
                  size="sm"
                  radius={14}
                  tint="#168118"
                  tintOpacity={0.15}
                  blur={8}
                  textColor="#ffffff"
                  lineColor="#10B981"
                  baseColor="#168118"
                  intensity={1.2}
                  shineSize={12}
                  shineFade={35}
                  thickness={1}
                  speed={0.3}
                  followMouse
                  proximity={200}
                  onClick={() => setScannerOpen(true)}
              >
                  <ScanLine className="w-4 h-4" strokeWidth={2.5} />
                  SCAN
              </SpecularButton>

              <SpecularButton
                  size="sm"
                  radius={14}
                  tint="#0b1c30"
                  tintOpacity={0.9}
                  blur={0}
                  textColor="#ffffff"
                  lineColor="#10B981"
                  baseColor="#168118"
                  intensity={1.2}
                  shineSize={12}
                  shineFade={35}
                  thickness={1}
                  speed={0.3}
                  followMouse
                  proximity={200}
                  onClick={() => menuRef.current?.toggle()}
              >
                 <Plus className="w-4 h-4" strokeWidth={2.5} />
                 ADD
              </SpecularButton>
            </div>
        </div>

        {/* Summary Metrics - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center gap-2 text-[#168118] mb-2">
              <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Net Worth</span>
            </div>
            <div className="text-3xl font-extrabold font-sans text-[#0b1c30]">
              {summaryLoading ? <SkeletonChart /> : formatCurrency(netWorth, user?.baseCurrency)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-semibold">Assets minus outflows</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center gap-2 text-[#168118] mb-2">
              <ArrowDownRight className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Expenses</span>
            </div>
            <div className="text-3xl font-extrabold font-sans text-[#0b1c30]">
              {summaryLoading ? <SkeletonChart /> : formatCurrency(totalExpense, user?.baseCurrency)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-semibold">All-time debited volume</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center gap-2 text-[#168118] mb-2">
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Est. Income</span>
            </div>
            <div className="text-3xl font-extrabold font-sans text-[#0b1c30]">
              {summaryLoading ? <SkeletonChart /> : formatCurrency(estimatedIncome, user?.baseCurrency)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-semibold">Projected monthly inflow</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center gap-2 text-[#168118] mb-2">
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Savings Rate</span>
            </div>
            <div className="text-3xl font-extrabold font-sans text-[#0b1c30]">
              {summaryLoading ? <SkeletonChart /> : <>{savingsRate}%</>}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-semibold">Of total income saved</div>
          </div>
        </div>

        {/* Charts Row - Cash Flow + Category Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Trend Area Chart */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center gap-2 text-[#0b1c30] mb-4">
              <TrendingUp className="w-5 h-5 text-[#168118]" strokeWidth={2.5} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Cash Flow Overview</h3>
            </div>
            <div className="h-72">
              {trendLoading ? (
                <SkeletonChart />
              ) : trend && trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5eeff', background: 'white' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Income" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                    <Area type="monotone" name="Spent" dataKey="total" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#spentGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center gap-2 text-[#0b1c30] mb-4">
              <ShoppingBag className="w-5 h-5 text-[#168118]" strokeWidth={2.5} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Categories</h3>
            </div>
            <div className="h-72 flex items-center justify-center">
              {categoriesData && categoriesData.length > 0 && categoriesData.some((c: any) => c.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ bottom: 10 }}>
                    <Pie
                      data={categoriesData.filter((c: any) => c.total > 0)}
                      cx="50%"
                      cy="43%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="name"
                    >
                      {categoriesData.filter((c: any) => c.total > 0).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(Number(value), user?.baseCurrency), 'Amount']} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={50} 
                      iconType="circle" 
                      iconSize={6}
                      wrapperStyle={{ 
                        fontSize: '9px',
                        fontWeight: '600',
                        bottom: 0,
                        width: '100%',
                        left: 0,
                        padding: '0 5px',
                        lineHeight: '13px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-gray-400">No expense data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions + AI Coach */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#0b1c30]">
                <Receipt className="w-5 h-5 text-[#168118]" strokeWidth={2.5} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Recent Activity</h3>
              </div>
              <button onClick={() => showToast('GOTO TXNS.', 'info')} className="text-[10px] font-bold text-[#168118] hover:underline cursor-pointer">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {expensesLoading ? (
                <SkeletonCard />
              ) : expenses && expenses.length > 0 ? (
                expenses.slice(0, 5).map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#168118]/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#168118]/10 flex items-center justify-center text-[#168118]">
                        <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-[#0b1c30]">{exp.title}</div>
                        <div className="text-[10px] text-gray-400 font-semibold">{exp.category_name} · {new Date(exp.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-sm font-extrabold font-sans text-[#0b1c30]">
                      {formatCurrency(exp.amount, user?.baseCurrency)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">No transactions yet</div>
              )}
            </div>
          </div>

          {/* AI Coach Insights */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
            <div className="flex items-center gap-2 text-[#0b1c30] mb-4">
              <Bot className="w-5 h-5 text-[#168118]" strokeWidth={2.5} />
              <h3 className="text-sm font-bold uppercase tracking-wider">AI Coach</h3>
            </div>
            <div className="space-y-3">
              {coachData?.insights?.length > 0 ? (
                coachData.insights.slice(0, 3).map((ins: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-[#168118]/5 border border-[#168118]/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3 h-3 text-[#168118]" />
                      <span className="text-[10px] font-bold text-[#168118] uppercase">{ins.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{ins.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No insights yet. Add more transactions for AI analysis.</p>
                </div>
              )}
              <SpecularButton
                size="sm"
                radius={12}
                tint="#168118"
                tintOpacity={0.85}
                blur={0}
                textColor="#ffffff"
                lineColor="#10B981"
                baseColor="#065f46"
                intensity={1}
                shineSize={10}
                shineFade={40}
                thickness={1}
                speed={0.35}
                followMouse
                proximity={200}
                autoAnimate={false}
                onClick={() => setChatOpen(true)}
                className="w-full mt-2"
              >
                <Bot className="w-3.5 h-3.5" />
                Open AI Coach
              </SpecularButton>
            </div>
          </div>
        </div>

        {/* Quests / Gamification */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-[#168118]/10 shadow-lg shadow-[#168118]/5">
          <div className="flex items-center gap-2 text-[#0b1c30] mb-4">
            <Swords className="w-5 h-5 text-[#168118]" strokeWidth={2.5} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Daily Quests</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quests.map(q => (
              <div key={q.id} className="p-4 rounded-xl bg-[#168118]/5 border border-[#168118]/10 flex flex-col items-center text-center">
                <div className="text-[10px] font-bold text-[#168118] uppercase tracking-wider mb-1">{q.title}</div>
                <div className="text-xs text-gray-500 font-semibold mb-1">{q.progress}</div>
                <div className="text-[10px] text-[#168118] font-bold mb-2">Reward: {q.reward}</div>
                {q.completed && q.rewardClaimed ? (
                  <span className="px-3 py-1 rounded-lg bg-[#168118]/10 text-[#168118] text-[10px] font-bold">Claimed</span>
                ) : q.completed ? (
                  <SpecularButton
                    size="sm"
                    radius={10}
                    tint="#168118"
                    tintOpacity={0.85}
                    blur={0}
                    textColor="#ffffff"
                    lineColor="#10B981"
                    baseColor="#065f46"
                    intensity={1.2}
                    shineSize={10}
                    shineFade={35}
                    thickness={1}
                    speed={0.4}
                    followMouse
                    proximity={150}
                    autoAnimate
                    onClick={() => claimQuestReward(q.id)}
                  >
                    Claim
                  </SpecularButton>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-400 text-[10px] font-bold">In Progress</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Viewport-fixed StaggeredMenu triggered externally by the ADD button */}
      <StaggeredMenu
        ref={menuRef}
        isFixed
        position="right"
        showTrigger={false}
        items={[
          { 
            label: 'AI Financial Copilot', 
            ariaLabel: 'AI Financial Copilot', 
            link: user?.isPremium ? '/copilot' : '#',
            onClick: (e) => { 
                if (!user?.isPremium) {
                    e.preventDefault();
                    showToast('This feature is for PRO users only.', 'warning');
                }
            } 
          },
          { 
            label: 'AI Assistant', 
            ariaLabel: 'AI Assistant', 
            link: user?.isPremium ? '/assistant' : '#',
            onClick: (e) => { 
                if (!user?.isPremium) {
                    e.preventDefault();
                    showToast('This feature is for PRO users only.', 'warning');
                }
            }
          },
          { 
            label: 'Savings Goals', 
            ariaLabel: 'Savings Goals', 
            link: '/goals' // Free feature
          },
          { 
            label: 'Add Ledger', 
            ariaLabel: 'Add a manual transaction', 
            link: '/expenses' // Free feature
          },
          { 
            label: 'Receipt Scanner', 
            ariaLabel: 'Analyze a receipt', 
            link: user?.isPremium ? '/copilot' : '#',
            onClick: (e) => { 
                if (!user?.isPremium) {
                    e.preventDefault();
                    showToast('This feature is for PRO users only.', 'warning');
                }
            }
          }
        ]}
        colors={['#10B981', '#065f46']}
        menuButtonColor="#000"
        openMenuButtonColor="#fff"
        accentColor="#10B981"
        displaySocials={false}
        displayItemNumbering={false}
      />
    </div>
  );
}

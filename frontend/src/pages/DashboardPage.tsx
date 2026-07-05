import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles, Plus, 
  Search, Bot, X, Send, ScanLine, AlertTriangle, Layers,
  ShoppingBag, CheckCircle, RefreshCw, UploadCloud
} from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../components/UI/Toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  // Queries
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: () => api.getSummary()
  });

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ['trend'],
    queryFn: () => api.getTrend()
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.getInsights()
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses({ take: 5 }) // fetch recent
  });

  const { data: coachData, isLoading: coachLoading } = useQuery({
    queryKey: ['coach'],
    queryFn: () => api.request('/ai/coach')
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-pie'],
    queryFn: () => api.getByCategory()
  });

  // Calculate Net Flow details
  const totalExpense = summary?.total || 0;
  const estimatedIncome = trend && trend.length > 0 ? trend[trend.length - 1].income : 125000;
  const netWorth = estimatedIncome - totalExpense;
  const savingsRate = estimatedIncome > 0 ? ((netWorth / estimatedIncome) * 100).toFixed(0) : '0';

  // AI Chat Mutation
  const chatMutation = useMutation({
    mutationFn: (data: { message: string; history: any[] }) => api.request('/ai/chat', { method: 'POST', body: data }),
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    },
    onError: (err: any) => {
      showToast(err.message || 'Chat failed', 'error');
    },
    onSettled: () => {
      setIsSending(false);
    }
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

  // Drag and Drop File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (file: File) => {
    setScanLoading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      // Perform Fetch directly for Multi-Part Form Upload
      const token = localStorage.getItem('fintech_token');
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('OCR Scanning failed.');
      const result = await res.json();
      
      showToast(`Logged ₹${result.ocrResult.amount} expense at "${result.ocrResult.merchant}"!`, 'success');
      setScannerOpen(false);
      
      // Invalidate queries to refresh balance, trend, and transaction table
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories-pie'] });
    } catch (e: any) {
      showToast(e.message || 'Failed to scan receipt', 'error');
    } finally {
      setScanLoading(false);
    }
  };

  // Pie Chart Colors
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#EF4444', '#8B5CF6', '#6B7280'];

  return (
    <div className="space-y-6 fade-in-up">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Workspace</h1>
          <p className="text-sm text-gray-400 mt-1">Hello, {user?.name}. Here is your financial overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScannerOpen(true)}
            className="btn-premium btn-premium-secondary gap-2 cursor-pointer py-2 text-sm"
          >
            <ScanLine className="w-4 h-4 text-emerald-500" />
            AI Scanner
          </button>
          <button 
            onClick={() => showToast('Enter your transactions under the Transactions view.', 'info')} 
            className="btn-premium btn-premium-primary gap-2 cursor-pointer py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Ledger
          </button>
        </div>
      </div>

      {/* Bento Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -2 }} className="premium-card relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Net Worth (Est.)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold mt-2 font-sans">{formatCurrency(netWorth, user?.baseCurrency)}</div>
          <span className="text-[10px] text-emerald-500 font-medium mt-1 inline-block">Liquid assets synced</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="premium-card">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Inflow Forecast</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold mt-2 font-sans">{formatCurrency(estimatedIncome, user?.baseCurrency)}</div>
          <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">Expected monthly credits</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="premium-card">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Outflow Ledger</span>
            <ArrowUpRight className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-bold mt-2 font-sans">{formatCurrency(totalExpense, user?.baseCurrency)}</div>
          <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block">Debited this cycle</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="premium-card">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Savings Rate</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold mt-2 font-sans">{savingsRate}%</div>
          <span className="text-[10px] text-indigo-500 font-medium mt-1 inline-block">Net margin efficiency</span>
        </motion.div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="premium-card lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-lg font-bold">Cash Flow Overview</h3>
            <span className="text-xs text-gray-400">Monthly inflow and outflow details (Last 6 Months)</span>
          </div>
          <div className="h-64 mt-6">
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius-interactive)',
                      color: 'var(--text)'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Inflow" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" name="Outflow" dataKey="total" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading flow trends...</div>
            )}
          </div>
        </div>

        {/* Categories Pie Chart Breakdown */}
        <div className="premium-card flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Category Distribution</h3>
            <span className="text-xs text-gray-400">Categorical splits for current cycle</span>
          </div>
          <div className="h-64 mt-6 relative flex items-center justify-center">
            {categoriesData && categoriesData.some((c: any) => c.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData.filter((c: any) => c.total > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {categoriesData.filter((c: any) => c.total > 0).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Amount']}
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius-interactive)'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-sm text-gray-400">No active category spends logged.</div>
            )}
          </div>
        </div>
      </div>

      {/* AI coach warnings and Recent transactions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Transactions */}
        <div className="premium-card lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold">Recent Ledger Entries</h3>
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {expenses && expenses.length > 0 ? (
              expenses.slice(0, 5).map((exp: any) => (
                <div key={exp.id} className="flex justify-between items-center py-3.5">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: exp.category_color || '#6B7280' }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold truncate max-w-[180px]">{exp.title}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{exp.category_name} • {new Date(exp.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${exp.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {exp.type === 'INCOME' ? '+' : '-'}₹{exp.amount}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-sm text-gray-400">No logged expenses found.</div>
            )}
          </div>
        </div>

        {/* Right Side: AI Coach and insights */}
        <div className="premium-card space-y-6">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              AI Financial Coach
            </h3>
            <span className="text-xs text-gray-400">Habit recommendations and predictions</span>
          </div>

          <div className="space-y-4">
            {coachData?.tips ? (
              coachData.tips.map((tip: string, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  {tip}
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] text-xs text-gray-500 leading-relaxed">
                  You spent 34% more on restaurants than last week. Cooking at home could save ₹4,500.
                </div>
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] text-xs text-gray-500 leading-relaxed">
                  Predictions: You'll likely exceed your shopping budget by the 24th of this month.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setChatOpen(true)}
          className="w-12 h-12 bg-black dark:bg-[#151515] border border-black/[0.06] dark:border-white/[0.06] rounded-full shadow-2xl flex items-center justify-center text-emerald-500 hover:scale-105 transition-transform cursor-pointer"
        >
          <Bot className="w-6 h-6" />
        </button>

        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-[340px] md:w-[380px] h-[480px] bg-white dark:bg-[#151515] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold">AI Coach</span>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
                {chatHistory.length === 0 && (
                  <div className="text-center py-10 text-gray-400 space-y-2">
                    <Sparkles className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p>Ask me anything about your cash flows, restaurant budgets, or savings rates.</p>
                  </div>
                )}
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[80%] p-3 rounded-2xl leading-relaxed
                        ${chat.role === 'user' 
                          ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-none' 
                          : 'bg-black/[0.03] dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 rounded-tl-none'
                        }
                      `}
                    >
                      {chat.content}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] text-gray-400 animate-pulse">
                      Analyzing flows...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-black/[0.04] dark:border-white/[0.04] flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Where did I spend the most this month?" 
                  className="flex-1 input-premium py-2 text-xs"
                />
                <button 
                  type="submit"
                  className="p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center cursor-pointer hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Receipt Scanner Dialog */}
      <AnimatePresence>
        {scannerOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[460px] premium-card p-6 bg-white dark:bg-[#151515] relative border border-black/[0.06] dark:border-white/[0.06]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04] mb-6">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-lg">AI Receipt Scanner</span>
                </div>
                <button 
                  onClick={() => setScannerOpen(false)}
                  className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {scanLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                  <div className="text-sm font-semibold animate-pulse text-gray-600 dark:text-gray-400">Processing OCR extraction...</div>
                  <div className="text-[10px] text-gray-400">Parsing items, tax, and categories</div>
                </div>
              ) : (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl py-12 flex flex-col items-center justify-center gap-3 transition-colors duration-200 cursor-pointer
                    ${dragActive 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.2] dark:hover:border-white/[0.2]'
                    }
                  `}
                >
                  <UploadCloud className="w-10 h-10 text-gray-400" />
                  <div className="text-center px-6">
                    <p className="text-sm font-semibold">Drag & drop your receipt image here</p>
                    <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, or PDF (Max 5MB)</p>
                  </div>
                  <label className="btn-premium btn-premium-primary text-xs cursor-pointer py-1.5 px-4 mt-3">
                    Choose File
                    <input type="file" onChange={handleFileInput} className="hidden" accept="image/*,application/pdf" />
                  </label>
                </div>
              )}

              <div className="mt-6 p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] flex gap-3 text-xs text-gray-500">
                <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p>Gemini AI will automatically extract merchant details, amount, tax, and date, catalog the expense, and update your HDFC/Cash wallets.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

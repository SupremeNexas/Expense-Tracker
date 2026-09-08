import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ShieldAlert, CreditCard, PieChart, Bell, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export interface FinancialAlert {
  id: string;
  type: 'BUDGET_ALERT' | 'CREDIT_CARD_ALERT' | 'SPENDING_LIMIT_ALERT';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  categoryId?: string;
  categoryName?: string;
  cardId?: string;
  cardName?: string;
  spent: number;
  limit: number;
  percentage: number;
  createdAt: string;
  actionUrl?: string;
}

export default function FinancialAlertsBanner() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['financial-alerts'],
    queryFn: () => api.getAlerts(),
    refetchInterval: 30000, // Refresh every 30s
  });

  const dismissMutation = useMutation({
    mutationFn: (alertId: string) => api.dismissAlert(alertId),
    onSuccess: (_, alertId) => {
      setDismissedIds((prev) => [...prev, alertId]);
      queryClient.invalidateQueries({ queryKey: ['financial-alerts'] });
    },
  });

  const rawAlerts: FinancialAlert[] = data?.alerts || [];
  const activeAlerts = rawAlerts.filter((a) => !dismissedIds.includes(a.id));

  if (isLoading) {
    return (
      <div className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-5 border border-[rgba(253,241,225,0.42)] shadow-xl animate-pulse">
        <div className="h-4 bg-[#111411]/10 rounded w-1/4 mb-3" />
        <div className="h-10 bg-[#111411]/5 rounded w-full" />
      </div>
    );
  }

  if (isError || activeAlerts.length === 0) {
    return (
      <div className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-4 border border-[rgba(253,241,225,0.42)] shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#111411]">
              Financial Health Status: Healthy
            </div>
            <div className="text-[11px] text-[#111411]/70 font-medium">
              All budgets and credit limits are within safe thresholds.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#111411]">
          <Bell className="w-4 h-4 text-[#111411]" strokeWidth={2.5} />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Active Financial Alerts ({activeAlerts.length})
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeAlerts.map((alert) => {
          const isDanger = alert.severity === 'danger';
          const isWarning = alert.severity === 'warning';

          const icon =
            alert.type === 'CREDIT_CARD_ALERT' ? (
              <CreditCard className="w-4 h-4" />
            ) : alert.type === 'SPENDING_LIMIT_ALERT' ? (
              <PieChart className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            );

          const badgeBg = isDanger
            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
            : isWarning
            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            : 'bg-blue-500/10 text-blue-600 border-blue-500/20';

          return (
            <div
              key={alert.id}
              className="bg-[#fdf1e1] text-[#111411] rounded-2xl p-4 border border-[rgba(253,241,225,0.42)] shadow-xl flex flex-col justify-between relative group hover:border-[#111411]/20 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-lg border flex items-center justify-center ${badgeBg}`}
                    >
                      {icon}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#111411]">
                      {alert.type.replace('_ALERT', '').replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => dismissMutation.mutate(alert.id)}
                    className="text-[#111411]/40 hover:text-[#111411] p-1 rounded-lg hover:bg-[#111411]/5 transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-xs font-bold text-[#111411] mb-1">{alert.title}</h4>
                <p className="text-[11px] text-[#111411]/70 leading-relaxed mb-3">
                  {alert.message}
                </p>

                {/* Progress bar */}
                {alert.limit > 0 && (
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[10px] font-semibold text-[#111411]/80">
                      <span>{alert.percentage}% spent</span>
                      <span>
                        ${alert.spent.toFixed(0)} / ${alert.limit.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-[#111411]/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {alert.actionUrl && (
                <button
                  onClick={() => navigate(alert.actionUrl!)}
                  className="mt-2 flex items-center justify-between text-[11px] font-bold text-[#111411] hover:underline cursor-pointer pt-2 border-t border-[#111411]/10"
                >
                  <span>Manage {alert.categoryName || alert.cardName || 'Limits'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

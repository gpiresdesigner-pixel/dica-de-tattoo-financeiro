import React, { useMemo } from 'react';
import { Transaction, TransactionType, FinancialSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  summary: FinancialSummary;
}

const COLORS = ['#1F2937', '#4B5563', '#9CA3AF', '#D1D5DB', '#3B82F6', '#EF4444', '#10B981'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, summary }) => {
  
  // Dados para o Gráfico Mensal
  const monthlyData = useMemo(() => {
    const data: Record<string, { name: string; income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!data[key]) {
        data[key] = { name: key, income: 0, expense: 0 };
      }
      
      if (t.type === TransactionType.INCOME) {
        data[key].income += t.amount;
      } else {
        data[key].expense += t.amount;
      }
    });

    return Object.values(data).sort((a, b) => {
      const [ma, ya] = a.name.split('/');
      const [mb, yb] = b.name.split('/');
      return new Date(parseInt(ya), parseInt(ma)).getTime() - new Date(parseInt(yb), parseInt(mb)).getTime();
    });
  }, [transactions]);

  // Dados para o Gráfico de Categorias (Custo)
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        if (!data[t.category]) data[t.category] = 0;
        data[t.category] += t.amount;
      });
    
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Order by highest expense
  }, [transactions]);

  // Lógica de Alertas (Próximos 3 dias + Atrasados)
  const alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    return transactions.filter(t => {
      if (t.status === 'PAID') return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Ignore time part
      return dueDate <= threeDaysFromNow;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [transactions]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border-t-4 border-green-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Receitas (Realizado)</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(summary.totalIncome)}</p>
          <p className="text-xs text-green-600 mt-1 font-medium">
            + {formatCurrency(summary.pendingIncome)} a receber
          </p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border-t-4 border-red-500 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Despesas (Realizado)</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(summary.totalExpense)}</p>
          <p className="text-xs text-red-500 mt-1 font-medium">
            + {formatCurrency(summary.pendingExpense)} a pagar
          </p>
        </div>
        <div className={`bg-white p-5 md:p-6 rounded-xl shadow-sm border-t-4 ${summary.balance >= 0 ? 'border-gray-800' : 'border-red-600'}`}>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Saldo Atual</h3>
          <p className={`text-2xl font-bold mt-2 ${summary.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
        <div className="bg-gray-900 p-5 md:p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Previsão de Caixa</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summary.balance + summary.pendingIncome - summary.pendingExpense)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Considerando pendências</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm h-64 md:h-96">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Fluxo de Caixa Mensal</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{fontSize: '12px'}}/>
                <Bar dataKey="income" name="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" name="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm h-72 md:h-80">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Despesas por Categoria</h3>
             <div className="flex items-center h-full pb-10">
               {categoryData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={categoryData}
                       cx="50%"
                       cy="50%"
                       innerRadius={50}
                       outerRadius={70}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {categoryData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                     <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', width: '40%'}} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="w-full text-center text-gray-400">Sem dados de despesas.</div>
               )}
             </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col h-auto md:h-full max-h-[500px] md:max-h-full">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
            <h3 className="font-bold text-orange-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
              </svg>
              Alertas de Vencimento
            </h3>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{alerts.length}</span>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">
                Nenhuma conta pendente para os próximos 3 dias.
              </div>
            ) : (
              alerts.map(alert => {
                const dueDate = new Date(alert.dueDate);
                const today = new Date();
                today.setHours(0,0,0,0);
                dueDate.setHours(0,0,0,0);
                
                const isOverdue = dueDate < today;
                const isToday = dueDate.getTime() === today.getTime();

                return (
                  <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${isOverdue ? 'border-red-500 bg-red-50' : 'border-yellow-400 bg-yellow-50'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{alert.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.category} - {alert.subcategory}</p>
                      </div>
                      <div className="text-right">
                         <p className={`font-bold text-sm ${alert.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                           {formatCurrency(alert.amount)}
                         </p>
                         <p className={`text-xs font-bold mt-1 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                           {isOverdue ? 'Venceu!' : isToday ? 'Vence Hoje' : new Date(alert.dueDate).toLocaleDateString('pt-BR')}
                         </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-3 bg-gray-50 text-xs text-center text-gray-500">
            Mostrando pendências dos próximos 3 dias
          </div>
        </div>
      </div>
    </div>
  );
};
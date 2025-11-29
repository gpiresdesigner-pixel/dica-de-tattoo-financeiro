
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, FinancialSummary, ViewState, CommissionReceiver } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Reports } from './components/Reports';
import { Commissions } from './components/Commissions';
import { generateUUID } from './utils';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receivers, setReceivers] = useState<CommissionReceiver[]>([]);
  
  // State for Form/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load Transactions
  useEffect(() => {
    try {
      const savedT = localStorage.getItem('finanflow_transactions');
      if (savedT) {
        setTransactions(JSON.parse(savedT));
      } else {
        // Seed data
        const today = new Date().toISOString().split('T')[0];
        setTransactions([
          { 
            id: '1', 
            date: today, 
            dueDate: today, 
            description: 'Venda Curso Básico - Turma A', 
            amount: 15000, 
            type: TransactionType.INCOME, 
            category: 'Receitas',
            subcategory: 'Venda de Cursos',
            status: 'PAID',
            commissionPaid: false
          },
          { 
            id: '2', 
            date: today, 
            dueDate: today, 
            description: 'Facebook Ads - Campanha Lançamento', 
            amount: 3200, 
            type: TransactionType.EXPENSE, 
            category: 'Marketing & Tráfego',
            subcategory: 'Facebook/Instagram Ads',
            status: 'PAID',
            commissionPaid: false
          },
        ]);
      }
    } catch (e) {
      console.error("Erro ao carregar transações:", e);
    }

    // Load Receivers
    try {
      const savedR = localStorage.getItem('finanflow_receivers');
      if (savedR) {
         setReceivers(JSON.parse(savedR));
      }
    } catch (e) {
      console.error("Erro ao carregar equipe:", e);
    }
  }, []);

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem('finanflow_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error("Erro ao salvar transações:", e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('finanflow_receivers', JSON.stringify(receivers));
    } catch (e) {
      console.error("Erro ao salvar equipe:", e);
    }
  }, [receivers]);

  // Handle Save (Create or Update)
  const handleSaveTransaction = (data: Transaction | Omit<Transaction, 'id'>) => {
    if ('id' in data) {
      // Update existing
      setTransactions(prev => prev.map(t => t.id === data.id ? data : t));
    } else {
      // Create new
      const newTransaction: Transaction = {
        ...data,
        id: generateUUID()
      };
      setTransactions(prev => [...prev, newTransaction]);
    }
    closeForm();
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const toggleStatus = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'PAID' ? 'PENDING' : 'PAID' };
      }
      return t;
    }));
  };

  // Commission Logic Handlers
  const addReceiver = (r: CommissionReceiver) => {
    setReceivers(prev => [...prev, r]);
  };

  const removeReceiver = (id: string) => {
    if (window.confirm("Remover este membro da equipe?")) {
      setReceivers(prev => prev.filter(r => r.id !== id));
    }
  };

  const launchCommission = (expense: Omit<Transaction, 'id'>, sourceTransactionIds: string[]) => {
    // Generate new expense transaction
    const newExpense: Transaction = {
      ...expense,
      id: generateUUID()
    };

    // Update transactions:
    // 1. Mark sources as paid (commissionPaid = true)
    // 2. Add the new expense
    setTransactions(prev => {
      const updatedList = prev.map(t => {
        if (sourceTransactionIds.includes(t.id)) {
          return { ...t, commissionPaid: true };
        }
        return t;
      });
      return [...updatedList, newExpense];
    });
  };

  const summary: FinancialSummary = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.INCOME) {
      if (t.status === 'PAID') {
        acc.totalIncome += t.amount;
        acc.balance += t.amount;
      } else {
        acc.pendingIncome += t.amount;
      }
    } else {
      if (t.status === 'PAID') {
        acc.totalExpense += t.amount;
        acc.balance -= t.amount;
      } else {
        acc.pendingExpense += t.amount;
      }
    }
    return acc;
  }, { totalIncome: 0, totalExpense: 0, balance: 0, pendingIncome: 0, pendingExpense: 0 });

  // Desktop Nav Link
  const NavLink = ({ target, label, icon }: { target: ViewState, label: string, icon: React.ReactNode }) => {
    const isActive = view === target;
    return (
      <button
        onClick={() => setView(target)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-gray-800 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  // Mobile Bottom Tab Item
  const MobileTab = ({ target, label, icon }: { target: ViewState, label: string, icon: React.ReactNode }) => {
    const isActive = view === target;
    return (
      <button
        onClick={() => setView(target)}
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
          isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`p-1 rounded-full ${isActive ? 'bg-gray-100' : ''}`}>
           {React.cloneElement(icon as React.ReactElement, { 
             className: `w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-1.5'}` 
           })}
        </div>
        <span className="text-[10px] mt-1 font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Top Navbar (Simplified for Mobile) */}
      <nav className="bg-gray-900 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="w-8 h-8 bg-white text-gray-900 rounded-lg flex items-center justify-center text-lg font-black">D</span>
              <div className="leading-tight text-white">
                <span className="font-bold">Dica de Tattoo</span>
                <span className="block text-xs font-normal text-gray-400 hidden sm:block">Financeiro</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink 
                  target="dashboard" 
                  label="Visão Geral" 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  } 
                />
                <NavLink 
                  target="transactions" 
                  label="Lançamentos" 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  } 
                />
                <NavLink 
                  target="commissions" 
                  label="Comissões" 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  } 
                />
                <NavLink 
                  target="reports" 
                  label="Relatórios" 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  } 
                />
              </div>
            </div>

            {/* Mobile Action */}
            <div className="md:hidden">
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-gray-800 text-white p-2 rounded-full shadow-md active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header (Breadcrumb & Actions) */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-20 md:static md:top-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
               <h1 className="text-xl md:text-2xl font-bold text-gray-900 capitalize tracking-tight leading-7">
                  {view === 'dashboard' && 'Painel de Controle'}
                  {view === 'transactions' && 'Lançamentos'}
                  {view === 'commissions' && 'Comissões de Vendas'}
                  {view === 'reports' && 'Relatórios'}
               </h1>
               <p className="mt-1 text-xs md:text-sm text-gray-500 hidden md:block">
                 {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </p>
            </div>
            
            <button
              onClick={() => setIsFormOpen(true)}
              className="hidden md:flex bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all items-center gap-2 transform active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        {view === 'dashboard' && <Dashboard transactions={transactions} summary={summary} />}
        {view === 'transactions' && (
          <TransactionList 
            // Exclude Commission expenses from the main list as requested
            transactions={transactions.filter(t => 
              !(t.category === 'Comercial' && t.subcategory === 'Comissão de Vendedores')
            )} 
            onDelete={deleteTransaction} 
            onEdit={handleEditTransaction}
            onToggleStatus={toggleStatus} 
          />
        )}
        {view === 'commissions' && (
          <Commissions 
            transactions={transactions} 
            receivers={receivers}
            onAddReceiver={addReceiver}
            onRemoveReceiver={removeReceiver}
            onLaunchCommission={launchCommission}
            onDeleteTransaction={deleteTransaction}
          />
        )}
        {view === 'reports' && <Reports transactions={transactions} />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          <MobileTab 
            target="dashboard" 
            label="Início" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>} 
          />
          <MobileTab 
            target="transactions" 
            label="Extrato" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>} 
          />
          
          {/* Central Add Button in Bottom Bar */}
          <div className="relative -top-5">
             <button
                onClick={() => setIsFormOpen(true)}
                className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-gray-50 active:scale-95 transition-transform"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
             </button>
          </div>

          <MobileTab 
            target="commissions" 
            label="Comissões" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>} 
          />
          <MobileTab 
            target="reports" 
            label="Relat." 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} 
          />
        </div>
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <TransactionForm
          onSave={handleSaveTransaction}
          onCancel={closeForm}
          initialData={editingTransaction}
        />
      )}
    </div>
  );
};

export default App;

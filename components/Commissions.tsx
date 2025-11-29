
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, CommissionReceiver } from '../types';
import { generateUUID } from '../utils';

interface CommissionsProps {
  transactions: Transaction[];
  receivers: CommissionReceiver[];
  onAddReceiver: (receiver: CommissionReceiver) => void;
  onRemoveReceiver: (id: string) => void;
  onLaunchCommission: (expense: Omit<Transaction, 'id'>, sourceTransactionIds: string[]) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Commissions: React.FC<CommissionsProps> = ({ 
  transactions, 
  receivers, 
  onAddReceiver, 
  onRemoveReceiver,
  onLaunchCommission,
  onDeleteTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'team' | 'history'>('calculator');
  
  // State for Calculator
  const [selectedReceiverId, setSelectedReceiverId] = useState<string>('');
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [customRate, setCustomRate] = useState<string>(''); 

  // State for New Team Member
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Vendedor');
  const [newRate, setNewRate] = useState('10');

  // State for Confirmation Modal (Launch)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCommission, setPendingCommission] = useState<{
    receiver: CommissionReceiver;
    amount: number;
    count: number;
    formattedValue: string;
    ids: string[];
  } | null>(null);

  // State for Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Vendas disponíveis para comissão
  const eligibleSales = useMemo(() => {
    return transactions.filter(t => 
      t.type === TransactionType.INCOME && 
      (t.category === 'Receitas' || t.subcategory.includes('Venda') || t.subcategory.includes('Matrícula')) &&
      !t.commissionPaid
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Histórico de Comissões (Filtro por categoria e subcategoria específicas)
  const commissionHistory = useMemo(() => {
    return transactions.filter(t => 
      t.type === TransactionType.EXPENSE && 
      t.category === 'Comercial' && 
      t.subcategory === 'Comissão de Vendedores'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Derived receiver
  const selectedReceiver = receivers.find(r => r.id === selectedReceiverId);

  // Handlers
  const handleToggleTransaction = (id: string) => {
    const newSet = new Set(selectedTransactionIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTransactionIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedTransactionIds.size === eligibleSales.length) {
      setSelectedTransactionIds(new Set());
    } else {
      setSelectedTransactionIds(new Set(eligibleSales.map(t => t.id)));
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRate) return;
    onAddReceiver({
      id: generateUUID(),
      name: newName,
      role: newRole,
      defaultRate: parseFloat(newRate)
    });
    setNewName('');
    setNewRate('10');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- Logic for Launching Commission ---

  const handleGenerateExpenseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Verificar Colaborador
    if (!selectedReceiverId) {
      alert("⚠️ Selecione um membro da equipe primeiro.");
      return;
    }

    const receiver = receivers.find(r => r.id === selectedReceiverId);
    if (!receiver) return;

    // 2. Verificar Vendas
    const selectedIds = Array.from(selectedTransactionIds);
    if (selectedIds.length === 0) {
      alert("⚠️ Nenhuma venda selecionada para calcular.");
      return;
    }

    // 3. Calcular Totais
    const rate = customRate && !isNaN(parseFloat(customRate)) 
      ? parseFloat(customRate) 
      : receiver.defaultRate;

    let totalSalesBase = 0;
    selectedIds.forEach(id => {
      const t = transactions.find(tr => tr.id === id);
      if (t) totalSalesBase += t.amount;
    });

    const commissionValue = totalSalesBase * (rate / 100);
    const formattedValue = commissionValue.toFixed(2);

    // 4. Setar dados pendentes e abrir modal
    setPendingCommission({
      receiver,
      amount: parseFloat(formattedValue),
      count: selectedIds.length,
      formattedValue: formattedValue,
      ids: selectedIds
    });
    setShowConfirmModal(true);
  };

  const confirmLaunch = () => {
    if (!pendingCommission) return;

    const today = new Date().toISOString().split('T')[0];
    
    const expense: Omit<Transaction, 'id'> = {
      description: `Comissão - ${pendingCommission.receiver.name}`,
      amount: pendingCommission.amount,
      type: TransactionType.EXPENSE,
      category: 'Comercial',
      subcategory: 'Comissão de Vendedores',
      date: today,
      dueDate: today,
      status: 'PENDING',
      commissionPaid: false
    };

    onLaunchCommission(expense, pendingCommission.ids);
    
    // Limpar e fechar
    setSelectedTransactionIds(new Set());
    setPendingCommission(null);
    setShowConfirmModal(false);
    setActiveTab('history'); // Redireciona para o histórico
  };

  const cancelLaunch = () => {
    setPendingCommission(null);
    setShowConfirmModal(false);
  };

  // --- Logic for Deleting Commission ---

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete);
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  // Cálculo para exibição apenas (visual na tela)
  const displaySummary = useMemo(() => {
     const rate = customRate && !isNaN(parseFloat(customRate)) 
      ? parseFloat(customRate) 
      : (selectedReceiver?.defaultRate || 0);
      
     let total = 0;
     selectedTransactionIds.forEach(id => {
       const t = transactions.find(tr => tr.id === id);
       if (t) total += t.amount;
     });

     return {
       totalSales: total,
       commission: total * (rate / 100),
       count: selectedTransactionIds.size
     };
  }, [selectedTransactionIds, customRate, selectedReceiver, transactions]);

  return (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-0 relative">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Comissões</h2>
            <p className="text-gray-500 text-sm">Controle de pagamentos para vendedores e parceiros.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'calculator' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Apuração
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'team' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Equipe
            </button>
          </div>
        </div>

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="animate-fade-in">
             <form onSubmit={handleAddMember} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
               <div className="flex-1 w-full">
                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Nome</label>
                 <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 outline-none text-black bg-white"
                    placeholder="Ex: João Silva"
                    required
                 />
               </div>
               <div className="w-full md:w-40">
                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Função</label>
                 <select 
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 outline-none bg-white text-black"
                 >
                   <option value="Vendedor" className="text-black bg-white">Vendedor</option>
                   <option value="Gestor" className="text-black bg-white">Gestor</option>
                   <option value="Líder" className="text-black bg-white">Líder</option>
                   <option value="Parceiro" className="text-black bg-white">Parceiro</option>
                 </select>
               </div>
               <div className="w-full md:w-32">
                 <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Comissão (%)</label>
                 <input 
                    type="number" 
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 outline-none text-black bg-white"
                    placeholder="10"
                    required
                 />
               </div>
               <button type="submit" className="w-full md:w-auto px-6 py-2 bg-gray-900 text-white font-bold rounded hover:bg-black transition-colors">
                 Adicionar
               </button>
             </form>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receivers.map(r => (
                  <div key={r.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-gray-800">{r.name}</h4>
                      <p className="text-xs text-gray-500">{r.role} &bull; {r.defaultRate}% Padrão</p>
                    </div>
                    <button 
                      onClick={() => onRemoveReceiver(r.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Remover"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.164a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
                {receivers.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">Nenhum membro cadastrado.</p>}
             </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="animate-fade-in">
             <div className="flex flex-col gap-4">
                {commissionHistory.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    Nenhuma comissão lançada ainda.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Valor</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {commissionHistory.map(t => (
                              <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.description}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {t.status === 'PAID' ? 'Pago' : 'Pendente'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{formatCurrency(t.amount)}</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDeleteClick(t.id)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                    title="Excluir"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.164a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                       {commissionHistory.map(t => (
                         <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div>
                               <p className="text-xs text-gray-500 mb-1">{new Date(t.date).toLocaleDateString()}</p>
                               <p className="font-bold text-gray-800 text-sm mb-1">{t.description}</p>
                               <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {t.status === 'PAID' ? 'Pago' : 'Pendente'}
                               </span>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-bold text-red-600 mb-2">{formatCurrency(t.amount)}</p>
                               <button
                                    onClick={() => handleDeleteClick(t.id)}
                                    className="text-gray-400 hover:text-red-500 p-2 bg-gray-50 rounded-full"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.164a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </>
                )}
             </div>
          </div>
        )}

        {/* CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="animate-fade-in flex flex-col h-full">
            {receivers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">Cadastre sua equipe para começar.</p>
                <button onClick={() => setActiveTab('team')} className="text-blue-600 font-bold hover:underline">Ir para Equipe</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-end border-b border-gray-100 pb-6">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selecione o Membro</label>
                    <select 
                      value={selectedReceiverId}
                      onChange={(e) => {
                        setSelectedReceiverId(e.target.value);
                        setCustomRate('');
                        setSelectedTransactionIds(new Set());
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none bg-white text-black font-medium"
                    >
                      <option value="" className="text-gray-500">-- Selecione --</option>
                      {receivers.map(r => (
                        <option key={r.id} value={r.id} className="text-black">{r.name} - {r.role} ({r.defaultRate}%)</option>
                      ))}
                    </select>
                  </div>
                  {selectedReceiver && (
                    <div className="w-full md:w-48">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Taxa (%)</label>
                      <input 
                        type="number"
                        value={customRate !== '' ? customRate : selectedReceiver.defaultRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none font-bold text-black bg-white"
                      />
                    </div>
                  )}
                </div>

                {selectedReceiver ? (
                  <>
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700">Vendas Pendentes de Comissão</h3>
                        <button onClick={handleSelectAll} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                          {selectedTransactionIds.size === eligibleSales.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                     </div>

                     <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[400px] overflow-y-auto bg-white">
                        {eligibleSales.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 bg-gray-50">Não há vendas pendentes.</div>
                        ) : (
                          <table className="w-full text-left">
                             <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                               <tr>
                                 <th className="px-4 py-3 w-10 text-center">
                                    <input 
                                      type="checkbox" 
                                      onChange={handleSelectAll}
                                      checked={eligibleSales.length > 0 && selectedTransactionIds.size === eligibleSales.length}
                                      className="w-4 h-4 cursor-pointer"
                                    />
                                 </th>
                                 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                                 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                                 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Valor</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                               {eligibleSales.map(t => (
                                 <tr 
                                  key={t.id} 
                                  className={`hover:bg-blue-50 cursor-pointer ${selectedTransactionIds.has(t.id) ? 'bg-blue-50/50' : ''}`}
                                  onClick={() => handleToggleTransaction(t.id)}
                                 >
                                   <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                      <input 
                                        type="checkbox" 
                                        checked={selectedTransactionIds.has(t.id)}
                                        onChange={() => handleToggleTransaction(t.id)}
                                        className="w-4 h-4 cursor-pointer"
                                      />
                                   </td>
                                   <td className="px-4 py-3 text-sm text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                                   <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.description}</td>
                                   <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">{formatCurrency(t.amount)}</td>
                                 </tr>
                               ))}
                             </tbody>
                          </table>
                        )}
                     </div>

                     <div className="bg-gray-900 text-white p-6 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg">
                        <div className="mb-4 md:mb-0">
                          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Resumo da Apuração</p>
                          <div className="flex gap-6">
                             <div>
                               <span className="block text-2xl font-bold">{displaySummary.count}</span>
                               <span className="text-xs text-gray-400">Vendas</span>
                             </div>
                             <div>
                               <span className="block text-2xl font-bold">{formatCurrency(displaySummary.totalSales)}</span>
                               <span className="text-xs text-gray-400">Base Calc.</span>
                             </div>
                          </div>
                        </div>

                        <div className="text-right w-full md:w-auto">
                           <p className="text-gray-400 text-xs font-bold uppercase mb-1">Comissão a Pagar</p>
                           <p className="text-3xl font-bold text-green-400 mb-4">{formatCurrency(displaySummary.commission)}</p>
                           <button 
                             type="button"
                             onClick={handleGenerateExpenseClick}
                             className="w-full md:w-auto px-6 py-3 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg active:scale-95 transition-transform"
                           >
                             Lançar Comissão
                           </button>
                        </div>
                     </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg min-h-[200px]">
                     Selecione um membro da equipe acima.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL (Launch) */}
      {showConfirmModal && pendingCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirmar Lançamento?</h3>
              <p className="text-sm text-gray-500 mt-2 mb-4">
                Você está gerando uma saída de caixa.
              </p>
              
              <div className="bg-gray-50 w-full p-4 rounded-lg mb-6 text-left border border-gray-100">
                 <div className="flex justify-between mb-2">
                   <span className="text-xs text-gray-500 font-bold uppercase">Favorecido</span>
                   <span className="text-sm font-bold text-gray-800">{pendingCommission.receiver.name}</span>
                 </div>
                 <div className="flex justify-between mb-2">
                   <span className="text-xs text-gray-500 font-bold uppercase">Vendas Apuradas</span>
                   <span className="text-sm font-bold text-gray-800">{pendingCommission.count}</span>
                 </div>
                 <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                   <span className="text-xs text-gray-500 font-bold uppercase">Valor Total</span>
                   <span className="text-base font-bold text-green-600">R$ {pendingCommission.formattedValue}</span>
                 </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={cancelLaunch}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmLaunch}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL (Delete) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.164a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Excluir Comissão?</h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                Tem certeza que deseja remover este lançamento do histórico?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

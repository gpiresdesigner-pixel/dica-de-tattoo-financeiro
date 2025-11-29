
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, CATEGORIES_CONFIG, MAIN_CATEGORIES, PaymentStatus } from '../types';

interface TransactionFormProps {
  onSave: (t: Transaction | Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onCancel, initialData }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  // Category State
  const [category, setCategory] = useState(MAIN_CATEGORIES[1]);
  const [subcategory, setSubcategory] = useState('');
  
  // Date State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Status State
  const [status, setStatus] = useState<PaymentStatus>('PENDING');
  
  // Commission State
  const [commissionPaid, setCommissionPaid] = useState(false);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setSubcategory(initialData.subcategory);
      setDate(initialData.date);
      setDueDate(initialData.dueDate);
      setStatus(initialData.status);
      setCommissionPaid(initialData.commissionPaid || false);
    } else {
      // Defaults for new transaction
      setSubcategory(CATEGORIES_CONFIG[MAIN_CATEGORIES[1]][0]);
    }
  }, [initialData]);

  // Update subcategories when main category changes (only if not loading initial data to prevent overwrite)
  useEffect(() => {
    if (!initialData || category !== initialData.category) {
      const subs = CATEGORIES_CONFIG[category] || [];
      if (subs.length > 0) {
        setSubcategory(subs[0]);
      } else {
        setSubcategory('Geral');
      }
    }
  }, [category, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !dueDate) return;

    const transactionData = {
      description,
      amount: parseFloat(amount),
      type,
      category,
      subcategory,
      date,
      dueDate,
      status,
      commissionPaid: commissionPaid
    };

    if (initialData) {
      onSave({ ...transactionData, id: initialData.id });
    } else {
      onSave(transactionData);
    }
    
    // Clear
    setDescription('');
    setAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-800 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-white text-lg">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar bg-white">
          {/* Tipo de Transação */}
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Tipo de Movimentação</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-3 text-sm font-bold rounded-lg border shadow-sm transition-all ${
                  type === TransactionType.INCOME 
                    ? 'bg-green-600 border-green-700 text-white ring-2 ring-green-300 ring-offset-1' 
                    : 'bg-white border-gray-400 text-black hover:bg-gray-100'
                }`}
              >
                Receita (Entrada)
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-3 text-sm font-bold rounded-lg border shadow-sm transition-all ${
                  type === TransactionType.EXPENSE 
                    ? 'bg-red-600 border-red-700 text-white ring-2 ring-red-300 ring-offset-1' 
                    : 'bg-white border-gray-400 text-black hover:bg-gray-100'
                }`}
              >
                Despesa (Saída)
              </button>
            </div>
          </div>

          {/* Descrição e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-1">Descrição</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-shadow text-black bg-white placeholder-gray-500"
                placeholder="Ex: Pagamento Editor"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition-shadow text-black bg-white placeholder-gray-500"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Categoria Principal</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none bg-white text-black appearance-none"
                >
                  {MAIN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="text-black bg-white">{cat}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Subcategoria</label>
              <div className="relative">
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none bg-white text-black appearance-none"
                >
                  {(CATEGORIES_CONFIG[category] || []).map(sub => (
                    <option key={sub} value={sub} className="text-black bg-white">{sub}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Data Competência</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1 text-red-700">Vencimento</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-red-50 text-black"
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-2">Status do Pagamento</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  checked={status === 'PAID'} 
                  onChange={() => setStatus('PAID')}
                  className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm font-bold text-gray-800">Pago / Recebido</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  checked={status === 'PENDING'} 
                  onChange={() => setStatus('PENDING')}
                  className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm font-bold text-gray-800">Pendente</span>
              </label>
            </div>
          </div>

          {/* Status Commission (Only for Income) */}
          {type === TransactionType.INCOME && (
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
               <label className="flex items-center space-x-2 cursor-pointer">
                 <input 
                   type="checkbox"
                   checked={commissionPaid}
                   onChange={(e) => setCommissionPaid(e.target.checked)} 
                   className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                 />
                 <span className="text-sm text-gray-900 font-bold">Comissão Já Paga?</span>
               </label>
               <p className="text-xs text-gray-500 mt-1 pl-7">Marque se a comissão desta venda já foi contabilizada/paga em um lote anterior.</p>
             </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex space-x-3 border-t border-gray-200 mt-2 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-400 bg-white text-black rounded-lg hover:bg-gray-100 font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-black font-bold transition-colors shadow-lg active:transform active:scale-95"
            >
              {initialData ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

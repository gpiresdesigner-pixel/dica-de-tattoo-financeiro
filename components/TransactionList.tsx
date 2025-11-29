import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onToggleStatus: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit, onToggleStatus }) => {
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // State for Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Handlers
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      onDelete(transactionToDelete);
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  const handleEditClick = (e: React.MouseEvent, t: Transaction) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(t);
  };

  const handleToggleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleStatus(id);
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-200">
        <p className="text-gray-400 mb-4">Nenhuma transação encontrada.</p>
        <p className="text-sm text-gray-500">Clique em "Novo Lançamento" para começar.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20 md:pb-0 relative">
      
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria / Sub</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTransactions.map((t) => {
                const isOverdue = t.status === 'PENDING' && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0));
                
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                    <td className={`px-4 py-3 text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                      {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                      {isOverdue && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1 rounded">Vencido</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {t.description}
                      <div className="text-xs text-gray-400 font-light mt-0.5">Lanç: {new Date(t.date).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                          {t.category}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 pl-1 border-l-2 border-gray-200">
                          {t.subcategory}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${
                      t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        type="button"
                        onClick={(e) => handleToggleClick(e, t.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          t.status === 'PAID' 
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
                        }`}
                      >
                        {t.status === 'PAID' ? 'Pago' : 'Pendente'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(e, t)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-2 cursor-pointer"
                          title="Editar"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                           </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, t.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 cursor-pointer"
                          title="Excluir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.164a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-4">
        {sortedTransactions.map((t) => {
           const isOverdue = t.status === 'PENDING' && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0));
           return (
            <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        t.type === TransactionType.INCOME ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                     }`}>
                       {t.type === TransactionType.INCOME ? 'Entrada' : 'Saída'}
                     </span>
                     <span className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mt-1">{t.description}</h4>
                  <p className="text-xs text-gray-500">{t.category} &bull; {t.subcategory}</p>
                </div>
                <div className="text-right">
                   <p className={`font-bold text-lg ${
                      t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {t.amount.toFixed(2)}
                   </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Vencimento</span>
                  <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                    {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                    {isOverdue && ' (!)'}
                  </span>
                </div>

                <div className="flex gap-2">
                   <button 
                    type="button"
                    onClick={(e) => handleToggleClick(e, t.id)}
                    className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      t.status === 'PAID' 
                        ? 'bg-green-600 text-white border-green-600' 
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {t.status === 'PAID' ? 'Pago' : 'Pagar'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleEditClick(e, t)}
                    className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:text-blue-700 cursor-pointer"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                     </svg>
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleDeleteClick(e, t.id)}
                    className="p-2 text-gray-400 bg-gray-50 rounded-lg hover:text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
           );
        })}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.164a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Excluir Transação?</h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                Tem certeza que deseja remover este lançamento? Esta ação não pode ser desfeita.
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
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
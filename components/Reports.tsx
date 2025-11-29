import React from 'react';
import { Transaction, TransactionType } from '../types';

interface ReportsProps {
  transactions: Transaction[];
}

export const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const downloadCSV = () => {
    const headers = ['Vencimento', 'Status', 'Descrição', 'Categoria', 'Subcategoria', 'Tipo', 'Valor', 'Data Lançamento'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        t.dueDate,
        t.status,
        `"${t.description}"`, 
        t.category,
        t.subcategory,
        t.type,
        t.amount.toFixed(2),
        t.date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DicaDeTattoo_Financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const paidExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.status === 'PAID')
      .reduce((sum, t) => sum + t.amount, 0);

    const html = `
      <html>
        <head>
          <title>Relatório - Dica de Tattoo</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            h1 { color: #111; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f9f9f9; font-weight: bold; text-transform: uppercase; }
            .summary-box { display: flex; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; }
            .val { font-size: 18px; font-weight: bold; margin-top: 5px; }
            .green { color: #10B981; }
            .red { color: #EF4444; }
          </style>
        </head>
        <body>
          <h1>Dica de Tattoo - Relatório Financeiro</h1>
          <p class="meta">Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
          
          <div class="summary-box">
            <div class="card">
              <div>Total Receitas</div>
              <div class="val green">R$ ${totalIncome.toFixed(2)}</div>
            </div>
            <div class="card">
              <div>Total Despesas</div>
              <div class="val red">R$ ${totalExpense.toFixed(2)}</div>
            </div>
             <div class="card">
              <div>Despesas Pagas</div>
              <div class="val">R$ ${paidExpense.toFixed(2)}</div>
            </div>
            <div class="card">
              <div>Resultado</div>
              <div class="val">R$ ${(totalIncome - totalExpense).toFixed(2)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${new Date(t.dueDate).toLocaleDateString()}</td>
                  <td>${t.status === 'PAID' ? 'PAGO' : 'PENDENTE'}</td>
                  <td>${t.description}</td>
                  <td>${t.category} <small>(${t.subcategory})</small></td>
                  <td style="color: ${t.type === 'INCOME' ? 'green' : 'red'}">
                    R$ ${t.amount.toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Central de Relatórios</h2>
      <p className="text-gray-500 mb-8 border-b pb-4">
        Exporte seus dados financeiros da Escola para análise de performance de anúncios e equipe.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-800 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={downloadCSV}>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.75m9.75-3V5.625a1.125 1.125 0 00-1.125-1.125h-17.25a1.125 1.125 0 00-1.125 1.125v13.5M3 3.75h18" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Planilha CSV</h3>
          <p className="text-sm text-gray-500 mt-2">Dados brutos incluindo subcategorias e datas de vencimento para Excel/Sheets.</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-800 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={printReport}>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Relatório PDF</h3>
          <p className="text-sm text-gray-500 mt-2">Documento formatado com totais de Entradas e Saídas para reunião ou contabilidade.</p>
        </div>
      </div>
    </div>
  );
};
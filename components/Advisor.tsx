import React, { useState } from 'react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AdvisorProps {
  transactions: Transaction[];
}

export const Advisor: React.FC<AdvisorProps> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            Consultor IA
          </h2>
          <p className="text-gray-600 mt-2">
            Receba insights inteligentes e sugestões de corte de gastos baseados no seu histórico real.
          </p>
        </div>
        
        <button
          onClick={handleGetAdvice}
          disabled={loading || transactions.length === 0}
          className={`px-6 py-3 rounded-lg font-medium shadow-md transition-all flex items-center gap-2 ${
            loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:from-purple-700 hover:to-indigo-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analisando...
            </>
          ) : (
            <>Gerar Análise</>
          )}
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 flex-grow overflow-auto prose prose-indigo max-w-none">
        {advice ? (
          <ReactMarkdown>{advice}</ReactMarkdown>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <p>Clique em "Gerar Análise" para obter consultoria personalizada.</p>
          </div>
        )}
      </div>
    </div>
  );
};
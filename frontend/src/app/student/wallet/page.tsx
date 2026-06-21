'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Wallet, Plus, ArrowDownToLine, ShoppingCart, History, QrCode, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Select amount, 2: Show QR

  const QUCIK_AMOUNTS = [50000, 100000, 200000, 500000];

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [balRes, transRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions')
      ]);
      if (balRes.data.success) {
        setBalance(balRes.data.balance);
      }
      if (transRes.data.success) {
        setTransactions(transRes.data.transactions);
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu ví.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!depositAmount || depositAmount < 10000) {
      toast.error('Vui lòng nhập số tiền hợp lệ (tối thiểu 10.000đ).');
      return;
    }
    setStep(2);
  };

  const handleConfirmDeposit = async () => {
    if (!depositAmount) return;
    
    const loadingToast = toast.loading('Đang xử lý giao dịch...');
    try {
      const res = await api.post('/wallet/deposit', { amount: Number(depositAmount) });
      if (res.data.success) {
        toast.success(`Nạp thành công ${Number(depositAmount).toLocaleString()} VNĐ!`, { id: loadingToast });
        setBalance(res.data.newBalance);
        setShowDepositModal(false);
        setStep(1);
        setDepositAmount('');
        // Refresh transactions
        fetchWalletData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi nạp tiền.', { id: loadingToast });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-3">
            <Wallet className="w-8 h-8 text-amber-500" />
            Ví của tôi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quản lý số dư và lịch sử giao dịch. MOCK PAYMENT SYSTEM - KHÔNG XỬ LÝ TIỀN THẬT.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col h-full justify-between relative z-10 space-y-8">
            <div>
              <p className="text-slate-400 font-medium mb-2 flex items-center gap-2">
                Số dư hiện tại
              </p>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                {balance.toLocaleString()} <span className="text-xl text-amber-500">VNĐ</span>
              </h2>
            </div>

            <Button
              onClick={() => { setShowDepositModal(true); setStep(1); setDepositAmount(''); }}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-bold">Nạp Tiền (Demo)</span>
            </Button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            Lịch sử giao dịch
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <History className="w-10 h-10 opacity-20" />
                <p className="text-sm">Chưa có giao dịch nào.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {tx.type === 'DEPOSIT' ? <ArrowDownToLine className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-medium">{tx.description}</p>
                      <p className="text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString()} đ
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in relative">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-xl font-bold text-white">Nạp tiền vào ví</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Alert Mock System */}
              <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Đây là hệ thống thanh toán giả lập phục vụ mục đích Demo. Vui lòng KHÔNG sử dụng ứng dụng ngân hàng thật để quét mã QR này.
                </p>
              </div>

              {step === 1 ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Chọn mệnh giá nạp:</label>
                    <div className="grid grid-cols-2 gap-3">
                      {QUCIK_AMOUNTS.map(amt => (
                        <button
                          key={amt}
                          onClick={() => setDepositAmount(amt)}
                          className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                            depositAmount === amt 
                            ? 'bg-amber-600/20 border-amber-500 text-amber-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {amt.toLocaleString()} đ
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Hoặc nhập số tiền khác:</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10000"
                        step="10000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                        placeholder="VD: 500000"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">VNĐ</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleNextStep}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold"
                  >
                    Tiếp tục
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  <div className="text-center space-y-1">
                    <p className="text-slate-400 text-sm">Quét mã QR để thanh toán</p>
                    <p className="text-2xl font-bold text-amber-400">{Number(depositAmount).toLocaleString()} VNĐ</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl shadow-lg">
                    <QRCodeSVG 
                      value={`EDUPATH-DEPOSIT-${user?.id}-${depositAmount}-${Date.now()}`} 
                      size={200}
                      level={"H"}
                    />
                  </div>

                  <div className="w-full space-y-3 pt-4 border-t border-slate-800">
                    <Button
                      onClick={handleConfirmDeposit}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                    >
                      Tôi đã thanh toán (Demo)
                    </Button>
                    <Button
                      onClick={() => setStep(1)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl"
                    >
                      Quay lại
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import {
  Users, Plus, ArrowLeft, MessageCircle, Camera,
  TrendingUp, TrendingDown, ChevronRight,
  Search, Bell, X, Home, BookOpen, UserPlus,
  IndianRupee, CheckCircle, Clock, Send, AlertCircle
} from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  note: string;
  date: string;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  transactions: Transaction[];
  avatar: string;
  lastActivity: string;
}

type Screen = "home" | "customers" | "customer-detail" | "add-transaction" | "add-customer";
type Tab = "home" | "customers";

const initialCustomers: Customer[] = [
  {
    id: "1",
    name: "User 1",
    phone: "9876543210",
    balance: 4500,
    avatar: "U1",
    lastActivity: "2026-07-03",
    transactions: [
      { id: "t1", type: "debit", amount: 5000, note: "Grocery items — July batch", date: "2026-07-01" },
      { id: "t2", type: "credit", amount: 500, note: "Partial payment — cash", date: "2026-07-03" },
    ],
  },
  {
    id: "2",
    name: "User 2",
    phone: "9123456789",
    balance: 1200,
    avatar: "U2",
    lastActivity: "2026-07-02",
    transactions: [
      { id: "t3", type: "debit", amount: 2000, note: "Electronics repair", date: "2026-06-28" },
      { id: "t4", type: "credit", amount: 800, note: "UPI payment received", date: "2026-07-02" },
    ],
  },
  {
    id: "3",
    name: "User 3",
    phone: "9988776655",
    balance: 0,
    avatar: "U3",
    lastActivity: "2026-06-30",
    transactions: [
      { id: "t5", type: "debit", amount: 3000, note: "Monthly flour & rice supply", date: "2026-06-15" },
      { id: "t6", type: "credit", amount: 3000, note: "Full settlement — cash", date: "2026-06-30" },
    ],
  },
  {
    id: "4",
    name: "User 4",
    phone: "9876501234",
    balance: 8750,
    avatar: "U4",
    lastActivity: "2026-07-01",
    transactions: [
      { id: "t7", type: "debit", amount: 10000, note: "Home appliances advance", date: "2026-06-20" },
      { id: "t8", type: "credit", amount: 1250, note: "Cheque deposit", date: "2026-07-01" },
    ],
  },
  {
    id: "5",
    name: "User 5",
    phone: "9654321078",
    balance: -500,
    avatar: "U5",
    lastActivity: "2026-07-04",
    transactions: [
      { id: "t9", type: "credit", amount: 2000, note: "Overpayment — refund pending", date: "2026-07-04" },
      { id: "t10", type: "debit", amount: 1500, note: "Stationery items", date: "2026-07-04" },
    ],
  },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function formatAmount(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function AvatarCircle({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-xl" : "w-11 h-11 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-[#1B4332]/12 flex items-center justify-center font-bold text-[#1B4332] flex-shrink-0`}>
      {initials}
    </div>
  );
}

function BalancePill({ balance }: { balance: number }) {
  if (balance === 0) return <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Settled</span>;
  if (balance > 0) return <span className="text-xs font-semibold text-[#C0392B] bg-[#C0392B]/10 px-2.5 py-1 rounded-full">Due {formatAmount(balance)}</span>;
  return <span className="text-xs font-semibold text-[#1B6B3A] bg-[#1B6B3A]/10 px-2.5 py-1 rounded-full">Advance {formatAmount(balance)}</span>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [whatsappToast, setWhatsappToast] = useState(false);

  const [txType, setTxType] = useState<"credit" | "debit">("debit");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txImage, setTxImage] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
  const totalOutstanding = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const pendingCount = customers.filter((c) => c.balance > 0).length;
  const settledCount = customers.filter((c) => c.balance === 0).length;

  function goToCustomer(id: string) {
    setSelectedCustomerId(id);
    setScreen("customer-detail");
  }

  function handleAddTransaction() {
    if (!selectedCustomer || !txAmount) return;
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newTx: Transaction = {
      id: `t${Date.now()}`,
      type: txType,
      amount,
      note: txNote || (txType === "debit" ? "Amount given" : "Payment received"),
      date: new Date().toISOString().split("T")[0],
      imageUrl: txImage ?? undefined,
    };
    const delta = txType === "debit" ? amount : -amount;
    setCustomers((cs) =>
      cs.map((c) =>
        c.id === selectedCustomer.id
          ? { ...c, balance: c.balance + delta, transactions: [newTx, ...c.transactions], lastActivity: newTx.date }
          : c
      )
    );
    setTxAmount("");
    setTxNote("");
    setTxImage(null);
    setTxType("debit");
    setScreen("customer-detail");
  }

  function handleAddCustomer() {
    if (!newName.trim() || !newPhone.trim()) return;
    const initials = newName.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    setCustomers((cs) => [
      {
        id: `c${Date.now()}`,
        name: newName.trim(),
        phone: newPhone.trim(),
        balance: 0,
        avatar: initials,
        transactions: [],
        lastActivity: new Date().toISOString().split("T")[0],
      },
      ...cs,
    ]);
    setNewName("");
    setNewPhone("");
    setActiveTab("customers");
    setScreen("home");
  }

  function handleWhatsApp(customer: Customer) {
    const msg =
      customer.balance > 0
        ? `Namaskar ${customer.name} ji! 🙏\n\nAapka udhari ₹${customer.balance.toLocaleString("en-IN")} baaki hai. Kripya jaldi bhugtaan karein.\n\nDhanyawad! 🙏`
        : customer.balance < 0
        ? `Namaskar ${customer.name} ji! 🙏\n\nAapke paas ₹${Math.abs(customer.balance).toLocaleString("en-IN")} advance hai. Kabhi bhi aa sakte hain.\n\nDhanyawad! 🙏`
        : `Namaskar ${customer.name} ji! 🙏\n\nAapka account bilkul clear hai. Dhanyawad aapka sahyog ke liye! 🙏`;
    const url = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setWhatsappToast(true);
    setTimeout(() => setWhatsappToast(false), 3000);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setTxImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // ── Add Transaction ──
  if (screen === "add-transaction" && selectedCustomer) {
    return (
      <div className="min-h-screen bg-background font-[\'Noto_Sans\',sans-serif] flex flex-col max-w-sm mx-auto relative">
        <div className="bg-primary px-5 pt-12 pb-6 flex-shrink-0">
          <button
            onClick={() => setScreen("customer-detail")}
            className="flex items-center gap-1.5 text-primary-foreground/60 text-sm mb-5 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="text-primary-foreground text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            New Transaction
          </h1>
          <p className="text-primary-foreground/60 text-sm mt-1">{selectedCustomer.name}</p>
        </div>

        <div className="flex-1 px-5 py-6 space-y-6 overflow-y-auto pb-10">
          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Type</p>
            <div className="grid grid-cols-2 gap-2 bg-secondary rounded-2xl p-1.5">
              <button
                onClick={() => setTxType("debit")}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  txType === "debit"
                    ? "bg-[#C0392B] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp size={15} /> You Gave
              </button>
              <button
                onClick={() => setTxType("credit")}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  txType === "credit"
                    ? "bg-[#1B6B3A] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingDown size={15} /> You Got
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Amount</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground font-bold select-none">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-card border-2 border-border rounded-2xl pl-10 pr-4 py-4 text-3xl font-bold text-foreground focus:outline-none focus:border-[#1B4332] transition-colors placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Note</p>
            <input
              type="text"
              value={txNote}
              onChange={(e) => setTxNote(e.target.value)}
              placeholder="e.g. Grocery items, advance payment..."
              className="w-full bg-card border-2 border-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#1B4332] transition-colors"
            />
          </div>

          {/* Attach Image */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Attach Bill / Photo</p>
            {txImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img src={txImage} alt="Attached bill" className="w-full h-52 object-cover" />
                <button
                  onClick={() => setTxImage(null)}
                  className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/70 transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                  <p className="text-white text-xs font-medium">Bill attached</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#1B4332]/25 rounded-2xl py-10 flex flex-col items-center gap-3 text-muted-foreground hover:border-[#1B4332]/50 hover:bg-[#1B4332]/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
                  <Camera size={22} className="text-[#1B4332]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#1B4332]">Tap to attach</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Bill, receipt, or photo</p>
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <button
            onClick={handleAddTransaction}
            disabled={!txAmount || parseFloat(txAmount) <= 0}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-[#163829] transition-colors active:scale-[0.98]"
          >
            Save Transaction
          </button>
        </div>
      </div>
    );
  }

  // ── Customer Detail ──
  if (screen === "customer-detail" && selectedCustomer) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
        {/* Header */}
        <div className="bg-primary px-5 pt-12 pb-6 flex-shrink-0">
          <button
            onClick={() => { setScreen("home"); setActiveTab("customers"); }}
            className="flex items-center gap-1.5 text-primary-foreground/60 text-sm mb-5 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft size={15} /> Customers
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/15 flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
              {selectedCustomer.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-primary-foreground text-xl font-bold truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {selectedCustomer.name}
              </h1>
              <p className="text-primary-foreground/60 text-sm mt-0.5">+91 {selectedCustomer.phone}</p>
            </div>
            <button
              onClick={() => handleWhatsApp(selectedCustomer)}
              className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#1db954] transition-colors active:scale-95"
            >
              <MessageCircle size={18} className="text-white" />
            </button>
          </div>

          {/* Balance */}
          <div className="mt-5 bg-primary-foreground/10 rounded-2xl p-5">
            <p className="text-primary-foreground/50 text-xs uppercase tracking-widest font-semibold">Outstanding Balance</p>
            <p
              className={`text-4xl font-bold mt-2 tabular-nums ${
                selectedCustomer.balance > 0 ? "text-[#FF7B7B]" : selectedCustomer.balance < 0 ? "text-[#74EAA0]" : "text-primary-foreground/50"
              }`}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {selectedCustomer.balance < 0 ? "-" : ""}₹{Math.abs(selectedCustomer.balance).toLocaleString("en-IN")}
            </p>
            <p className="text-primary-foreground/40 text-xs mt-1.5">
              {selectedCustomer.balance > 0
                ? "Customer owes you this amount"
                : selectedCustomer.balance < 0
                ? "You owe this amount to customer"
                : "All cleared — no dues"}
            </p>
          </div>
        </div>

        {/* Action Row */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3 flex-shrink-0">
          <button
            onClick={() => { setTxType("debit"); setScreen("add-transaction"); }}
            className="bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#C0392B]/15 transition-colors active:scale-[0.98]"
          >
            <TrendingUp size={15} /> You Gave
          </button>
          <button
            onClick={() => { setTxType("credit"); setScreen("add-transaction"); }}
            className="bg-[#1B6B3A]/10 border border-[#1B6B3A]/20 text-[#1B6B3A] rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1B6B3A]/15 transition-colors active:scale-[0.98]"
          >
            <TrendingDown size={15} /> You Got
          </button>
        </div>

        {/* Transactions */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Transaction History · {selectedCustomer.transactions.length}
          </p>
          {selectedCustomer.transactions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen size={36} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1">Add the first one above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCustomer.transactions.map((tx) => (
                <div key={tx.id} className="bg-card border border-border rounded-2xl p-4 hover:border-[#1B4332]/25 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          tx.type === "debit" ? "bg-[#C0392B]/12" : "bg-[#1B6B3A]/12"
                        }`}
                      >
                        {tx.type === "debit" ? (
                          <TrendingUp size={15} className="text-[#C0392B]" />
                        ) : (
                          <TrendingDown size={15} className="text-[#1B6B3A]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{tx.note}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-bold text-base tabular-nums ${tx.type === "debit" ? "text-[#C0392B]" : "text-[#1B6B3A]"}`}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {tx.type === "debit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  {tx.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      <img src={tx.imageUrl} alt="Bill" className="w-full h-36 object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp CTA */}
        {selectedCustomer.balance !== 0 && (
          <div className="px-5 pb-6 flex-shrink-0">
            <button
              onClick={() => handleWhatsApp(selectedCustomer)}
              className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-[#1db954] transition-colors active:scale-[0.98]"
            >
              <Send size={16} />
              {selectedCustomer.balance > 0 ? "Send Due Reminder on WhatsApp" : "Send Advance Notice on WhatsApp"}
            </button>
          </div>
        )}

        {/* Toast */}
        {whatsappToast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1B4332] text-primary-foreground px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-lg z-50">
            <CheckCircle size={16} className="text-[#74EAA0]" />
            WhatsApp message opened
          </div>
        )}
      </div>
    );
  }

  // ── Add Customer ──
  if (screen === "add-customer") {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
        <div className="bg-primary px-5 pt-12 pb-6 flex-shrink-0">
          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-1.5 text-primary-foreground/60 text-sm mb-5 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="text-primary-foreground text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Add New Customer
          </h1>
          <p className="text-primary-foreground/60 text-sm mt-1">Start tracking their ledger</p>
        </div>

        <div className="flex-1 px-5 py-7 space-y-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Full Name</p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. User 1"
              className="w-full bg-card border-2 border-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#1B4332] transition-colors"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Phone Number</p>
            <div className="flex gap-3">
              <div className="bg-card border-2 border-border rounded-2xl px-4 py-3.5 text-sm font-semibold text-muted-foreground flex-shrink-0">
                +91
              </div>
              <input
                type="tel"
                inputMode="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="9876543210"
                className="flex-1 bg-card border-2 border-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#1B4332] transition-colors"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-1">Used for WhatsApp reminders</p>
          </div>
          <button
            onClick={handleAddCustomer}
            disabled={!newName.trim() || !newPhone.trim()}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-[#163829] transition-colors active:scale-[0.98]"
          >
            Add Customer
          </button>
        </div>
      </div>
    );
  }

  // ── Home + Customers Tabs ──
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
      {/* Tab Content */}
      {activeTab === "home" ? (
        <>
          {/* Home Header */}
          <div className="bg-primary px-5 pt-12 pb-7 flex-shrink-0">
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-primary-foreground/50 text-xs uppercase tracking-[0.2em] font-semibold mb-1">Udhari</p>
                <h1 className="text-primary-foreground text-2xl font-bold leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Your Ledger
                </h1>
              </div>
              <div className="relative">
                <button className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Bell size={18} className="text-primary-foreground/70" />
                </button>
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#FF7B7B] text-white text-[10px] font-bold w-4.5 h-4.5 w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-primary-foreground/10 rounded-2xl p-3.5">
                <p className="text-primary-foreground/50 text-[11px] font-semibold">Total Due</p>
                <p className="text-[#FF7B7B] font-bold text-lg leading-tight mt-1 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                  ₹{totalOutstanding.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-primary-foreground/10 rounded-2xl p-3.5">
                <p className="text-primary-foreground/50 text-[11px] font-semibold">Customers</p>
                <p className="text-primary-foreground font-bold text-lg leading-tight mt-1 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {customers.length}
                </p>
              </div>
              <div className="bg-primary-foreground/10 rounded-2xl p-3.5">
                <p className="text-primary-foreground/50 text-[11px] font-semibold">Pending</p>
                <p className="text-[#E9C46A] font-bold text-lg leading-tight mt-1 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Dues */}
          <div className="flex-1 px-5 py-5 overflow-y-auto pb-24">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pending Dues</p>
              <button onClick={() => setActiveTab("customers")} className="text-xs text-[#1B4332] font-semibold">
                All customers →
              </button>
            </div>

            {pendingCount === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckCircle size={36} className="mx-auto mb-3 text-[#1B6B3A] opacity-40" />
                <p className="text-sm font-medium">All dues cleared!</p>
                <p className="text-xs mt-1">No pending payments right now</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customers
                  .filter((c) => c.balance > 0)
                  .sort((a, b) => b.balance - a.balance)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => goToCustomer(c.id)}
                      className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left hover:border-[#1B4332]/30 hover:shadow-sm transition-all active:scale-[0.99]"
                    >
                      <AvatarCircle initials={c.avatar} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {c.transactions[0]?.note ?? "No transactions"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#C0392B] font-bold text-sm tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{c.balance.toLocaleString("en-IN")}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <Clock size={10} className="text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{formatDate(c.lastActivity)}</p>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            {/* Settled customers */}
            {settledCount > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Recently Settled</p>
                <div className="space-y-2">
                  {customers
                    .filter((c) => c.balance === 0)
                    .slice(0, 2)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => goToCustomer(c.id)}
                        className="w-full bg-card/60 border border-border rounded-2xl px-4 py-3 flex items-center gap-3 text-left opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <AvatarCircle initials={c.avatar} size="sm" />
                        <p className="flex-1 text-sm font-medium truncate">{c.name}</p>
                        <span className="text-[10px] font-semibold text-[#1B6B3A] bg-[#1B6B3A]/10 px-2 py-0.5 rounded-full">Clear</span>
                        <ChevronRight size={13} className="text-muted-foreground" />
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Customers Header */}
          <div className="bg-primary px-5 pt-12 pb-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-primary-foreground text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Customers
              </h1>
              <button
                onClick={() => setScreen("add-customer")}
                className="w-10 h-10 bg-primary-foreground/15 rounded-full flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
              >
                <UserPlus size={18} className="text-primary-foreground" />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or number…"
                className="w-full bg-primary-foreground/12 text-primary-foreground placeholder:text-primary-foreground/35 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/25"
              />
            </div>
          </div>

          <div className="flex-1 px-4 py-4 overflow-y-auto space-y-2 pb-24">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Users size={36} className="mx-auto mb-3 opacity-25" />
                <p className="text-sm font-medium">No customers found</p>
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => goToCustomer(c.id)}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-3 text-left hover:border-[#1B4332]/25 hover:shadow-sm transition-all active:scale-[0.99]"
                >
                  <AvatarCircle initials={c.avatar} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.transactions.length} txn · +91 {c.phone}
                    </p>
                  </div>
                  <BalancePill balance={c.balance} />
                  <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-card border-t border-border px-6 pt-3 pb-5 flex justify-around z-40">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1.5 px-5 transition-colors ${
            activeTab === "home" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Home size={21} />
          <span className="text-[11px] font-semibold">Home</span>
        </button>
        <button
          onClick={() => { setActiveTab("customers"); setScreen("home"); }}
          className={`flex flex-col items-center gap-1.5 px-5 transition-colors ${
            activeTab === "customers" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Users size={21} />
          <span className="text-[11px] font-semibold">Customers</span>
        </button>
        <button
          onClick={() => setScreen("add-customer")}
          className="flex flex-col items-center gap-1.5 px-5 text-muted-foreground hover:text-primary transition-colors"
        >
          <div className="w-10 h-10 -mt-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Plus size={20} className="text-primary-foreground" />
          </div>
          <span className="text-[11px] font-semibold">Add</span>
        </button>
      </div>

      {/* Toast */}
      {whatsappToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1B4332] text-primary-foreground px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-lg z-50 whitespace-nowrap">
          <CheckCircle size={16} className="text-[#74EAA0]" />
          WhatsApp message opened
        </div>
      )}
    </div>
  );
}

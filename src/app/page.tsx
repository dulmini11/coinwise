"use client";

import { useState, useEffect, useMemo } from "react";
import expensesData from "../data/expenses.json";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { Home, Book, BarChart3, Menu, Moon, Sun, Calculator } from "lucide-react";
import Image from "next/image";
import cancel from "../../public/cancel.png"; 

export default function ExpensesPage() {
  // States
  const [activeTab, setActiveTab] = useState("all_expenses"); // Navigation state
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // New mobile state
  const [categories, setCategories] = useState<string[]>([
    "Food",
    "Travel",
    "Shopping",
  ]);
  const [category, setCategory] = useState<string>("All"); // for filtering
  const [newCategory, setNewCategory] = useState<string>("");

  const [sortBy, setSortBy] = useState("date");
  const [search, setSearch] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // New state for month selection
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const categoryIcons: Record<string, string> = {
    Shopping: "/icons/shopping.png",
    Food: "/icons/food.png",
    Travel: "/icons/transport.png",
    Education: "/icons/books.png",
    Housing: "/icons/house",
    Health:"/icons/health.png",
    Savings:"/icons/savings"
  };

  // Form state
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: "",
  });
  const [showForm, setShowForm] = useState(false);

  // Calculator states
  const [display, setDisplay] = useState<string>("0");
  const [overwrite, setOverwrite] = useState<boolean>(true);

  const buttons: Array<string> = [
    "C","DEL","%","/","7","8","9","*","4","5","6","-","1","2","3","+","+/-","0",".","=",];

  // Calculator keyboard support
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const key = e.key;
      if ((key >= "0" && key <= "9") || key === ".") handleInput(key);
      if (key === "+" || key === "-" || key === "*" || key === "/") handleInput(key);
      if (key === "Enter" || key === "=") handleInput("=");
      if (key === "Backspace") handleInput("DEL");
      if (key === "Escape") handleInput("C");
    }
    
    if (activeTab === "calculator") {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [display, overwrite, activeTab]);

  // Calculator input handler
  function handleInput(value: string) {
    if (value === "C") {
      setDisplay("0");
      setOverwrite(true);
      return;
    }

    if (value === "DEL") {
      setDisplay((d) => {
        if (overwrite || d.length === 1) {
          setOverwrite(true);
          return "0";
        }
        return d.slice(0, -1);
      });
      return;
    }

    if (value === "+/-") {
      setDisplay((d) => {
        if (d.startsWith("-")) {
          return d.slice(1);
        } else {
          return "-" + d;
        }
      });
      return;
    }

    if (value === "=") {
      try {
        const result = eval(display);
        setDisplay(result.toString());
        setOverwrite(true);
      } catch {
        setDisplay("Error");
        setOverwrite(true);
      }
      return;
    }

    if (["+", "-", "*", "/", "%"].includes(value)) {
      setDisplay((d) => d + value);
      setOverwrite(false);
      return;
    }

    if (value === ".") {
      if (display.includes(".")) return;
      setDisplay((d) => (overwrite ? "0." : d + "."));
      setOverwrite(false);
      return;
    }

    // Numbers
    if (overwrite) {
      setDisplay(value);
      setOverwrite(false);
    } else {
      setDisplay((d) => d + value);
    }
  }

  // Add new category
  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  // Load expenses from localStorage or fallback
  useEffect(() => {
    const stored = localStorage.getItem("expenses");
    if (stored) {
      setExpenses(JSON.parse(stored));
    } else {
      setExpenses(expensesData);
      localStorage.setItem("expenses", JSON.stringify(expensesData));
    }
  }, []);

  // Save expenses to localStorage on change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  // Remove expense
  const handleRemove = (id: number) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  // Add new expense
  const handleAddExpense = () => {
    if (!newExpense.title || !newExpense.amount || !newExpense.date) return;

    const id = Date.now(); // unique ID
    const expense = {
      id,
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
    };
    setExpenses((prev) => [expense, ...prev]);
    setNewExpense({ title: "", amount: "", category: "Food", date: "" });
    setShowForm(false);
  };

  // Filter + Search + Sort
  const filteredExpenses = useMemo(() => {
    let data = [...expenses];
    if (category !== "All")
      data = data.filter((exp) => exp.category === category);
    if (search)
      data = data.filter((exp) =>
        exp.title.toLowerCase().includes(search.toLowerCase())
      );
    if (sortBy === "date")
      data.sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    else if (sortBy === "amount") data.sort((a, b) => b.amount - a.amount);
    return data;
  }, [expenses, category, sortBy, search]);

  // Summary
  const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const highest = filteredExpenses.reduce(
    (max, exp) => (exp.amount > max ? exp.amount : max),
    0
  );

  // Chart Data
  const chartData = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    const uniqueCats = Array.from(
      new Set(filteredExpenses.map((e) => e.category))
    );
    uniqueCats.forEach((cat) => {
      const sum = filteredExpenses
        .filter((e) => e.category === cat)
        .reduce((acc, e) => acc + e.amount, 0);
      data.push({ name: cat, value: sum });
    });
    return data;
  }, [filteredExpenses]);

  // Get available months for dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse(); // Most recent first
  }, [expenses]);

  // Set default selected month
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Daily expenses data for selected month
  const dailyData = useMemo(() => {
    if (!selectedMonth) return [];

    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const dailyExpenses: { [key: string]: number } = {};

    // Initialize all days with 0
    for (let day = 1; day <= daysInMonth; day++) {
      dailyExpenses[day.toString()] = 0;
    }

    // Calculate daily totals for selected month
    expenses
      .filter((exp) => {
        const expDate = new Date(exp.date);
        const expMonthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
        return expMonthKey === selectedMonth;
      })
      .forEach((exp) => {
        const day = new Date(exp.date).getDate().toString();
        dailyExpenses[day] += exp.amount;
      });

    return Object.entries(dailyExpenses)
      .map(([day, amount]) => ({
        day: parseInt(day),
        amount: Math.round(amount)
      }))
      .sort((a, b) => a.day - b.day);
  }, [expenses, selectedMonth]);

  // Sidebar navigation items
  const sidebarItems = [
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "all_expenses", label: "All Expenses", icon: <Book size={20} /> },
    { id: "graph", label: "Graph", icon: <BarChart3 size={20} /> },
    { id: "calculator", label: "Calculator", icon: <Calculator size={20} /> },
  ];

  // Mobile sidebar close handler
  const handleMobileNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileSidebarOpen(false);
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center px-4 py-8">
              <div className="mb-6">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-500 bg-clip-text text-transparent mb-4">
                  Coin Wish
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Transform your financial dreams into reality. Track, analyze, and optimize your expenses with intelligent insights.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Start Tracking
                </button>
                <button
                  onClick={() => setActiveTab("graph")}
                  className="border-2 border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white font-semibold py-3 px-8 rounded-full transition-all duration-200"
                >
                  View Analytics
                </button>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
              <div className={`p-6 rounded-2xl shadow-lg border-l-4 border-purple-500 transform hover:scale-105 transition-all duration-200 ${
                darkMode ? "bg-black" : "bg-white"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-purple-600">Rs. {total.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-400/30 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl shadow-lg border-l-4 border-green-500 transform hover:scale-105 transition-all duration-200 ${
                darkMode ? "bg-black" : "bg-white"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rs. {expenses.filter(exp => {
                        const expDate = new Date(exp.date);
                        const now = new Date();
                        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
                      }).reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-400/30 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 transform hover:scale-105 transition-all duration-200 ${
                darkMode ? "bg-black" : "bg-white"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                    <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-400/30 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Expenses */}
            <div className={`mx-4 p-6 rounded-2xl shadow-lg ${darkMode ? "bg-black" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Recent Expenses</h3>
                <button
                  onClick={() => setActiveTab("all_expenses")}
                  className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
                >
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((exp) => (
                    <div key={exp.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                      darkMode ? "border-gray-700 hover:border-gray-600" : "border-gray-200 hover:border-gray-300"
                    } transition-colors cursor-pointer`}>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg">
                          <Image
                            src={categoryIcons[exp.category] || "/default.png"}
                            alt={exp.category}
                            width={20}
                            height={20}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-sm text-gray-500">{exp.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">Rs. {exp.amount}</p>
                        <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium mb-2">No expenses yet</h4>
                  <p className="text-gray-500 mb-4">Start tracking your expenses to see them here</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200"
                  >
                    Add First Expense
                  </button>
                </div>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? "bg-black" : "bg-white"}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-400/30 rounded-full">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold">Smart Analytics</h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get detailed insights into your spending patterns with interactive charts and graphs.
                </p>
                <button
                  onClick={() => setActiveTab("graph")}
                  className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                >
                  Explore Analytics
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? "bg-black" : "bg-white"}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-400/30 rounded-full">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold">Built-in Calculator</h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Quick calculations at your fingertips with our smart calculator feature.
                </p>
                <button
                  onClick={() => setActiveTab("calculator")}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  Use Calculator
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      
      case "graph":
        return (
          <div className="space-y-8">
            <div className="text-center px-4">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Daily Expenses Overview</h2>
              <p className="text-gray-600">Track your daily spending patterns</p>
            </div>

            {/* Month Selector */}
            <div className="flex justify-center mb-6 px-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-colors outline-none font-medium w-full max-w-sm ${
                  darkMode ? "bg-black text-white border-gray-600" : "bg-white text-gray-700"
                }`}
              >
                {availableMonths.map((month) => {
                  const [year, monthNum] = month.split('-');
                  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  });
                  return (
                    <option key={month} value={month}>
                      {monthName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Daily Line Chart */}
            <div className={`mx-4 p-4 md:p-6 rounded-2xl shadow border-1 ${
              darkMode ? "bg-black text-white" : "bg-white" 
            }`}>
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-center">
                Daily Expenses for {selectedMonth ? (() => {
                  const [year, month] = selectedMonth.split('-');
                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                })() : 'Selected Month'}
              </h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="day" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={10}
                      label={{ value: 'Day of Month', position: 'insideBottom', offset: -10, fontSize: 10 }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={10}
                      label={{ value: 'Amount (Rs)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        color: darkMode ? "#ffffff" : "#000000",
                        fontSize: "12px"
                      }}
                      formatter={(value) => [`Rs. ${value}`, "Amount"]}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, stroke: "#8b5cf6", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-20">No data available for this month.</p>
              )}
            </div>

            {/* Daily Bar Chart Alternative */}
            <div className={`mx-4 p-4 md:p-6 rounded-2xl shadow border-1 ${
              darkMode ? "bg-black text-white" : "bg-white" 
            }`}>
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-center">
                Daily Expenses Bar Chart
              </h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="day" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={10}
                      label={{ value: 'Day of Month', position: 'insideBottom', offset: -10, fontSize: 10 }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={10}
                      label={{ value: 'Amount (Rs)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        color: darkMode ? "#ffffff" : "#000000",
                        fontSize: "12px"
                      }}
                      formatter={(value) => [`Rs. ${value}`, "Amount"]}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-20">No data available for this month.</p>
              )}
            </div>

            {/* Daily Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-4">
              <div className={`p-4 md:p-6 rounded-2xl shadow text-center ${
                darkMode ? "bg-black text-white border border-blue-300" : "bg-blue-100"
              }`}>
                <h4 className="text-base md:text-lg font-semibold mb-2">Avg Daily</h4>
                <p className="text-lg md:text-2xl font-bold">
                  Rs. {dailyData.length > 0 ? Math.round(dailyData.reduce((sum, item) => sum + item.amount, 0) / dailyData.filter(item => item.amount > 0).length || 0) : 0}
                </p>
              </div>
              
              <div className={`p-4 md:p-6 rounded-2xl shadow text-center ${
                darkMode ? "bg-black text-white border border-green-300" : "bg-green-100"
              }`}>
                <h4 className="text-base md:text-lg font-semibold mb-2">Highest Day</h4>
                <p className="text-lg md:text-2xl font-bold">
                  Rs. {dailyData.length > 0 ? Math.max(...dailyData.map(item => item.amount)) : 0}
                </p>
              </div>
              
              <div className={`p-4 md:p-6 rounded-2xl shadow text-center ${
                darkMode ? "bg-black text-white border border-purple-300" : "bg-purple-100"
              }`}>
                <h4 className="text-base md:text-lg font-semibold mb-2">Days with Expenses</h4>
                <p className="text-lg md:text-2xl font-bold">{dailyData.filter(item => item.amount > 0).length}</p>
              </div>
            </div>
          </div>
        );
        
      case "calculator":
        return (
          <div className="w-full max-w-sm mx-auto p-4">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl p-4 md:p-6 relative overflow-hidden">
              
              {/* Title */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-indigo-400">🧮</span> Smart Calculator
                </h2>
                <span className="text-xs text-gray-400">v1.0</span>
              </div>

              {/* Display */}
              <div className="bg-black/70 backdrop-blur-lg text-right text-white text-2xl md:text-4xl font-mono rounded-xl p-4 md:p-5 min-h-[60px] md:min-h-[72px] flex items-center justify-end shadow-inner border border-white/10">
                <span className="break-words tracking-wide">{display || "0"}</span>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-4 gap-2 md:gap-3 mt-4 md:mt-6">
                {buttons.map((b) => {
                  const isOperator = ["+", "-", "*", "/"].includes(b);
                  const isEqual = b === "=";
                  const isClear = b === "C";
                  return (
                    <button
                      key={b}
                      onClick={() => handleInput(b)}
                      className={`py-3 md:py-4 rounded-xl text-base md:text-xl font-semibold transition-all transform hover:scale-105 shadow-md
                        ${
                          isEqual
                            ? "col-span-2 bg-indigo-500 text-white hover:bg-indigo-600"
                            : isClear
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : isOperator
                            ? "bg-gray-700 text-indigo-300 hover:bg-gray-600"
                            : "bg-gray-800 text-gray-100 hover:bg-gray-700"
                        }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>

              {/* Tip */}
              <div className="mt-4 md:mt-5 text-[10px] md:text-[11px] text-gray-500 text-center">
                💡 Use keyboard: numbers, + - * /, Enter (=), Backspace (DEL), Esc (AC)
              </div>
            </div>
          </div>
        );

      case "all_expenses":
      default:
        return (
          <>
      {/* Add Expense Modal */}
        {showForm && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div
            className={`rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in zoom-in-95 
              ${darkMode ? "bg-black text-white border border-gray-600" : "bg-white text-gray-700"}`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Expense +</h3>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-white hover:bg-opacity-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-purple-100 text-sm mt-1">Track your spending easily</p>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-5">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expense Title</label>
                <input
                  type="text"
                  placeholder="e.g., Coffee, Groceries, Gas"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 focus:border-purple-900 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-colors outline-none placeholder-gray-400"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rs</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                    className="w-full pl-8 pr-3 py-3 border-2 border-gray-200 focus:border-purple-900 focus:ring-2 focus:ring-purple-200 rounded-xl transition-colors outline-none placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Category Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                  className=" w-full border-2 border-gray-200 focus:border-purple-900 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-colors outline-none bg-gray/90"
                >
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Add New Category */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Create new category"
                    className="flex-1 border-2 border-gray-200 focus:border-purple-900 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-lg transition-colors outline-none placeholder-gray-400 text-sm"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="bg-gradient-to-r from-purple-900 to-purple-900 hover:from-purple-600 hover:to-purple-900 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-colors outline-none"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 pt-0 flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-green hover:border-red transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md text-sm"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 px-4 mt-7">
      <div
        className={`p-4 md:p-6 rounded-2xl shadow text-center transition-colors duration-300 border-2 ${
          darkMode ? "bg-black text-white border-blue-300" : "bg-blue-100 text-black border-transparent"
        }`}
      >
        <h2 className="text-base md:text-lg font-semibold">Total Expenses</h2>
        <p className="text-xl md:text-2xl font-bold">Rs. {total}</p>
      </div>

      <div
        className={`p-4 md:p-6 rounded-2xl shadow text-center transition-colors duration-300 border-2 ${
          darkMode ? "bg-black text-white border-green-300" : "bg-green-100 text-black border-transparent"
        }`}
      >
        <h2 className="text-base md:text-lg font-semibold">Highest Expense</h2>
        <p className="text-xl md:text-2xl font-bold">Rs.{highest}</p>
      </div>

      <div
        className={`p-4 md:p-6 rounded-2xl shadow text-center transition-colors duration-300 border-2 ${
          darkMode ? "bg-black text-white border-purple-300" : "bg-purple-100 text-black border-transparent"
        }`}
      >
        <h2 className="text-base md:text-lg font-semibold">Expense Count</h2>
        <p className="text-xl md:text-2xl font-bold">{filteredExpenses.length}</p>
      </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 items-stretch mb-6 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`border-2 border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-purple-100 p-3 rounded-xl transition-all duration-200 outline-none cursor-pointer font-medium shadow-sm ${
              darkMode ? "bg-black text-white border-gray-600" : "bg-white text-gray-700"
            }`}
          >
            <option value="All">All Categories</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`border-2 border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-purple-100 p-3 rounded-xl transition-all duration-200 outline-none cursor-pointer font-medium shadow-sm ${
              darkMode ? "bg-black text-white border-gray-600" : "bg-white text-gray-700"
            }`}
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>

          <div className="relative sm:col-span-2 lg:col-span-1">
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border-2 border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-purple-100 p-3 pl-10 rounded-xl transition-all duration-200 outline-none placeholder-gray-400 font-medium shadow-sm ${
                darkMode ? "bg-black text-white border-gray-600" : "bg-white text-gray-700"
              }`}
            />
            <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expenses Grid - Mobile Responsive Table */}
      <div className="mx-4 mb-8">
        {filteredExpenses.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl shadow-md border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead className={`${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                  <tr>
                    <th className="px-6 py-3 text-sm font-semibold">Icon</th>
                    <th className="px-6 py-3 text-sm font-semibold">Title</th>
                    <th className="px-6 py-3 text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-sm font-semibold">Amount</th>
                    <th className="px-6 py-3 text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-sm font-semibold">Price</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className={darkMode ? "bg-black" : "bg-white"}>
                  {filteredExpenses.map((exp: any) => (
                    <tr key={exp.id} className={`border-b transition ${darkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-200 hover:bg-gray-50"}`}>
                      <td className="px-6 py-4">
                        <Image
                          src={categoryIcons[exp.category] || "/default.png"}
                          alt={exp.category}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium">{exp.title}</td>
                      <td className="px-6 py-4">{exp.category}</td>
                      <td className="px-6 py-4 font-semibold">Rs.{exp.amount}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(exp.date).toDateString()}
                      </td>
                      <td className="px-6 py-4">Rs.{exp.price || exp.amount}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemove(exp.id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-4">
              {filteredExpenses.map((exp: any) => (
                <div key={exp.id} className={`p-4 rounded-xl shadow-md border transition-colors ${
                  darkMode ? "bg-black border-gray-600" : "bg-white border-gray-200"
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={categoryIcons[exp.category] || "/default.png"}
                        alt={exp.category}
                        width={32}
                        height={32}
                        className="rounded"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{exp.title}</h3>
                        <p className="text-sm text-gray-500">{exp.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(exp.id)}
                      className="text-red-500 hover:text-red-700 font-semibold text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold text-green-600">Rs. {exp.amount}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(exp.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={`text-center py-12 rounded-2xl shadow-md border ${
            darkMode ? "bg-black border-gray-600" : "bg-white border-gray-200"
          }`}>
            <p className="text-gray-500 text-lg">No expenses found.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-gradient-to-r from-purple-700 to-purple-950 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
            >
              Add Your First Expense
            </button>
          </div>
        )}
      </div>

      {/* Category Breakdown Chart */}
      <div className={`mx-4 p-4 md:p-6 rounded-2xl shadow border-1 ${
        darkMode ? "bg-black text-white" : "bg-white" 
      }`}>
        <h3 className="text-xl md:text-2xl font-semibold mb-4 text-center">
          Category Breakdown
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-12">No data to display.</p>
        )}
      </div>
          </>
        );
    }
  };

  return (
  <div
    className={`flex h-screen transition-colors duration-300 ${
      darkMode ? "bg-black text-white" : "bg-gray-50 text-black"
    }`}
  >
    {/* Mobile Header */}
    <div className={`lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 shadow-lg ${
      darkMode ? "bg-black border-b border-gray-700" : "bg-white border-b border-gray-200"
    }`}>
      <h1 className="text-xl font-bold">Expenses Tracker</h1>
      <div className="flex gap-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>

    {/* Mobile Sidebar Overlay */}
    {isMobileSidebarOpen && (
      <div className="lg:hidden fixed inset-0 z-50">
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
        <div className={`absolute left-0 top-0 bottom-0 w-64 shadow-lg ${
          darkMode ? "bg-black" : "bg-white"
        }`}>
          <div className="flex items-center justify-between p-6">
            <h1 className="text-xl font-bold">Expenses Tracker</h1>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-1 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMobileNavClick(item.id)}
                className={`w-full flex items-center p-4 transition-colors duration-200 ${
                  activeTab === item.id
                    ? darkMode
                      ? "bg-gray-700/40 text-white border-r-4 border-purple-500"
                      : "bg-purple-100 text-purple-900 border-r-4 border-purple-900"
                    : darkMode
                    ? "text-gray-300 hover:bg-gray-700/40"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="ml-3 font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4">
            <button
              onClick={() => {
                setShowForm(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              + Add Expense
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Desktop Sidebar */}
    <div
      className={`hidden lg:flex shadow-lg flex-col transition-all duration-300 ${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } ${isMinimized ? "w-20" : "w-64"}`}
    >
      <div className="flex items-center justify-between p-6">
        {!isMinimized && (
          <h1 className="text-xl font-bold">Expenses Tracker</h1>
        )}
        <div className="flex gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-300/30 transition"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded hover:bg-gray-300/30 dark:hover:bg-gray-700"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar Nav Items */}
      <nav className="mt-6 flex flex-col gap-1 flex-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center p-4 transition-colors duration-200 ${
              activeTab === item.id
                ? darkMode
                  ? "bg-gray-700/40 text-white border-r-4 border-purple-500"
                  : "bg-purple-100 text-purple-900 border-r-4 border-purple-900"
                : darkMode
                ? "text-gray-300 hover:bg-gray-700/40"
                : "text-gray-700/40 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!isMinimized && (
              <span className="ml-3 font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Add Expense Button at Desktop Sidebar Bottom */}
      <div className="mt-auto p-4">
        <button
          onClick={() => setShowForm(true)}
          className={`w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${
            isMinimized ? "px-2 text-xs" : ""
          }`}
        >
          {isMinimized ? "+" : "+ Add Expense"}
        </button>
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 overflow-y-auto pt-16 lg:pt-0 p-4 lg:p-8">
      {renderContent()}
    </div>
  </div>
  );
}
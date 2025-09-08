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
import { Home, Book, BarChart3, Menu, Moon, Sun } from "lucide-react";
import Image from "next/image";
import cancel from "../../public/cancel.png"; 


export default function ExpensesPage() {
  // States
  const [activeTab, setActiveTab] = useState("all_expenses"); // Navigation state
  const [isMinimized, setIsMinimized] = useState(false);
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

  // Form state
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: "",
  });
  const [showForm, setShowForm] = useState(false);

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
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="flex items-center justify-center h-96">
          </div>
        );
      
      case "graph":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Daily Expenses Overview</h2>
              <p className="text-gray-600">Track your daily spending patterns</p>
            </div>

            {/* Month Selector */}
            <div className="flex justify-center mb-6">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-colors outline-none font-medium min-w-[200px] ${
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
            <div className={`p-6 rounded-2xl shadow border-1 ${
              darkMode ? "bg-black text-white" : "bg-white" 
            }`}>
              <h3 className="text-2xl font-semibold mb-4 text-center">
                Daily Expenses for {selectedMonth ? (() => {
                  const [year, month] = selectedMonth.split('-');
                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                })() : 'Selected Month'}
              </h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="day" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={12}
                      label={{ value: 'Day of Month', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={12}
                      label={{ value: 'Amount (Rs)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        color: darkMode ? "#ffffff" : "#000000"
                      }}
                      formatter={(value) => [`Rs. ${value}`, "Amount"]}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-20">No data available for this month.</p>
              )}
            </div>

            {/* Daily Bar Chart Alternative */}
            <div className={`p-6 rounded-2xl shadow border-1 ${
              darkMode ? "bg-black text-white" : "bg-white" 
            }`}>
              <h3 className="text-2xl font-semibold mb-4 text-center">
                Daily Expenses Bar Chart
              </h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="day" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={12}
                      label={{ value: 'Day of Month', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      fontSize={12}
                      label={{ value: 'Amount (Rs)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        color: darkMode ? "#ffffff" : "#000000"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl shadow text-center ${
                darkMode ? "bg-black text-white border border-blue-300" : "bg-blue-100"
              }`}>
                <h4 className="text-lg font-semibold mb-2">Avg Daily</h4>
                <p className="text-2xl font-bold">
                  Rs. {dailyData.length > 0 ? Math.round(dailyData.reduce((sum, item) => sum + item.amount, 0) / dailyData.filter(item => item.amount > 0).length || 0) : 0}
                </p>
              </div>
              
              <div className={`p-6 rounded-2xl shadow text-center ${
                darkMode ? "bg-black text-white border border-green-300" : "bg-green-100"
              }`}>
                <h4 className="text-lg font-semibold mb-2">Highest Day</h4>
                <p className="text-2xl font-bold">
                  Rs. {dailyData.length > 0 ? Math.max(...dailyData.map(item => item.amount)) : 0}
                </p>
              </div>
              
              <div className={`p-6 rounded-2xl shadow text-center ${
                darkMode ? "bg-black text-white border border-purple-300" : "bg-purple-100"
              }`}>
                <h4 className="text-lg font-semibold mb-2">Days with Expenses</h4>
                <p className="text-2xl font-bold">{dailyData.filter(item => item.amount > 0).length}</p>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in zoom-in-95">
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
                  className="w-full border-2 border-gray-200 focus:border-purple-900 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-colors outline-none bg-white"
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
                className="flex-1 px-3 py-2 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
      <div
        className={`p-6 rounded-2xl shadow text-center transition-colors duration-300 border-2 ${
          darkMode ? "bg-black text-white border-blue-300" : "bg-blue-100 text-black border-transparent"
        }`}
      >
        <h2 className="text-lg font-semibold">Total Expenses</h2>
        <p className="text-2xl font-bold">Rs. {total}</p>
      </div>

      <div
        className={`p-6 rounded-2xl shadow text-center transition-colors duration-300 border-2 ${
          darkMode ? "bg-black text-white border-green-300" : "bg-green-100 text-black border-transparent"
        }`}
      >
        <h2 className="text-lg font-semibold">Highest Expense</h2>
        <p className="text-2xl font-bold">Rs.{highest}</p>
      </div>

      <div
        className={`p-6 rounded-2xl shadow text-center transition-colors duration-300 border-2 ${
          darkMode ? "bg-black text-white border-purple-300" : "bg-purple-100 text-black border-transparent"
        }`}
      >
        <h2 className="text-lg font-semibold">Expense Count</h2>
        <p className="text-2xl font-bold">{filteredExpenses.length}</p>
      </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-15">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border-2 border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-purple-100 p-3 rounded-xl transition-all duration-200 outline-none cursor-pointer font-medium text-gray-700 bg-white shadow-sm min-w-[160px]"
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
          className="border-2 border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-purple-100 p-3 rounded-xl transition-all duration-200 outline-none cursor-pointer font-medium text-gray-700 bg-white shadow-sm min-w-[140px]"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-2 border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-purple-100 p-3 pl-10 rounded-xl transition-all duration-200 outline-none placeholder-gray-400 font-medium text-gray-700 bg-white shadow-sm"
          />
          <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Expenses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col p-5 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 relative overflow-hidden"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l to-red-950 rounded-t-2xl"></div>

              {/*  Remove button */}
              <button
                onClick={() => handleRemove(exp.id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
              >
                <Image
                  src={cancel}
                  alt="Remove"
                  width={20}
                  height={20}
                  className="cursor-pointer"
                />
              </button>

              <h3 className="text-xl font-semibold text-gray-900 mt-2">{exp.title}</h3>
              <p className="text-sm font-medium text-gray-500 uppercase">{exp.category}</p>
              <p className="text-2xl font-bold mt-4 text-gray-800">Rs.{exp.amount}</p>
              <p className="text-sm text-gray-400 mt-2">
                {new Date(exp.date).toDateString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">No expenses found.</p>
        )}

          </div>
            <div className={`p-6 mt-12 rounded-2xl shadow border-1 ${
              darkMode ? "bg-black text-white" : "bg-white" }`}>
            <h3 className="text-2xl font-semibold mb-4 text-center">
                Category Breakdown
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
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
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">No data to display.</p>
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
    {/* Sidebar */}
    <div
      className={`shadow-lg flex flex-col transition-all duration-300 ${
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

      {/* Sidebar Nav Items */}
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

      {/* Add Expense Button at Sidebar Bottom */}
      <div className="mt-auto p-4">
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
        >
          + Add Expense
        </button>
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 p-8 overflow-y-auto">
      {renderContent()}
    </div>
  </div>
  );
}
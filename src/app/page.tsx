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
} from "recharts";
import Image from "next/image";
import cancel from "../../public/cancel.png"; 


export default function ExpensesPage() {
  // States
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

  return (
    <div className="font-sans min-h-screen p-8 space-y-8 bg-gray-50">
      {/* Page Title */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Expenses Tracker
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          {showForm ? "Cancel" : "Add Expense"}
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title"
              value={newExpense.title}
              onChange={(e) =>
                setNewExpense({ ...newExpense, title: e.target.value })
              }
              className="border p-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense({ ...newExpense, amount: e.target.value })
              }
              className="border p-2 rounded-lg"
            />
            <div>
              {/* Category Selector */}
              <select
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, category: e.target.value })
                }
                className="border p-2 rounded-lg w-full"
              >
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Add Category */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New Category"
                  className="border p-2 rounded-lg flex-1"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>

            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              className="border p-2 rounded-lg"
            />
          </div>
          <button
            onClick={handleAddExpense}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Add Expense
          </button>
        </div>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-15">
        <div className="bg-blue-100 p-6 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold">Total Expenses</h2>
          <p className="text-2xl font-bold">Rs. {total}</p>
        </div>

        <div className="bg-green-100 p-6 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold">Highest Expense</h2>
          <p className="text-2xl font-bold">Rs.{highest}</p>
        </div>

        <div className="bg-purple-100 p-6 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold">Expense Count</h2>
          <p className="text-2xl font-bold">{filteredExpenses.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-15">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded-lg"
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
          className="border p-2 rounded-lg"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>

        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg flex-1"
        />
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

      {/* Category Breakdown Chart */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4 text-center">
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
    </div>
  );
}

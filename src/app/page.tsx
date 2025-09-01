// app/expenses/page.tsx
"use client";
import { useState } from "react";
import expensesData from "../data/expenses.json";

export default function ExpensesPage() {
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [search, setSearch] = useState("");

  let filtered = category === "All"
    ? [...expensesData]
    : expensesData.filter((exp) => exp.category === category);

  if (search) {
    filtered = filtered.filter((exp) =>
      exp.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (sortBy === "date") {
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (sortBy === "amount") {
    filtered.sort((a, b) => b.amount - a.amount);
  }

  const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
  const highest = filtered.reduce(
    (max, exp) => (exp.amount > max ? exp.amount : max),
    0
  );
  const count = filtered.length;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-center">Expenses Tracker</h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded-lg"
        >
          <option value="All">All Categories</option>
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Shopping">Shopping</option>
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-6 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold">Total Expenses</h2>
          <p className="text-2xl font-bold">Rs. {total}</p>
        </div>

        <div className="bg-green-100 p-6 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold">Highest Expense</h2>
          <p className="text-2xl font-bold">Rs. {highest}</p>
        </div>

        <div className="bg-purple-100 p-6 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold">Expense Count</h2>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </div>

      {/* Expenses list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((exp) => (
            <div key={exp.id} className="bg-white p-5 rounded-2xl shadow">
              <h3 className="text-xl font-semibold">{exp.title}</h3>
              <p className="text-sm text-gray-500">{exp.category}</p>
              <p className="text-lg font-bold mt-2">Rs. {exp.amount}</p>
              <p className="text-xs text-gray-400">{new Date(exp.date).toDateString()}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">No expenses found.</p>
        )}
      </div>
    </div>
  );
}

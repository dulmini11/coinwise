// app/expenses/page.tsx
"use client";
import { useState } from "react";
import expensesData from "../data/expenses.json";

export default function ExpensesPage() {
  const [category, setCategory] = useState("All");

  const filtered = category === "All"
    ? expensesData
    : expensesData.filter((exp) => exp.category === category);

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
      <div className="flex gap-4 mb-4">
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
    </div>
  );
}
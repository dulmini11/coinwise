// app/expenses/page.tsx
"use client";
import { useState } from "react";
import expensesData from "../data/expenses.json";

export default function ExpensesPage() {
  const total = expensesData.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-center">Expenses Tracker</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-6 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold">Total Expenses</h2>
          <p className="text-2xl font-bold">Rs. {total}</p>
        </div>
      </div>
    </div>
  );
}

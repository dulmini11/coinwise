// API Route example (alternative to Server Actions)
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db/client"

// GET /api/transactions
export async function GET(request: NextRequest) {
  try {
    // In production, get userId from authentication session
    const userId = request.headers.get("x-user-id") || "demo-user"

    const transactions = await sql`
      SELECT 
        t.*,
        c.name as category_name,
        a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ${userId}
      ORDER BY t.date DESC
      LIMIT 50
    `

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo-user"
    const body = await request.json()

    const [transaction] = await sql`
      INSERT INTO transactions (
        user_id, account_id, category_id, amount, type, description, date
      )
      VALUES (
        ${userId},
        ${body.account_id},
        ${body.category_id || null},
        ${body.amount},
        ${body.type},
        ${body.description || null},
        ${body.date}
      )
      RETURNING *
    `

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}

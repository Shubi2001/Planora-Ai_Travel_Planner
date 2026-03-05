import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import { z } from "zod";

export const runtime = "nodejs";

const expenseSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  date: z.string().optional(),
  notes: z.string().optional(),
});

// GET — all expenses for a trip
export async function GET(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const expenses = await db.expense.findMany({
    where: { tripId: params.tripId },
    orderBy: { date: "desc" },
  });

  // Aggregate by category
  const totals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return successResponse({ expenses, totals, grandTotal });
}

// POST — add expense
export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const expense = await db.expense.create({
    data: {
      tripId: params.tripId,
      userId: session.user.id,
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
    },
  });
  return successResponse({ expense }, "Expense added", 201);
}

// DELETE — remove expense
export async function DELETE(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const expenseId = searchParams.get("expenseId");
  if (!expenseId) return errorResponse("expenseId required", 400);

  await db.expense.delete({
    where: { id: expenseId, userId: session.user.id },
  });
  return successResponse({}, "Expense removed");
}

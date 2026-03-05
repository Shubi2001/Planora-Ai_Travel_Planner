import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/utils/password";
import { successResponse, handleApiError, AppError } from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("An account with this email already exists", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
            tripsLimit: 3,
            aiCallsLimit: 10,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return successResponse({ user }, "Account created successfully", 201);
  } catch (err) {
    return handleApiError(err);
  }
}

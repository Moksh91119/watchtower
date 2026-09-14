import { db, users } from "@watchtower/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "@watchtower/shared";
export async function authRoutes(app) {
    app.post("/register", async (request, reply) => {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: "Invalid registration data",
                details: parsed.error.flatten(),
            });
        }
        const { email, name, password } = parsed.data;
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        if (existingUser.length > 0) {
            return reply.code(409).send({
                error: "Email already registered",
            });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const [user] = await db
            .insert(users)
            .values({
            email,
            name,
            passwordHash,
        })
            .returning({
            id: users.id,
            email: users.email,
            name: users.name,
        });
        const token = await app.jwt.sign({
            userId: user.id,
        });
        return reply.code(201).send({
            user,
            token,
        });
    });
    app.post("/login", async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: "Invalid login data",
                details: parsed.error.flatten(),
            });
        }
        const { email, password } = parsed.data;
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            return reply.code(401).send({
                error: "Invalid email or password",
            });
        }
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return reply.code(401).send({
                error: "Invalid email or password",
            });
        }
        const token = await app.jwt.sign({
            userId: user.id,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    });
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

type RegisterResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await api<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      setToken(data.token);
      router.push("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create account",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create your Watchtower account
          </h1>

          <p className="mt-2 text-muted-foreground">
            Start monitoring websites for meaningful changes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

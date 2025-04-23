"use client"

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function LandingNavbar() {
  const { isSignedIn } = useAuth()

  return (
    <nav className="p-4 bg-transparent flex items-center justify-between">
      <Link href="/" className="flex items-center">
        <h1 className="text-2xl font-bold text-primary">
          <Sparkles className="h-6 w-6 mr-2 inline-block" />
          AI Video Assistant
        </h1>
      </Link>
      <div className="flex items-center gap-x-2">
        {isSignedIn ? (
          <Link href="/dashboard">
            <Button variant="default">Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/sign-in">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="default">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

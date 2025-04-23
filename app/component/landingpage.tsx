"use client"

import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHero() {
  const { isSignedIn } = useAuth()

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-36">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Learn Faster with Voice-Powered Video Search
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Ask questions naturally and get directed to the exact moment in educational videos that answers your query.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full">
                  Get Started
                </Button>
              </Link>
            )}
            <Link href="#features">
              <Button variant="outline" size="lg" className="rounded-full">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
      </div>
    </div>
  )
}

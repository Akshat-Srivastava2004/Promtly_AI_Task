"use client"

import { Mic, Video, BookOpen, Upload, Clock, Brain } from "lucide-react"

const features = [
  {
    name: "Voice Queries",
    description: "Ask questions naturally using your voice and get instant answers.",
    icon: Mic,
  },
  {
    name: "Precise Timestamps",
    description: "Jump directly to the exact moment in videos that answers your question.",
    icon: Clock,
  },
  {
    name: "Smart AI Matching",
    description: "Our AI understands concepts, not just keywords, for better results.",
    icon: Brain,
  },
  {
    name: "Bulk Video Upload",
    description: "Admins can upload multiple videos at once with automatic processing.",
    icon: Upload,
  },
  {
    name: "Personalized Learning",
    description: "System learns from your queries to provide better recommendations over time.",
    icon: BookOpen,
  },
  {
    name: "High-Quality Playback",
    description: "Smooth video playback with advanced controls and features.",
    icon: Video,
  },
]

export function LandingFeatures() {
  return (
    <div id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Learn Smarter</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for efficient learning
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Our AI-powered platform makes finding information in educational videos as easy as asking a question.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

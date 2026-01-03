"use client"

import { useRouter } from "next/navigation"
import HeroPage from "@/components/hero-page"

export default function Home() {
  const router = useRouter()

  const handleEnterApp = () => {
    router.push('/search')
  }

  return <HeroPage onEnter={handleEnterApp} />
}

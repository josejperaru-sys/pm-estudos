'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ModuloPage() {
  const router = useRouter()
  const { moduleId } = useParams()
  useEffect(() => { router.push('/dashboard') }, [])
  return null
}

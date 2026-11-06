'use client'
// the meeting only runs in a browser (webgl, the camera, audio): no server render
import dynamic from 'next/dynamic'
const Meet = dynamic(() => import('@/meet/ui/Meet'), { ssr: false })
export default function MeetClient({ fonts }: { fonts: string }) { return <Meet fonts={fonts} /> }

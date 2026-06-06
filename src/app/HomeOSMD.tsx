'use client';

import dynamic from 'next/dynamic';

const OSMDWrapper = dynamic(() => import('@/components/OSMDWrapper'), { ssr: false });

export default function HomeOSMD({ file }: { file: string }) {
  return <OSMDWrapper file={file} />;
}

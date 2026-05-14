'use client';

import { usePathname } from 'next/navigation';
import LanguageSelector from '@/components/header/LanguageSelector';
import AIAssistant from '@/components/header/AIAssistant';

function isHiddenPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/retroville') ||
    pathname.startsWith('/dev-retroville')
  );
}

export default function FloatingActionDock() {
  const pathname = usePathname() || '/';

  if (isHiddenPath(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[85] flex justify-center px-3 md:bottom-4 md:justify-end md:px-4">
      <div className="pointer-events-auto flex max-w-[calc(100vw-1rem)] items-center gap-2 rounded-[1.1rem] border border-line/80 bg-[rgba(8,14,25,0.88)] p-1.5 shadow-[0_16px_40px_rgba(2,8,18,0.42)] backdrop-blur-xl sm:max-w-[calc(100vw-1.5rem)] sm:p-2">
        <LanguageSelector
          placement="bottom"
          className="shrink-0"
          buttonClassName="h-11 min-w-0 px-3 sm:h-auto sm:min-w-[92px] sm:px-4"
        />
        <AIAssistant triggerClassName="h-11 w-11 justify-center px-0 sm:h-auto sm:w-auto sm:px-4" />
      </div>
    </div>
  );
}

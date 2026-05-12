"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { useState, useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    startTransition(() => {
      // Replace the current path with the same path, but in the new locale
      router.replace(pathname, { locale: newLocale });
      setIsOpen(false);
    });
  };

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Globe className="w-4 h-4 mr-2" />
          {locale === 'en' ? 'English' : 'Tiếng Việt'}
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
          <div className="py-1">
            <button
              onClick={() => switchLanguage('vi')}
              className={`${
                locale === 'vi' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
              } group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => switchLanguage('en')}
              className={`${
                locale === 'en' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
              } group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

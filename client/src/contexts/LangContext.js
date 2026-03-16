import { createContext, useContext, useState, useEffect } from 'react';
import translations from '../i18n/translations';

const LangContext = createContext(null);

export const useLang = () => useContext(LangContext);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const dir = translations[lang]?.dir || 'ltr';

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [lang, dir]);

  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'ar' : 'en'));

  return (
    <LangContext.Provider value={{ lang, t, dir, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

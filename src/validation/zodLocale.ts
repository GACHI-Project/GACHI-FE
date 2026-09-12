import { z } from 'zod';
import { LanguageType } from '../types/language';

// zod는 중국어를 지역별로 제공하므로 앱의 zh를 zhCN에 매핑
const ZOD_LOCALES: Record<LanguageType, typeof z.locales.ko> = {
  ko: z.locales.ko,
  en: z.locales.en,
  vi: z.locales.vi,
  zh: z.locales.zhCN,
};

// 커스텀 메시지를 지정하지 않은 스키마의 zod 기본 문구도 현재 언어로 노출되게 한다
export const applyZodLocale = (lang: string): void => {
  const locale = ZOD_LOCALES[lang as LanguageType] ?? ZOD_LOCALES.ko;
  z.config(locale());
};

import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'ko'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default getRequestConfig(async ({ requestLocale }: { requestLocale: Promise<any> }) => {
  // This typically handles validation of the locale
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    locale = 'ko';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

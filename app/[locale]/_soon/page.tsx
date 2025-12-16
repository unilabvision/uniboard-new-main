import Link from "next/link";

// Dynamic always active
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Type definition: params should contain a Promise
interface SoonPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Soon({ params }: SoonPageProps) {
  // Resolve params with await
  const { locale } = await params;

  // Check valid language, use 'tr' as fallback
  const safeLocale = locale === 'tr' || locale === 'en' ? locale : 'tr';

  return (
    <div className="relative  flex items-center ">
      {/* Main Section */}
      <section className="relative w-full py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
          <div className="max-w-3xl">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#a90013]/20 rounded-md blur-3xl animate-pulse-slow opacity-50"></div>
            <div className="transform hover:scale-105 transition-transform duration-300 inline-block mb-4">
              <span className="bg-[#ffdee2] text-[#a90013] dark:bg-[#a90013]/50 dark:text-[#ffdee2] px-4 py-1.5 text-xs font-medium tracking-wider inline-block shadow-md backdrop-blur-sm rounded-md">
                {safeLocale === 'tr' ? 'YAKINDA HAZIR' : 'COMING SOON'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#141414] dark:text-white mt-4 mb-6 leading-tight animate-fade-in">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#141414] to-[#a90013] dark:from-white dark:to-[#ffdee2]">
                {safeLocale === 'tr' 
                  ? 'Bu Sayfa Çok Yakında Hazır!' 
                  : 'This Page Will Be Ready Soon!'}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mb-8 animate-fade-in-delayed">
              {safeLocale === 'tr' 
                ? 'Bu bölümü titizlikle hazırlıyoruz. Yeni içerikler ve özellikler için sabırsızlanıyoruz!' 
                : 'We’re carefully preparing this section. We can’t wait to share new content and features!'}
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-delayed-more">
              <Link 
                href={`/${safeLocale}/`}
                className="relative bg-[#a90013] hover:bg-[#8a0010] dark:bg-[#a90013] dark:hover:bg-[#8a0010] text-white py-3 px-8 rounded-md text-md font-medium inline-flex items-center flex-shrink-0 w-fit transform hover:-translate-y-1 transition-all duration-300"
              >
                <span>{safeLocale === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}</span>
                
              </Link>
              <Link 
                href={`/${safeLocale}/member/signup`}
                className="relative bg-transparent border-2 border-[#a90013] dark:border-[#ffdee2] hover:bg-[#a90013]/10 dark:hover:bg-[#ffdee2]/10 text-[#a90013] dark:text-[#ffdee2] py-3 px-8 rounded-md text-md font-medium inline-flex items-center flex-shrink-0 w-fit transform hover:-translate-y-1 transition-all duration-300"
              >
                <span>{safeLocale === 'tr' ? 'Bize Katıl' : 'Join Us'}</span>
                
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
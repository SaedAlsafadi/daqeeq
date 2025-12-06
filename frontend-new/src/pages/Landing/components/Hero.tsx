import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HiArrowRight, HiPlay } from 'react-icons/hi2'

const Hero = () => {
  const { t } = useTranslation()

  return (
    <section id="home" className="relative pt-20 pb-16 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center">
          <div className="w-full lg:w-1/2">
            <div className="max-w-[570px] mb-12 lg:mb-0">
              <h1 className="text-4xl font-bold leading-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl mb-6">
                {t('landing.hero.title')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors group"
                >
                  {t('landing.hero.cta')}
                  <HiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <HiPlay className="mr-2 w-5 h-5" />
                  {t('landing.hero.learnMore')}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="relative mx-auto max-w-[500px] lg:mr-0">
              {/* Main illustration/image placeholder */}
              <div className="relative z-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white font-semibold">{t('predictions.results')}</div>
                    <div className="text-green-300 text-sm">↗ +15%</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">{t('predictions.toiletPaper')}</span>
                      <div className="w-24 h-2 bg-white/20 rounded-full">
                        <div className="w-3/4 h-full bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">{t('predictions.handSoap')}</span>
                      <div className="w-24 h-2 bg-white/20 rounded-full">
                        <div className="w-1/2 h-full bg-yellow-300 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">{t('predictions.disinfectant')}</span>
                      <div className="w-24 h-2 bg-white/20 rounded-full">
                        <div className="w-5/6 h-full bg-green-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-white font-semibold mb-2">AI Insights</div>
                  <div className="text-white/80 text-sm">
                    "Increase {t('predictions.toiletPaper')} order by 20% for next month based on usage patterns"
                  </div>
                </div>
              </div>

              {/* Background decorations */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary-200 dark:bg-primary-900 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-secondary-200 dark:bg-secondary-900 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
const About = () => {
  return (
    <section id="about" className="py-16 md:py-20 lg:py-28 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center">
          <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
            <div className="relative mx-auto aspect-[25/24] max-w-[500px] lg:ml-0">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3">Usage Analytics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-white/80 text-sm">
                        <span>This Month</span>
                        <span>Last Month</span>
                      </div>
                      <div className="h-20 bg-white/10 rounded-lg flex items-end justify-around p-2">
                        <div className="w-8 bg-white/60 rounded-t" style={{height: '60%'}}></div>
                        <div className="w-8 bg-white/60 rounded-t" style={{height: '80%'}}></div>
                        <div className="w-8 bg-white/60 rounded-t" style={{height: '40%'}}></div>
                        <div className="w-8 bg-white/60 rounded-t" style={{height: '90%'}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3">Cost Savings</h4>
                    <div className="text-2xl font-bold text-white">$3,200</div>
                    <div className="text-green-300 text-sm">↗ 15% this month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2">
            <div className="max-w-[470px] lg:ml-auto">
              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Smart Supply Management
                </h3>
                <p className="text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg sm:leading-relaxed">
                  Our AI-powered platform analyzes your usage patterns, seasonal trends, and external factors to predict exactly what you need and when you need it.
                </p>
              </div>
              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Cost Optimization
                </h3>
                <p className="text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg sm:leading-relaxed">
                  Reduce waste and optimize your budget with intelligent purchasing recommendations and bulk order suggestions.
                </p>
              </div>
              <div className="mb-1">
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Never Run Out
                </h3>
                <p className="text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg sm:leading-relaxed">
                  Proactive alerts and automated reordering ensure you always have the supplies you need when you need them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
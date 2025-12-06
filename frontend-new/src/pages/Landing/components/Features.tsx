import { Link } from 'react-router-dom'
import { HiCpuChip, HiChartBarSquare, HiShieldCheck, HiClock, HiCurrencyDollar, HiBell } from 'react-icons/hi2'

const Features = () => {
  const features = [
    {
      icon: HiCpuChip,
      title: 'AI-Powered Forecasting',
      description: 'Advanced machine learning algorithms analyze usage patterns, seasonal trends, and external factors to predict your cleaning supply needs with high accuracy.',
    },
    {
      icon: HiChartBarSquare,
      title: 'Real-Time Analytics',
      description: 'Get instant insights into your inventory levels, consumption rates, and cost optimization opportunities through our comprehensive dashboard.',
    },
    {
      icon: HiShieldCheck,
      title: 'Automated Compliance',
      description: 'Ensure you always meet health and safety standards with automated compliance tracking and regulatory requirement monitoring.',
    },
    {
      icon: HiClock,
      title: 'Smart Scheduling',
      description: 'Optimize delivery schedules and reduce storage costs with intelligent timing recommendations based on your usage patterns.',
    },
    {
      icon: HiCurrencyDollar,
      title: 'Cost Optimization',
      description: 'Reduce supply costs through bulk purchasing recommendations, waste reduction, and efficient inventory management.',
    },
    {
      icon: HiBell,
      title: 'Proactive Alerts',
      description: 'Never run out of essential supplies with smart notifications that alert you before you reach critical inventory levels.',
    },
  ]

  return (
    <section id="features" className="py-16 md:py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
            Powerful Features for Modern Businesses
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to transform your cleaning supply management from reactive to proactive
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-card max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to revolutionize your supply management?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Join businesses already saving time and money with Daqeeq
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signin" className="btn btn-primary">
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
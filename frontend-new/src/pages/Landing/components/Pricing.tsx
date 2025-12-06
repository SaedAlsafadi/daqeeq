import { Link } from 'react-router-dom'
import { HiCheck } from 'react-icons/hi2'

const Pricing = () => {
  const plans = [
    {
      name: 'Free Beta',
      price: 'Free',
      period: '',
      description: 'Currently available',
      features: [
        'AI-powered forecasting',
        'Cleaning supply predictions',
        'Basic dashboard access',
        'Community support',
      ],
      popular: true,
      comingSoonFeatures: [
        'Email notifications',
        'Detailed reports',
        'Multi-user access',
      ],
    },
    {
      name: 'Professional',
      price: 'Coming Soon',
      period: '',
      description: 'For growing businesses',
      features: [
        'Everything in Free',
        'Advanced forecasting',
        'Priority support',
        'Custom integrations',
      ],
      popular: false,
      comingSoonFeatures: [],
    },
    {
      name: 'Enterprise',
      price: 'Coming Soon',
      period: '',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom solutions',
        'SLA guarantee',
      ],
      popular: false,
      comingSoonFeatures: [],
    },
  ]

  return (
    <section id="pricing" className="py-16 md:py-20 lg:py-28 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
            Start Free Today
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We're currently in beta. Try our AI forecasting platform for free while we build more features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative card p-8 ${
                plan.popular
                  ? 'border-2 border-primary-500 shadow-xl scale-105'
                  : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 ml-1">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <HiCheck className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
                {plan.comingSoonFeatures && plan.comingSoonFeatures.length > 0 && (
                  <>
                    <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Coming Soon:
                      </span>
                    </li>
                    {plan.comingSoonFeatures.map((feature, featureIndex) => (
                      <li key={`soon-${featureIndex}`} className="flex items-center opacity-60">
                        <HiCheck className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-500 dark:text-gray-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </>
                )}
              </ul>

              <Link
                to={plan.name === 'Free Beta' ? '/signin' : plan.name === 'Enterprise' ? '#contact' : '/signin'}
                className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {plan.name === 'Free Beta' ? 'Get Started' : plan.name === 'Enterprise' ? 'Contact Us' : 'Join Waitlist'}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Have questions or need a custom solution?
          </p>
          <a href="#contact" className="btn btn-outline">
            Get in Touch
          </a>
        </div>
      </div>
    </section>
  )
}

export default Pricing
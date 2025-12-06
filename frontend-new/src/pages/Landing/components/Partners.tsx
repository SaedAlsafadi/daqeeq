import { Link } from 'react-router-dom'
import { HiCheckCircle, HiArrowRight } from 'react-icons/hi2'

const Partners = () => {
  return (
    <section id="partners" className="py-16 md:py-20 lg:py-28 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Partner With Us?
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Take the first step to join our growing network of successful business partners. Our team is ready to help you get started.
            </p>
            <Link
              to="/partner/contact"
              className="btn btn-primary px-8 py-3 inline-flex items-center space-x-2 text-lg"
            >
              <span>Apply Now</span>
              <HiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Partners
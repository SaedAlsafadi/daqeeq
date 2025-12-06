const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Facility Manager',
      company: 'TechCorp Inc.',
      content: 'Daqeeq has transformed how we manage our office supplies. We\'ve reduced costs by 30% and never run out of essentials anymore.',
      avatar: 'SJ',
    },
    {
      name: 'Michael Chen',
      role: 'Operations Director',
      company: 'Healthcare Plus',
      content: 'The AI predictions are incredibly accurate. It\'s like having a crystal ball for our cleaning supply needs.',
      avatar: 'MC',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Procurement Manager',
      company: 'EduCenter',
      content: 'The automated ordering system has saved us countless hours. Our staff can focus on more important tasks now.',
      avatar: 'ER',
    },
  ]

  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join hundreds of satisfied customers who have transformed their supply management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex mt-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
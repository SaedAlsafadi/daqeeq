import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiCheck, HiExclamationTriangle, HiArrowLeft, HiCheckCircle, HiSparkles, HiCurrencyDollar, HiClipboardDocumentList, HiShieldCheck, HiMegaphone, HiUsers, HiFire } from 'react-icons/hi2'
import { toast } from 'react-toastify'
import axios from 'axios'

const SupplierContactForm = () => {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    category: 'cleaning_supplies',
    address: '',
    city: '',
    country: '',
    website: '',
    message: '',
    servicesOffered: [] as string[],
    certifications: [] as string[]
  })

  const categories = [
    { value: 'cleaning_supplies', label: 'Cleaning Supplies Manufacturer' },
    { value: 'janitorial_equipment', label: 'Janitorial Equipment' },
    { value: 'chemical_supplier', label: 'Chemical Supplier' },
    { value: 'equipment_rental', label: 'Equipment Rental Service' },
    { value: 'maintenance_service', label: 'Maintenance Service Provider' }
  ]

  const commonServices = [
    'Regular Cleaning',
    'Deep Cleaning',
    'Disinfection',
    'Floor Care',
    'Window Cleaning',
    'Carpet Cleaning',
    'Equipment Maintenance',
    'Emergency Response'
  ]

  const commonCertifications = [
    'ISO 9001',
    'ISO 14001',
    'OHSAS 18001',
    'Health & Safety Certified',
    'Green Cleaning Certified',
    'Professional Cleaning License'
  ]

  const benefits = [
    {
      title: 'Reliable Revenue Stream',
      description: 'Access a growing network of businesses actively seeking reliable suppliers and service providers',
      icon: HiCurrencyDollar
    },
    {
      title: 'Easy Order Management',
      description: 'Manage all your requests and orders through our intuitive dashboard',
      icon: HiClipboardDocumentList
    },
    {
      title: 'Secure Payments',
      description: 'Guaranteed on-time payments with transparent pricing and no hidden fees',
      icon: HiShieldCheck
    },
    {
      title: 'Marketing Support',
      description: 'Your business profile showcases your services to thousands of potential clients',
      icon: HiMegaphone
    },
    {
      title: 'Dedicated Support',
      description: 'Get priority support from our team to help you succeed',
      icon: HiUsers
    },
    {
      title: 'Performance Ratings',
      description: 'Build your reputation through transparent customer ratings and reviews',
      icon: HiFire
    }
  ]

  const steps = [
    {
      number: '1',
      title: 'Submit Your Information',
      description: 'Fill out our quick registration form with your business details'
    },
    {
      number: '2',
      title: 'Review & Verification',
      description: 'Our team verifies your credentials and business information'
    },
    {
      number: '3',
      title: 'Contract & Setup',
      description: 'Sign partnership agreement and receive your login credentials'
    },
    {
      number: '4',
      title: 'Start Receiving Requests',
      description: 'Begin accepting orders and providing services to our clients'
    }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
    }))
  }

  const handleCertificationToggle = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/suppliers/submit-contact`,
        formData
      )

      if (response.data.success) {
        setSubmitted(true)
        setSubmissionId(response.data.submissionId)
        toast.success('✅ Your contact information has been received successfully!')
        
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          companyName: '',
          category: 'cleaning_supplies',
          address: '',
          city: '',
          country: '',
          website: '',
          message: '',
          servicesOffered: [],
          certifications: []
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit form. Please try again.'
      toast.error(`❌ ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Success message
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Thank You!
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Your contact information has been received successfully. Our team will review your submission and contact you shortly.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Submission ID:</strong> {submissionId}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Save this ID to check your submission status
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Here's what happens next:
                </p>
                <ul className="text-left space-y-3 max-w-md mx-auto">
                  <li className="flex items-start space-x-3">
                    <span className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 text-sm font-semibold text-white bg-green-600 rounded-full">1</span>
                    <span className="text-gray-600 dark:text-gray-300">Our team reviews your information</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 text-sm font-semibold text-white bg-green-600 rounded-full">2</span>
                    <span className="text-gray-600 dark:text-gray-300">We verify your business details</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 text-sm font-semibold text-white bg-green-600 rounded-full">3</span>
                    <span className="text-gray-600 dark:text-gray-300">Contact you with next steps and account credentials</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="inline-flex items-center justify-center flex-shrink-0 w-5 h-5 text-sm font-semibold text-white bg-green-600 rounded-full">4</span>
                    <span className="text-gray-600 dark:text-gray-300">Start receiving requests and providing services</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-primary flex items-center justify-center space-x-2"
                >
                  <HiArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-6"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Become Our Partner
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join our network of trusted suppliers and service providers. Fill out this form and our team will contact you to discuss partnership opportunities.
          </p>
        </div>

        {/* How to Get Started Section */}
        <div className="max-w-5xl mx-auto mb-16">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">No Setup Fees</span><br />
                or hidden charges
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">Quick Approval</span><br />
                2-3 business days
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">Dedicated Support</span><br />
                Account manager assistance
              </p>
            </div>
          </div>
        </div>

        {/* Grow Your Business Section - Before Form */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 mb-4 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full">
                <HiSparkles className="w-5 h-5" />
                <span className="text-sm font-semibold">Partnership Opportunity</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Grow Your Business With Us
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Expand your reach and access a growing customer base actively seeking reliable services.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon
                return (
                  <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Form Section Header */}
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Application Form
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Please fill in all required fields marked with an asterisk (*)
            </p>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="input"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input"
                      placeholder="john@company.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="label">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input"
                      placeholder="+966 5X XXX XXXX"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="label">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="input"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  Company Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="companyName" className="label">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="input"
                      placeholder="Your Company Ltd."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="label">
                      Business Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="city" className="label">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input"
                      placeholder="Riyadh"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="label">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="input"
                      placeholder="Saudi Arabia"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="label">
                      Business Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input resize-none"
                      rows={2}
                      placeholder="Street address..."
                    />
                  </div>
                </div>
              </div>

              {/* Services & Certifications */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  Services & Certifications
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="label mb-4">Services Offered</label>
                    <div className="space-y-3">
                      {commonServices.map(service => (
                        <label key={service} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.servicesOffered.includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label mb-4">Certifications</label>
                    <div className="space-y-3">
                      {commonCertifications.map(cert => (
                        <label key={cert} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.certifications.includes(cert)}
                            onChange={() => handleCertificationToggle(cert)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{cert}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  Additional Information
                </h2>

                <div>
                  <label htmlFor="message" className="label">
                    Tell us about your business and why you'd like to partner with us
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="input resize-none"
                    rows={6}
                    placeholder="Share details about your experience, capacity, and specific interests..."
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
                <HiExclamationTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold mb-1">What Happens Next?</p>
                  <p>Our team will review your submission within 2-3 business days. If approved, we'll contact you to discuss terms, send you a contract, and provide your login credentials.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierContactForm
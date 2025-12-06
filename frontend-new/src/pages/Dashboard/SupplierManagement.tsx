import { useState, useEffect } from 'react'
import { HiEye, HiCheckCircle, HiXCircle, HiClock, HiPlusCircle } from 'react-icons/hi2'
import axios from 'axios'
import { toast } from 'react-toastify'

interface Submission {
  id: string
  full_name: string
  email: string
  phone: string
  company_name: string
  category: string
  status: string
  created_at: string
  assigned_to?: { first_name: string; last_name: string }
}

interface SubmissionDetail extends Submission {
  message: string
  submission_data: Record<string, any>
}

const SupplierManagement = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('new')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updating, setUpdating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [tempPasswordData, setTempPasswordData] = useState<{ email: string; username: string; password: string; company: string } | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  // Fetch submissions
  useEffect(() => {
    fetchSubmissions()
  }, [statusFilter, page])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await axios.get(`${apiUrl}/suppliers/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: statusFilter, page, limit: 10 }
      })

      if (response.data.success) {
        setSubmissions(response.data.submissions)
        setTotalPages(response.data.pagination.pages)
      }
    } catch (error) {
      toast.error('Failed to load submissions')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissionDetails = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(`${apiUrl}/suppliers/submissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setSelectedSubmission(response.data.submission)
      }
    } catch (error) {
      toast.error('Failed to load submission details')
      console.error('Error:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedSubmission) return

    try {
      setUpdating(true)
      const token = localStorage.getItem('authToken')
      const response = await axios.patch(
        `${apiUrl}/suppliers/submissions/${selectedSubmission.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        toast.success('Status updated successfully')
        setSelectedSubmission(null)
        fetchSubmissions()
      }
    } catch (error) {
      toast.error('Failed to update status')
      console.error('Error:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateProvider = async () => {
    if (!selectedSubmission) return

    try {
      setUpdating(true)
      const token = localStorage.getItem('authToken')
      const response = await axios.post(
        `${apiUrl}/suppliers/create-service-provider`,
        {
          submissionId: selectedSubmission.id,
          servicesOffered: selectedSubmission.submission_data?.servicesOffered
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        toast.success('✅ Service provider account created successfully!')
        setTempPasswordData({
          email: response.data.provider.email,
          username: response.data.provider.username,
          password: response.data.provider.tempPassword,
          company: response.data.provider.companyName
        })
        setShowPasswordModal(true)
        setSelectedSubmission(null)
        fetchSubmissions()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create service provider')
      console.error('Error:', error)
    } finally {
      setUpdating(false)
    }
  }

  const copyPasswordToClipboard = () => {
    if (tempPasswordData) {
      navigator.clipboard.writeText(tempPasswordData.password)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
      toast.success('Password copied to clipboard!')
    }
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    reviewing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const categoryLabels: Record<string, string> = {
    cleaning_supplies: 'Cleaning Supplies',
    janitorial_equipment: 'Janitorial Equipment',
    chemical_supplier: 'Chemical Supplier',
    equipment_rental: 'Equipment Rental',
    maintenance_service: 'Maintenance Service'
  }

  const statusIcons: Record<string, React.ReactNode> = {
    new: <HiClock className="w-4 h-4" />,
    reviewing: <HiEye className="w-4 h-4" />,
    contacted: <HiCheckCircle className="w-4 h-4" />,
    approved: <HiCheckCircle className="w-4 h-4" />,
    rejected: <HiXCircle className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supplier Management</h1>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['new', 'reviewing', 'contacted', 'approved', 'rejected', 'closed'].map(status => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1) }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-2">
          <div className="card">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No submissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Company</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(submission => (
                      <tr key={submission.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{submission.company_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>{submission.full_name}</div>
                          <div className="text-xs text-gray-500">{submission.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {categoryLabels[submission.category]}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[submission.status]}`}>
                            {statusIcons[submission.status]}
                            <span>{submission.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => fetchSubmissionDetails(submission.id)}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submission Details */}
        <div>
          {selectedSubmission ? (
            <div className="card sticky top-24">
              <div className="p-6">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-4"
                >
                  ← Back
                </button>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Company Name</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedSubmission.company_name}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Contact Person</p>
                    <p className="text-gray-900 dark:text-white">{selectedSubmission.full_name}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</p>
                    <p className="text-gray-900 dark:text-white break-all">{selectedSubmission.email}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Phone</p>
                    <p className="text-gray-900 dark:text-white">{selectedSubmission.phone}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Category</p>
                    <p className="text-gray-900 dark:text-white">{categoryLabels[selectedSubmission.category]}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Current Status</p>
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium mt-1 ${statusColors[selectedSubmission.status]}`}>
                      {statusIcons[selectedSubmission.status]}
                      <span>{selectedSubmission.status}</span>
                    </span>
                  </div>

                  {selectedSubmission.message && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Message</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedSubmission.message}</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleStatusChange('contacted')}
                      disabled={updating || selectedSubmission.status === 'contacted'}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 text-sm"
                    >
                      Mark as Contacted
                    </button>

                    <button
                      onClick={() => handleStatusChange('approved')}
                      disabled={updating || selectedSubmission.status === 'approved'}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 text-sm"
                    >
                      Approve
                    </button>

                    <button
                      onClick={handleCreateProvider}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
                    >
                      <HiPlusCircle className="w-4 h-4" />
                      <span>Create Provider Account</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange('rejected')}
                      disabled={updating || selectedSubmission.status === 'rejected'}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-96 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Select a submission to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && tempPasswordData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ✅ Service Provider Account Created
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Share these credentials with the service provider
            </p>

            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                  <p className="text-gray-900 dark:text-white font-medium break-all">{tempPasswordData.company}</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Login Email
                </label>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                  <p className="text-gray-900 dark:text-white font-medium break-all">{tempPasswordData.email}</p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                  <p className="text-gray-900 dark:text-white font-medium break-all">{tempPasswordData.username}</p>
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temporary Password
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-300 dark:border-yellow-700">
                    <p className="text-gray-900 dark:text-white font-mono font-bold text-lg break-all">
                      {tempPasswordData.password}
                    </p>
                  </div>
                  <button
                    onClick={copyPasswordToClipboard}
                    className={`px-4 py-3 rounded font-medium transition-colors ${
                      passwordCopied
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {passwordCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Instructions:</strong>
                  <br />
                  1. Share email and password with the provider
                  <br />
                  2. Provider signs in at: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">localhost:5173/signin</code>
                  <br />
                  3. Provider will be prompted to change password on first login
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setTempPasswordData(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
              >
                Done
              </button>
              <button
                onClick={copyPasswordToClipboard}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                📋 Copy Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierManagement
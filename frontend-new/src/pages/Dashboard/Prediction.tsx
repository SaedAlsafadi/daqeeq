import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import predictionService, { PredictionInput, PredictionResult } from '@/services/predictionService';
import quotationService, { ServiceProvider, QuotationRequestItem } from '@/services/quotationService';
import { HiSparkles, HiInformationCircle, HiXMark, HiCheckCircle, HiTruck, HiStar } from 'react-icons/hi2';
import { useAuth } from '@/contexts/AuthContext';

const Prediction = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mlServiceHealth, setMlServiceHealth] = useState<boolean>(false);
  const [cleaningFrequencies, setCleaningFrequencies] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [savedPredictionId, setSavedPredictionId] = useState<string | null>(null);
  
  // Provider suggestions state
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [sendingRequests, setSendingRequests] = useState(false);
  
  // Item selection state (all selected by default)
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({
    toilet_paper: true,
    hand_soap: true,
    disinfectant: true,
    air_freshener: true,
    glass_cleaner: true,
    trash_bags: true,
    tissues: true,
    workers: true
  });
  
  // Draft predictions state
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const [formData, setFormData] = useState<PredictionInput>({
    facility_size_sqm: 0,
    number_of_people: 0,
    number_of_bathrooms: 0,
    days_count: 30,
    cleaning_frequency: 'Medium',
    organization_type: user?.organizationType || 'Hotels'
  });

  useEffect(() => {
    checkMLServiceHealth();
    loadModelsInfo();
    loadDrafts();
  }, []);

  // Update organization type when user data is loaded
  useEffect(() => {
    if (user?.organizationType) {
      setFormData(prev => ({
        ...prev,
        organization_type: user.organizationType!
      }));
    }
  }, [user]);

  const checkMLServiceHealth = async () => {
    try {
      const health = await predictionService.getHealth();
      setMlServiceHealth(health.success || health.ml_service?.status === 'OK');
    } catch (error) {
      setMlServiceHealth(false);
      toast.error('ML Service is currently unavailable');
    }
  };

  const loadModelsInfo = async () => {
    try {
      const info = await predictionService.getModelsInfo();
      setCleaningFrequencies(info.cleaning_frequencies);
    } catch (error) {
      console.error('Failed to load models info:', error);
      // Set default frequencies if API fails
      setCleaningFrequencies(['High', 'Medium', 'Low']);
    }
  };

  const loadDrafts = async () => {
    try {
      setLoadingDrafts(true);
      const response = await quotationService.getDrafts();
      setDrafts(response.drafts || []);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      // Silently fail - not critical
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handleToggleItem = (itemKey: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const handleSaveDraft = async () => {
    if (!predictions) {
      toast.error('No prediction to save');
      return;
    }

    setLoading(true);
    try {
      await quotationService.saveDraft({
        ...formData,
        predictions: predictions
      });
      toast.success('Prediction saved as draft! You can continue later from the Drafts section.');
      loadDrafts(); // Reload drafts list
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await quotationService.deleteDraft(draftId);
      toast.success('Draft deleted');
      loadDrafts();
    } catch (error: any) {
      console.error('Delete draft error:', error);
      toast.error('Failed to delete draft');
    }
  };

  const handleContinueDraft = async (draft: any) => {
    try {
      // Convert draft to completed prediction
      const response = await quotationService.continueDraft(draft.id);
      
      // Load draft data into the form
      setFormData({
        facility_size_sqm: draft.facility_size_sqm,
        number_of_people: draft.number_of_people,
        number_of_bathrooms: draft.number_of_bathrooms,
        days_count: draft.days_count,
        cleaning_frequency: draft.cleaning_frequency,
        organization_type: draft.organization_type
      });
      
      setPredictions(draft.predictions);
      setSavedPredictionId(draft.id);
      
      toast.success('Draft loaded! You can now send quotation requests.');
      setShowDrafts(false);
      loadDrafts();
    } catch (error: any) {
      console.error('Continue draft error:', error);
      toast.error('Failed to load draft');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['facility_size_sqm', 'number_of_people', 'number_of_bathrooms', 'days_count'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  // Calculate cleaning frequency times per week based on organization type
  const getCleaningFrequencyText = (frequency: string): string => {
    const orgType = user?.organizationType || 'Hotels';
    const days = 7; // Calculate for a week
    
    // Group 1: Hospitals, Clinics, Restaurants, Hotels
    const group1 = ['Hospitals', 'Clinics', 'Restaurants', 'Hotels'];
    // Group 2: Retail Stores, Banks, Libraries, Shopping Malls, Schools, college, Gyms, company
    const group2 = ['Retail Stores', 'Banks', 'Libraries', 'Shopping Malls', 'Schools', 'college', 'Gyms', 'company'];
    // Group 3: Warehouses, Storage Facilities
    const group3 = ['Warehouses', 'Storage Facilities'];
    
    let times = 0;
    
    if (group1.includes(orgType)) {
      if (frequency === 'High') times = days * 5;
      else if (frequency === 'Medium') times = days * 2;
      else times = days;
    } else if (group2.includes(orgType)) {
      if (frequency === 'High') times = days * 2;
      else if (frequency === 'Medium') times = days;
      else times = Math.round(days / 3);
    } else if (group3.includes(orgType)) {
      if (frequency === 'High') times = days;
      else if (frequency === 'Medium') times = Math.round(days / 7);
      else times = Math.round(days / 30 * 7); // Adjusted for weekly view
    } else {
      // Default to average across all groups
      if (frequency === 'High') times = 19;
      else if (frequency === 'Medium') times = 7;
      else times = 3;
    }
    
    return `${frequency} (~${times} times/week)`;
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mlServiceHealth) {
      toast.error('ML Service is not available');
      return;
    }

    setLoading(true);
    try {
      const response = await predictionService.predict(formData);
      setPredictions(response.data.predictions);
      
      // Save prediction to database
      try {
        const savedPrediction = await quotationService.savePrediction({
          ...formData,
          predictions: response.data.predictions
        });
        setSavedPredictionId(savedPrediction.prediction.id);
      } catch (saveError) {
        console.error('Failed to save prediction:', saveError);
        // Don't show error to user, it's not critical
      }
      
      toast.success('Prediction completed successfully!');
    } catch (error: any) {
      console.error('Prediction error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleGetProviderSuggestions = async () => {
    setLoadingProviders(true);
    setShowProviderModal(true);
    try {
      const response = await quotationService.getProviderSuggestions({
        organizationType: formData.organization_type,
        facilitySize: formData.facility_size_sqm,
        predictionId: savedPredictionId || undefined
      });
      setProviders(response.providers);
      if (response.providers.length === 0) {
        toast.info('No providers found matching your criteria');
      }
    } catch (error: any) {
      console.error('Provider suggestions error:', error);
      toast.error('Failed to load provider suggestions');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else if (prev.length < 3) {
        return [...prev, providerId];
      } else {
        toast.warning('You can only select up to 3 providers');
        return prev;
      }
    });
  };

  const handleSendQuotationRequests = async () => {
    if (selectedProviders.length === 0) {
      toast.error('Please select at least one provider');
      return;
    }

    if (!predictions) {
      toast.error('No prediction data available');
      return;
    }

    // Check if at least one item is selected
    const hasSelectedItems = Object.values(selectedItems).some(selected => selected);
    if (!hasSelectedItems) {
      toast.error('Please select at least one item to include in the request');
      return;
    }

    setSendingRequests(true);
    try {
      // Prepare items from predictions (ONLY selected items)
      const items: QuotationRequestItem[] = [];
      
      // Add toilet paper if selected
      if (selectedItems.toilet_paper && predictions['Total_Toilet_Paper_Sheets']) {
        const rolls = sheetsToRolls(predictions['Total_Toilet_Paper_Sheets']);
        items.push({
          name: 'Toilet Paper',
          type: 'Paper Products',
          quantity: rolls.rolls,
          unit: 'rolls'
        });
      }
      // Add hand soap if selected
      if (selectedItems.hand_soap && predictions['Hand soap (mL)']) {
        const gallons = toGallons(predictions['Hand soap (mL)'], 'mL');
        items.push({
          name: 'Hand Soap',
          type: 'Cleaning Supplies',
          quantity: gallons.gallons,
          unit: 'gallons'
        });
      }
      // Add disinfectant if selected
      if (selectedItems.disinfectant && predictions['Disinfectant (mL)']) {
        const gallons = toGallons(predictions['Disinfectant (mL)'], 'mL');
        items.push({
          name: 'Disinfectant',
          type: 'Cleaning Supplies',
          quantity: gallons.gallons,
          unit: 'gallons'
        });
      }
      // Add air freshener if selected
      if (selectedItems.air_freshener && predictions['Air freshener (mL)']) {
        const gallons = toGallons(predictions['Air freshener (mL)'], 'mL');
        items.push({
          name: 'Air Freshener',
          type: 'Cleaning Supplies',
          quantity: gallons.gallons,
          unit: 'gallons'
        });
      }
      // Add glass cleaner if selected
      if (selectedItems.glass_cleaner && predictions['Glass cleaner (mL)']) {
        const gallons = toGallons(predictions['Glass cleaner (mL)'], 'mL');
        items.push({
          name: 'Glass Cleaner',
          type: 'Cleaning Supplies',
          quantity: gallons.gallons,
          unit: 'gallons'
        });
      }
      // Add trash bags if selected
      if (selectedItems.trash_bags && predictions['Trash_Bags (8 gallon)']) {
        items.push({
          name: 'Trash Bags (8-gallon)',
          type: 'Waste Management',
          quantity: predictions['Trash_Bags (8 gallon)'],
          unit: 'bags'
        });
      }
      // Add tissues if selected
      if (selectedItems.tissues && predictions['Total_Tissues']) {
        const packs = sheetsToPacks(predictions['Total_Tissues']);
        items.push({
          name: 'Tissues (Non-Bathroom)',
          type: 'Paper Products',
          quantity: packs.packs,
          unit: 'packs'
        });
      }
      // Add workers if selected
      if (selectedItems.workers && predictions['Number_of_Workers']) {
        items.push({
          name: 'Workers Needed',
          type: 'Labor',
          quantity: Math.round(predictions['Number_of_Workers']),
          unit: 'workers'
        });
      }

      // Send requests to all selected providers
      const requestPromises = selectedProviders.map(providerId => 
        quotationService.sendQuotationRequest({
          providerId,
          predictionId: savedPredictionId || undefined,
          title: `Supply Request for ${formData.organization_type}`,
          description: `Requesting quotation for cleaning supplies based on facility size: ${formData.facility_size_sqm} sqm, ${formData.number_of_people} people, ${formData.days_count} days.`,
          requirements: {
            facility_size_sqm: formData.facility_size_sqm,
            number_of_people: formData.number_of_people,
            organization_type: formData.organization_type
          },
          items
        })
      );

      await Promise.all(requestPromises);
      
      toast.success(`Successfully sent ${selectedProviders.length} quotation request(s) with ${items.length} item(s)!`);
      setShowProviderModal(false);
      setSelectedProviders([]);
    } catch (error: any) {
      console.error('Send quotation requests error:', error);
      toast.error('Failed to send some quotation requests');
    } finally {
      setSendingRequests(false);
    }
  };

  // Helper function to convert sheets to rolls
  const sheetsToRolls = (sheets: number) => {
    const SHEETS_PER_ROLL = 1500; // 1500 sheets = 300 meters
    const rolls = Math.ceil(sheets / SHEETS_PER_ROLL);
    return { rolls, sheets, sheetsPerRoll: SHEETS_PER_ROLL };
  };

  // Helper function to convert sheets to packs (300 sheets per pack)
  const sheetsToPacks = (sheets: number) => {
    const SHEETS_PER_PACK = 300;
    const packs = Math.ceil(sheets / SHEETS_PER_PACK);
    return { packs, sheets, sheetsPerPack: SHEETS_PER_PACK };
  };

  // Helper function to convert mL or L to gallons
  const toGallons = (amount: number, unit: 'mL' | 'L') => {
    const ML_PER_GALLON = 5000;
    const amountInML = unit === 'L' ? amount * 1000 : amount;
    const gallons = Math.ceil(amountInML / ML_PER_GALLON);
    return { gallons, originalAmount: amount, originalUnit: unit };
  };

  // Helper function to calculate trash bag options
  const calculateTrashBagOptions = (bags8Gallon: number) => {
    const BAGS_PER_PACK_8GAL = 30;
    const BAGS_PER_PACK_50GAL = 25;
    
    // Calculate total capacity needed
    const totalCapacity = bags8Gallon * 8;
    
    // Option 1: 8-gallon bags in 30-bag packs
    const packs8Gallon = Math.ceil(bags8Gallon / BAGS_PER_PACK_8GAL);
    
    // Option 2: Convert to 50-gallon bags
    const bags50Gallon = Math.ceil(totalCapacity / 50);
    const packs50Gallon = Math.ceil(bags50Gallon / BAGS_PER_PACK_50GAL);
    
    return {
      option8Gal: {
        bags: bags8Gallon,
        packs: packs8Gallon,
        bagsPerPack: BAGS_PER_PACK_8GAL
      },
      option50Gal: {
        bags: bags50Gallon,
        packs: packs50Gallon,
        bagsPerPack: BAGS_PER_PACK_50GAL
      },
      totalCapacity
    };
  };

  // Helper function to get color classes (Tailwind needs complete class names)
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { text: string, textDark: string, bg: string } } = {
      blue: { text: 'text-blue-600', textDark: 'dark:text-blue-400', bg: 'bg-blue-500' },
      green: { text: 'text-green-600', textDark: 'dark:text-green-400', bg: 'bg-green-500' },
      purple: { text: 'text-purple-600', textDark: 'dark:text-purple-400', bg: 'bg-purple-500' },
      pink: { text: 'text-pink-600', textDark: 'dark:text-pink-400', bg: 'bg-pink-500' },
      indigo: { text: 'text-indigo-600', textDark: 'dark:text-indigo-400', bg: 'bg-indigo-500' },
      yellow: { text: 'text-yellow-600', textDark: 'dark:text-yellow-400', bg: 'bg-yellow-500' },
      red: { text: 'text-red-600', textDark: 'dark:text-red-400', bg: 'bg-red-500' },
      orange: { text: 'text-orange-600', textDark: 'dark:text-orange-400', bg: 'bg-orange-500' },
    };
    return colorMap[color] || colorMap.blue;
  };

  const supplyItems = predictions ? [
    { 
      label: 'Toilet Paper', 
      value: sheetsToRolls(predictions['Total_Toilet_Paper_Sheets']).rolls, 
      unit: 'rolls',
      subtext: `${sheetsToRolls(predictions['Total_Toilet_Paper_Sheets']).sheets.toLocaleString()} sheets (1500 sheets/roll = 300 meters/roll)`,
      color: 'blue' 
    },
    { 
      label: 'Hand Soap', 
      value: toGallons(predictions['Hand soap (mL)'], 'mL').gallons, 
      unit: 'gallon(s)',
      subtext: `${predictions['Hand soap (mL)'].toLocaleString()} mL (5000 mL per gallon)`,
      color: 'green' 
    },
    { 
      label: 'Disinfectant', 
      value: toGallons(predictions['Disinfectant (mL)'], 'mL').gallons, 
      unit: 'gallon(s)',
      subtext: `${predictions['Disinfectant (mL)'].toLocaleString()} mL (5000 mL per gallon)`,
      color: 'purple' 
    },
    { 
      label: 'Air Freshener', 
      value: toGallons(predictions['Air freshener (mL)'], 'mL').gallons, 
      unit: 'gallon(s)',
      subtext: `${predictions['Air freshener (mL)'].toLocaleString()} mL (5000 mL per gallon)`,
      color: 'pink' 
    },
    { 
      label: 'Glass Cleaner', 
      value: toGallons(predictions['Glass cleaner (mL)'], 'mL').gallons, 
      unit: 'gallon(s)',
      subtext: `${predictions['Glass cleaner (mL)'].toLocaleString()} mL (5000 mL per gallon)`,
      color: 'indigo' 
    },
    { 
      label: 'Trash Bags', 
      value: null, // Will display both options
      unit: null,
      subtext: null,
      trashBagOptions: calculateTrashBagOptions(predictions['Trash_Bags (8 gallon)']),
      color: 'yellow' 
    },
    { 
      label: 'Tissues', 
      value: sheetsToPacks(predictions['Total_Tissues']).packs, 
      unit: 'packs',
      subtext: `${sheetsToPacks(predictions['Total_Tissues']).sheets.toLocaleString()} sheets (300 sheets/pack)`,
      color: 'red' 
    },
    { 
      label: 'Workers Needed', 
      value: Math.round(predictions['Number_of_Workers']), 
      unit: 'workers',
      subtext: null,
      color: 'orange' 
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiSparkles className="text-primary-600" />
            AI-Powered Supply Prediction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get accurate predictions for your cleaning supply needs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            mlServiceHealth 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}>
            {mlServiceHealth ? '● ML Service Online' : '● ML Service Offline'}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <HiInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">How it works:</p>
            <p>Enter your facility details below, and our AI model will predict the exact amount of cleaning supplies you'll need based on historical data and machine learning algorithms.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Facility Details
          </h2>
          <form onSubmit={handlePredict} className="space-y-4">
            {/* Facility Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Facility Size (sqm)
              </label>
              <input
                type="number"
                name="facility_size_sqm"
                value={formData.facility_size_sqm || ''}
                onChange={handleInputChange}
                placeholder="e.g., 1000 (square meters)"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Number of People */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of People
              </label>
              <input
                type="number"
                name="number_of_people"
                value={formData.number_of_people || ''}
                onChange={handleInputChange}
                placeholder="e.g., 50 (daily occupancy)"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Number of Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Bathrooms
              </label>
              <input
                type="number"
                name="number_of_bathrooms"
                value={formData.number_of_bathrooms || ''}
                onChange={handleInputChange}
                placeholder="e.g., 10 (total restrooms)"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Days Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prediction Period (days)
              </label>
              <input
                type="number"
                name="days_count"
                value={formData.days_count}
                onChange={handleInputChange}
                min="1"
                max="365"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Organization Type - Display only (from user profile) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization Type
              </label>
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-white">
                {user?.organizationType || 'Not specified'}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Set during account registration
              </p>
            </div>

            {/* Cleaning Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cleaning Frequency Level
              </label>
              <select
                name="cleaning_frequency"
                value={formData.cleaning_frequency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                {cleaningFrequencies.length > 0 ? (
                  cleaningFrequencies.map(freq => (
                    <option key={freq} value={freq}>{getCleaningFrequencyText(freq)}</option>
                  ))
                ) : (
                  <>
                    <option value="High">{getCleaningFrequencyText('High')}</option>
                    <option value="Medium">{getCleaningFrequencyText('Medium')}</option>
                    <option value="Low">{getCleaningFrequencyText('Low')}</option>
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Based on your {user?.organizationType || 'facility type'} - estimated cleaning sessions per week
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !mlServiceHealth}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <HiSparkles className="w-5 h-5" />
                  Generate Prediction
                </>
              )}
            </button>
          </form>
        </div>

        {/* Predictions Results */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Predicted Supply Needs
          </h2>
          
          {predictions ? (
            <div className="space-y-4">
              {supplyItems.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {/* Special handling for Trash Bags with two options */}
                  {item.trashBagOptions ? (
                    <div>
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.label}
                        </span>
                      </div>
                      
                      {/* Option 1: 8-gallon bags */}
                      <div className="mb-3 pl-3 border-l-2 border-yellow-400">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Option 1: 8-gallon bags
                          </span>
                          <div className="text-right">
                            <div className="text-base font-bold text-yellow-600 dark:text-yellow-400">
                              {item.trashBagOptions.option8Gal.packs} pack(s)
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {item.trashBagOptions.option8Gal.bags} bags ({item.trashBagOptions.option8Gal.bagsPerPack} bags/pack)
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Option 2: 50-gallon bags */}
                      <div className="pl-3 border-l-2 border-yellow-400">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Option 2: 50-gallon bags
                          </span>
                          <div className="text-right">
                            <div className="text-base font-bold text-yellow-600 dark:text-yellow-400">
                              {item.trashBagOptions.option50Gal.packs} pack(s)
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {item.trashBagOptions.option50Gal.bags} bags ({item.trashBagOptions.option50Gal.bagsPerPack} bags/pack)
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Total capacity note */}
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 text-center">
                        Total capacity needed: {item.trashBagOptions.totalCapacity.toLocaleString()} gallons
                      </div>
                    </div>
                  ) : (
                    /* Standard display for other items */
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.label}
                        </span>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getColorClasses(item.color).text} ${getColorClasses(item.color).textDark}`}>
                            {item.value.toLocaleString()} {item.unit}
                          </div>
                          {item.subtext && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                              {item.subtext}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`${getColorClasses(item.color).bg} h-2 rounded-full transition-all duration-500`}
                          style={{ width: '75%' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300">
                  ✓ Prediction generated successfully! These estimates are based on your facility's specifications and historical usage patterns.
                </p>
              </div>

              {/* Item Selection */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                  Select items to include in quotation request (all selected by default):
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'toilet_paper', label: 'Toilet Paper' },
                    { key: 'hand_soap', label: 'Hand Soap' },
                    { key: 'disinfectant', label: 'Disinfectant' },
                    { key: 'air_freshener', label: 'Air Freshener' },
                    { key: 'glass_cleaner', label: 'Glass Cleaner' },
                    { key: 'trash_bags', label: 'Trash Bags' },
                    { key: 'tissues', label: 'Tissues' },
                    { key: 'workers', label: 'Workers' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems[item.key]}
                        onChange={() => handleToggleItem(item.key)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleGetProviderSuggestions}
                  className="w-full btn bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2 py-3"
                >
                  <HiSparkles className="w-5 h-5" />
                  Send Quotation Request
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="w-full btn btn-secondary flex items-center justify-center gap-2 py-3"
                >
                  <HiCheckCircle className="w-5 h-5" />
                  Save as Draft
                </button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Send requests to up to 3 providers or save for later
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <HiSparkles className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No predictions yet. Fill in the form and click "Generate Prediction" to see results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Saved Drafts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {drafts.length} draft prediction{drafts.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
            >
              {showDrafts ? 'Hide' : 'Show'}
            </button>
          </div>

          {showDrafts && (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div key={draft.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {draft.organization_type} Facility
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {draft.facility_size_sqm} sqm • {draft.number_of_people} people • {draft.number_of_bathrooms} bathrooms
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Saved: {new Date(draft.created_at).toLocaleDateString()} at {new Date(draft.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContinueDraft(draft)}
                        className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provider Suggestions Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Service Provider Suggestions
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select up to 3 providers to send quotation requests • {selectedProviders.length}/3 selected
                </p>
              </div>
              <button
                onClick={() => setShowProviderModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <HiXMark className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingProviders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No providers found matching your criteria
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedProviders.includes(provider.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleProviderSelect(provider.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {provider.company_name}
                            </h3>
                            {selectedProviders.includes(provider.id) && (
                              <HiCheckCircle className="w-6 h-6 text-primary-600" />
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            {/* Rating */}
                            <div className="flex items-center gap-2">
                              <HiStar className="w-5 h-5 text-yellow-500" />
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {provider.rating.toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {provider.total_reviews} reviews
                                </p>
                              </div>
                            </div>

                            {/* Delivery Time */}
                            <div className="flex items-center gap-2">
                              <HiTruck className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {provider.delivery_time_days} days
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Delivery time
                                </p>
                              </div>
                            </div>

                            {/* Experience */}
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {provider.years_in_business}+ years
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Experience
                              </p>
                            </div>

                            {/* Match Score */}
                            <div>
                              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                {provider.matchScore}% Match
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Based on your needs
                              </p>
                            </div>
                          </div>

                          {/* Specialization */}
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Specializes in:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {provider.specialization?.map((spec, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                            <p>📧 {provider.email}</p>
                            {provider.phone && <p>📞 {provider.phone}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProviders.length === 0 
                  ? 'Select at least one provider to continue'
                  : `${selectedProviders.length} provider(s) selected`
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProviderModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendQuotationRequests}
                  disabled={selectedProviders.length === 0 || sendingRequests}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingRequests ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>Send Request{selectedProviders.length > 1 ? 's' : ''}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prediction;
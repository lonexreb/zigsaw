import React, { useState, useEffect } from 'react';
import { Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';

interface UserPlan {
  plan: string;
  api_requests_count: number;
  api_limit: number;
}

interface TierIndicatorProps {
  isDark?: boolean;
}

const TierIndicator: React.FC<TierIndicatorProps> = ({ isDark = false }) => {
  const { currentUser } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!currentUser) {
        console.log('TierIndicator: No current user');
        return;
      }
      
      try {
        console.log('TierIndicator: Fetching user plan...');
        const idToken = await currentUser.getIdToken(true);
        const response = await apiService.get('/api/user/plan', idToken);
        console.log('TierIndicator: Got user plan:', response.data);
        setUserPlan(response.data);
      } catch (error: any) {
        // Gracefully handle 404 (plan not found)
        if (error?.response?.status === 404) {
          setUserPlan({ plan: 'free', api_requests_count: 0, api_limit: 100 });
        } else {
          console.error('TierIndicator: Error fetching user plan:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, [currentUser]);

  if (loading) return null;
  if (!userPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
          isDark 
            ? 'bg-gray-800/80 border-gray-600/30 text-white' 
            : 'bg-gray-100/80 border-gray-400/50 text-black'
        }`}
        title="No plan information available"
      >
        <Zap className="w-4 h-4 text-gray-400" />
      </motion.div>
    )
  }

  const isPremium = userPlan.plan === 'premium';
  const usagePercentage = (userPlan.api_requests_count / userPlan.api_limit) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-sm border shadow-lg ${
        isDark 
          ? 'bg-gray-800/80 border-gray-600/30 text-white' 
          : 'bg-gray-100/80 border-gray-400/50 text-black'
      }`}
      title={`${isPremium ? 'Premium' : 'Free'} Plan - ${userPlan.api_requests_count}/${userPlan.api_limit} API calls`}
    >
      {isPremium ? (
        <Crown className="w-4 h-4 text-yellow-500" />
      ) : (
        <Zap className="w-4 h-4 text-blue-500" />
      )}
    </motion.div>
  );
};

export default TierIndicator;
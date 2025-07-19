import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, Zap, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have an AuthContext
import { apiService } from '@/services/apiService'; // Assuming you have an apiService
import EmbeddedPaymentForm from '@/components/EmbeddedPaymentForm';

// Matrix Rain Background Component
function MatrixRain() {
  useEffect(() => {
    const canvas = document.getElementById('matrixCanvas') as HTMLCanvasElement
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const katakana = 'Z'
    const latin = 'I'
    const nums = 'G'
    const alphabet = katakana + latin + nums

    const fontSize = 16
    const columns = canvas.width / fontSize

    const rainDrops: number[] = []
    const opacity: number[] = []
    const speed: number[] = []

    for (let x = 0; x < columns; x++) {
      rainDrops[x] = 1
      opacity[x] = Math.random() * 0.5
      speed[x] = Math.random() * 2 + 1
    }

    const draw = () => {
      context.fillStyle = 'rgba(0, 0, 0, 0.05)'
      context.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length))
        const x = i * fontSize
        const y = rainDrops[i] * fontSize

        const gradient = context.createLinearGradient(x, y - fontSize, x, y)
        gradient.addColorStop(0, `rgba(0, 255, 255, 0)`)
        gradient.addColorStop(0.8, `rgba(0, 255, 255, ${opacity[i] * 0.5})`)
        gradient.addColorStop(1, `rgba(0, 255, 255, ${opacity[i]})`)
        
        context.fillStyle = gradient
        context.font = `${fontSize}px monospace`
        context.fillText(text, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0
          opacity[i] = Math.random() * 0.5
          speed[i] = Math.random() * 2 + 1
        }
        rainDrops[i] += speed[i]
      }
    }

    const interval = setInterval(draw, 50)
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      id="matrixCanvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'black'
      }}
    />
  )
}

interface SubscriptionPlanProps {
  planName: string;
  price: string;
  features: string[];
  priceId: string;
  isCurrentPlan: boolean;
  isPremium: boolean;
  onSelectPlan: (priceId: string, planName: string, price: string) => void;
}

const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({
  planName,
  price,
  features,
  priceId,
  isCurrentPlan,
  isPremium,
  onSelectPlan,
}) => {
  const { currentUser } = useAuth();
  
  const handleSubscribe = async () => {
    if (!currentUser) {
      alert("Please log in to subscribe.");
      return;
    }

    onSelectPlan(priceId, planName, price);
  };

  return (
    <div style={{
      background: isPremium 
        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 140, 0, 0.05))' 
        : 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(0, 255, 136, 0.05))',
      border: isPremium 
        ? '2px solid rgba(255, 215, 0, 0.3)' 
        : '2px solid rgba(0, 240, 255, 0.3)',
      borderRadius: '16px',
      padding: '32px',
      width: '100%',
      maxWidth: '400px',
      position: 'relative',
      backdropFilter: 'blur(10px)',
      boxShadow: isPremium 
        ? '0 20px 40px rgba(255, 215, 0, 0.2)' 
        : '0 20px 40px rgba(0, 240, 255, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)'
      e.currentTarget.style.boxShadow = isPremium 
        ? '0 25px 50px rgba(255, 215, 0, 0.3)' 
        : '0 25px 50px rgba(0, 240, 255, 0.3)'
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = isPremium 
        ? '0 20px 40px rgba(255, 215, 0, 0.2)' 
        : '0 20px 40px rgba(0, 240, 255, 0.2)'
    }}
    >
      {/* Plan Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {isPremium ? (
          <Crown style={{ width: '32px', height: '32px', color: '#FFD700' }} />
        ) : (
          <Zap style={{ width: '32px', height: '32px', color: '#00f0ff' }} />
        )}
        <div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            fontFamily: 'monospace'
          }}>
            {planName}
          </h3>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: isPremium ? '#FFD700' : '#00f0ff',
            margin: '8px 0',
            fontFamily: 'monospace'
          }}>
            {price}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: '32px' }}>
        {features.map((feature, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            color: 'white',
            fontSize: '16px',
            fontFamily: 'monospace'
          }}>
            <Check style={{ 
              width: '20px', 
              height: '20px', 
              color: isPremium ? '#FFD700' : '#00ff88'
            }} />
            {feature}
          </div>
        ))}
      </div>

      {/* Action Button */}
      {!isCurrentPlan ? (
        <button
          onClick={handleSubscribe}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: 'black',
            background: isPremium 
              ? 'linear-gradient(45deg, #FFD700, #FFA500)' 
              : 'linear-gradient(45deg, #00f0ff, #00ff88)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = isPremium 
              ? '0 10px 20px rgba(255, 215, 0, 0.4)' 
              : '0 10px 20px rgba(0, 240, 255, 0.4)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Choose {planName}
        </button>
      ) : (
        <div style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: 'white',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Current Plan
        </div>
      )}
    </div>
  );
};

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserPlan = "free"; // Placeholder
  const [selectedPlan, setSelectedPlan] = useState<{
    priceId: string;
    planName: string;
    price: string;
  } | null>(null);

  // Extract plan from URL params
  const urlParams = new URLSearchParams(location.search);
  const planParam = urlParams.get('plan');

  // Define all available plans
  const plans = [
    {
      name: "Free",
      price: "$0/month",
      features: ["2 Flows & Assistants", "100 Predictions/month", "5MB Storage", "Community Support"],
      priceId: "price_free",
      isPremium: false
    },
    {
      name: "Starter",
      price: "$35/month", 
      features: ["Unlimited Flows & Assistants", "10,000 Predictions/month", "1GB Storage", "Community Support"],
      priceId: "price_1RmAOzQoFZzVaNKX0APZdyJ0",
      isPremium: true
    },
    {
      name: "Pro",
      price: "$65/month",
      features: ["50,000 Predictions/month", "10GB Storage", "Unlimited Workspaces", "Priority Support"],
      priceId: "price_1RmAPFQoFZzVaNKXpjYnjaUW", 
      isPremium: true
    }
  ];

  const handleSelectPlan = (priceId: string, planName: string, price: string) => {
    setSelectedPlan({ priceId, planName, price });
  };

  const handlePaymentSuccess = () => {
    alert('Payment successful! Your subscription has been activated.');
    setSelectedPlan(null);
    navigate('/workflow');
  };

  const handlePaymentCancel = () => {
    setSelectedPlan(null);
  };

  if (selectedPlan) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        background: 'black', 
        color: 'white',
        position: 'relative',
        overflowX: 'hidden'
      }}>
        <MatrixRain />
        
        {/* Navigation Bar */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: 100
        }}>
          <button
            onClick={() => setSelectedPlan(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              color: '#00f0ff',
              fontSize: '16px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#00ff88'}
            onMouseOut={(e) => e.currentTarget.style.color = '#00f0ff'}
          >
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
            Back to Plans
          </button>
          
          <div style={{
            fontSize: '20px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #00f0ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Complete Payment
          </div>
        </nav>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '120px 20px 40px',
          position: 'relative',
          zIndex: 1
        }}>
          <EmbeddedPaymentForm
            priceId={selectedPlan.priceId}
            planName={selectedPlan.planName}
            price={selectedPlan.price}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      background: 'black', 
      color: 'white',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <MatrixRain />
      
      {/* Navigation Bar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            fontSize: '24px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #00f0ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>zigsaw</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M4 7h3a1 1 0 001-1V5a2 2 0 114 0v1a1 1 0 001 1h3v3a1 1 0 001 1h1a2 2 0 110 4h-1a1 1 0 00-1 1v3H7v-3a1 1 0 00-1-1H5a2 2 0 110-4h1a1 1 0 001-1V7z" 
                stroke="url(#nav-puzzle-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="nav-puzzle-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/workflow')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            color: '#00f0ff',
            fontSize: '16px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#00ff88'}
          onMouseOut={(e) => e.currentTarget.style.color = '#00f0ff'}
        >
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
          Back to Workflow
        </button>
      </nav>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '120px 20px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h1 style={{
            fontSize: '49px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #00f0ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 16px 0',
            lineHeight: 1.2
          }}>
            Choose Your Plan
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontFamily: 'monospace',
            margin: 0
          }}>
            Unlock the full potential of your AI workflows
          </p>
        </div>

        {/* Plans */}
        <div style={{
          display: 'flex',
          gap: '40px',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          maxWidth: '1200px'
        }}>
          {plans.map((plan) => (
            <SubscriptionPlan
              key={plan.name}
              planName={plan.name}
              price={plan.price}
              features={plan.features}
              priceId={plan.priceId}
              isCurrentPlan={currentUserPlan === plan.name.toLowerCase()}
              isPremium={plan.isPremium}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;

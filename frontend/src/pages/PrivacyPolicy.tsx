const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Navigation back to home */}
        <div className="mb-8">
          <a 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-2"
          >
            ← Back to Home
          </a>
        </div>

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-lg">Your privacy matters to us</p>
        </div>

        {/* Privacy Policy Content */}
        <div className="max-w-4xl mx-auto prose prose-invert">
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">PRIVACY POLICY</h2>
                <p className="text-gray-300 mb-4">
                  <strong>Last updated:</strong> August 01, 2025
                </p>
              </div>

              <div>
                <p className="text-gray-300 mb-4">
                  This Privacy Notice for <strong>Zigsaw</strong> ("we," "us," or "our") describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Visit our website at <span className="text-blue-400">zigsaw.dev</span> or any website of ours that links to this Privacy Notice</li>
                  <li>Use Zigsaw - an AI-driven workflow automation platform that democratizes automation through natural language interfaces and visual workflow builders</li>
                  <li>Engage with us in other related ways, including any sales, marketing, or events</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">Questions or concerns?</h3>
                <p className="text-gray-300 mb-4">
                  Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <span className="text-blue-400">zigsaw.agent@gmail.com</span>.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">SUMMARY OF KEY POINTS</h3>
                <div className="space-y-4 text-gray-300">
                  <p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>
                  
                  <p><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</p>
                  
                  <p><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
                  
                  <p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
                  
                  <p><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information.</p>
                  
                  <p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">1. WHAT INFORMATION DO WE COLLECT?</h3>
                <div className="space-y-4 text-gray-300">
                  <h4 className="text-lg font-semibold text-white">Personal information you disclose to us</h4>
                  <p><strong>In Short:</strong> We collect personal information that you provide to us.</p>
                  <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
                  
                  <p><strong>Personal Information Provided by You.</strong> The personal information that we collect may include the following:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Names</li>
                    <li>Phone numbers</li>
                    <li>Email addresses</li>
                  </ul>
                  
                  <p><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases. All payment data is handled and stored by Stripe. You may find their privacy notice at: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">https://stripe.com/privacy</a></p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">2. HOW DO WE PROCESS YOUR INFORMATION?</h3>
                <div className="space-y-4 text-gray-300">
                  <p><strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
                  <p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>To facilitate account creation and authentication</strong> and otherwise manage user accounts</li>
                    <li><strong>To save or protect an individual's vital interest</strong> when necessary to prevent harm</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">3. HOW LONG DO WE KEEP YOUR INFORMATION?</h3>
                <div className="space-y-4 text-gray-300">
                  <p><strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
                  <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">4. HOW DO WE KEEP YOUR INFORMATION SAFE?</h3>
                <div className="space-y-4 text-gray-300">
                  <p><strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.</p>
                  <p>We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h3>
                <div className="space-y-4 text-gray-300">
                  <p><strong>In Short:</strong> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</p>
                  <p>As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, "AI Products"). These tools are designed to enhance your experience and provide you with innovative solutions.</p>
                  <p>We provide the AI Products through third-party service providers including Anthropic, OpenAI, Google Cloud AI, and others. Your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">6. WHAT ARE YOUR PRIVACY RIGHTS?</h3>
                <div className="space-y-4 text-gray-300">
                  <p><strong>In Short:</strong> Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information.</p>
                  <p>In some regions, you have certain rights under applicable data protection laws. These may include the right to request access and obtain a copy of your personal information, to request rectification or erasure, to restrict the processing of your personal information, and to data portability.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">7. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h3>
                <div className="space-y-4 text-gray-300">
                  <p>If you have questions or comments about this notice, you may email us at <span className="text-blue-400">zigsaw.agent@gmail.com</span></p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                  This privacy policy was last updated on August 01, 2025. We may update this notice from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Zigsaw. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
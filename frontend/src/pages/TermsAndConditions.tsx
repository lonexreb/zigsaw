const TermsAndConditions = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-gray-400 text-lg">Please read these terms carefully before using our services</p>
        </div>

        {/* Terms and Conditions Content */}
        <div className="max-w-4xl mx-auto prose prose-invert">
          <div className="bg-gray-900 p-8 rounded-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">TERMS AND CONDITIONS</h2>
                <p className="text-gray-300 mb-4">
                  <strong>Last updated:</strong> August 01, 2025
                </p>
              </div>

              <div>
                <p className="text-gray-300 mb-4">
                  Welcome to <strong>Zigsaw</strong>! These Terms and Conditions ("Terms") govern your use of our AI-driven workflow automation platform and services (collectively, the "Services") operated by Zigsaw ("we," "us," or "our").
                </p>
                <p className="text-gray-300 mb-4">
                  By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Services.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">1. ACCEPTANCE OF TERMS</h3>
                <div className="space-y-4 text-gray-300">
                  <p>By creating an account or using Zigsaw, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.</p>
                  <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">2. DESCRIPTION OF SERVICE</h3>
                <div className="space-y-4 text-gray-300">
                  <p>Zigsaw is an AI-driven workflow automation platform that enables users to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Create automated workflows using natural language interfaces</li>
                    <li>Build visual workflow automations with drag-and-drop functionality</li>
                    <li>Integrate with multiple AI providers and external services</li>
                    <li>Deploy workflows as APIs with real-time execution monitoring</li>
                    <li>Connect to 100+ services and applications</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">3. USER ACCOUNTS AND REGISTRATION</h3>
                <div className="space-y-4 text-gray-300">
                  <p>To use certain features of our Services, you must register for an account. You agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>Be responsible for all activities that occur under your account</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">4. ACCEPTABLE USE POLICY</h3>
                <div className="space-y-4 text-gray-300">
                  <p>You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Violate any applicable laws, regulations, or third-party rights</li>
                    <li>Use the Services to create, store, or transmit harmful, offensive, or illegal content</li>
                    <li>Attempt to gain unauthorized access to our systems or networks</li>
                    <li>Interfere with or disrupt the Services or servers</li>
                    <li>Use the Services to spam, harass, or send unsolicited communications</li>
                    <li>Reverse engineer, decompile, or attempt to extract source code</li>
                    <li>Resell, redistribute, or create derivative works based on our Services</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">5. AI SERVICES AND THIRD-PARTY INTEGRATIONS</h3>
                <div className="space-y-4 text-gray-300">
                  <p>Our platform integrates with various AI service providers and third-party applications. You acknowledge that:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Use of AI services is subject to the terms and policies of respective providers</li>
                    <li>We are not responsible for the performance, availability, or content of third-party services</li>
                    <li>You must comply with all applicable terms of service for integrated platforms</li>
                    <li>AI-generated content may not always be accurate and should be reviewed before use</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">6. SUBSCRIPTION AND BILLING</h3>
                <div className="space-y-4 text-gray-300">
                  <p>Our Services are offered under various subscription plans:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Free Plan:</strong> Limited features with basic AI models and integrations</li>
                    <li><strong>Pro Plan:</strong> Advanced features with priority support</li>
                    <li><strong>Enterprise Plan:</strong> Full features with dedicated support</li>
                  </ul>
                  <p>Billing terms:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                    <li>All payments are processed securely through Stripe</li>
                    <li>You may cancel your subscription at any time</li>
                    <li>Refunds are provided according to our refund policy</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">7. INTELLECTUAL PROPERTY RIGHTS</h3>
                <div className="space-y-4 text-gray-300">
                  <p>The Services and all content, features, and functionality are owned by Zigsaw and are protected by intellectual property laws.</p>
                  <p><strong>Your Content:</strong> You retain ownership of any content you create or upload. By using our Services, you grant us a license to use, process, and display your content solely to provide the Services.</p>
                  <p><strong>Generated Content:</strong> Content generated through our AI services may be used by you according to the terms of the respective AI service providers.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">8. DATA SECURITY AND PRIVACY</h3>
                <div className="space-y-4 text-gray-300">
                  <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
                  <p>For detailed information about how we collect, use, and protect your personal information, please review our <a href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">9. LIMITATION OF LIABILITY</h3>
                <div className="space-y-4 text-gray-300">
                  <p>To the maximum extent permitted by law, Zigsaw shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Services.</p>
                  <p>Our total liability to you for any claim arising out of these Terms or the Services shall not exceed the amount you paid to us in the twelve months preceding the claim.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">10. DISCLAIMERS</h3>
                <div className="space-y-4 text-gray-300">
                  <p>The Services are provided "as is" and "as available" without warranties of any kind, either express or implied.</p>
                  <p>We do not guarantee that the Services will be uninterrupted, error-free, or completely secure.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">11. TERMINATION</h3>
                <div className="space-y-4 text-gray-300">
                  <p>We may terminate or suspend your account and access to the Services immediately, without prior notice, for any breach of these Terms.</p>
                  <p>You may terminate your account at any time by contacting us or through your account settings.</p>
                  <p>Upon termination, your right to use the Services will cease immediately.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">12. GOVERNING LAW</h3>
                <div className="space-y-4 text-gray-300">
                  <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Zigsaw is incorporated, without regard to conflict of law principles.</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">13. CONTACT INFORMATION</h3>
                <div className="space-y-4 text-gray-300">
                  <p>If you have any questions about these Terms and Conditions, please contact us at:</p>
                  <p>
                    Email: <span className="text-blue-400">zigsaw.agent@gmail.com</span><br/>
                    Website: <span className="text-blue-400">zigsaw.dev</span>
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                  These Terms and Conditions were last updated on August 01, 2025. We reserve the right to update these terms at any time. Continued use of our Services after any changes constitutes acceptance of the new terms.
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

export default TermsAndConditions;
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  NestNavigateLogo,
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon
 } from '../../assets'

// Modal Components
const Modal = ({ isOpen, onClose, title, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const PublicFooter: React.FC = () => {
  const navigate = useNavigate()
  const [accessibilityModal, setAccessibilityModal] = useState(false)
  const [privacyModal, setPrivacyModal] = useState(false)
  const [termsModal, setTermsModal] = useState(false)
  
  return (
    <>
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Main Footer Content */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-8 lg:space-y-0">
            
            {/* Left Section - Logo and Copyright */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <Link to="/splash" className="flex items-center">
                  <img 
                    src={NestNavigateLogo} 
                    alt="Nest Navigate" 
                    className="h-8 w-auto" 
                  />
                </Link>
              </div>
              <p className="text-gray-500 text-sm">
               © 2025 Nest Navigate, Inc. All rights reserved.
              </p>
            </div>

            {/* Center Section - Navigation Links + Sign Up Button */}
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              {/* Navigation Links */}
              <nav className="flex flex-wrap gap-x-8 gap-y-4 justify-center">
                <Link 
                  to="/how-it-works" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
                >
                  How It Works
                </Link>
                <Link 
                  to="/about" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
                >
                  About
                </Link>
                <Link 
                  to="/rewards" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
                >
                  Rewards
                </Link>
                <Link 
                  to="/contact" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
                >
                  Contact
                </Link>
              </nav>

              {/* Sign Up Button */}
              <button
                onClick={() => navigate('/auth/signup')}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                style={{ backgroundColor: '#3F6CB9' }}
              >
                Sign Up
              </button>
            </div>

            {/* Right Section - Social Media Icons */}
            <div className="flex items-center space-x-4">
              <a 
                href="#" 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="YouTube"
              >
                <img src={YouTubeIcon} alt="YouTube" className="w-7 h-7" />
              </a>
              
              <a 
                href="#" 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Facebook"
              >
                <img src={FacebookIcon} alt="Facebook" className="w-7 h-7" />
              </a>

              <a 
                href="#" 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Twitter"
              >
                <img src={TwitterIcon} alt="Twitter" className="w-7 h-7" />
              </a>
              
              <a 
                href="#" 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Instagram"
              >
                <img src={InstagramIcon} alt="Instagram" className="w-7 h-7" />
              </a>
              
              <a 
                href="#" 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="LinkedIn"
              >
                <img src={LinkedInIcon} alt="LinkedIn" className="w-7 h-7" />
              </a>
            </div>
          </div>

          {/* Bottom Section - Legal Links and Blog */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* Legal Links */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <button
                  onClick={() => setAccessibilityModal(true)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Accessibility
                </button>
                <button
                  onClick={() => setPrivacyModal(true)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setTermsModal(true)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Terms & Conditions
                </button>
              </div>

              {/* Discreet Blog Link */}
              <a
                href="#"
                className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
              >
                Blog
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Accessibility Modal */}
      <Modal
        isOpen={accessibilityModal}
        onClose={() => setAccessibilityModal(false)}
        title="Nest Navigate™ Accessibility Statement"
      >
        <div className="space-y-6 text-sm text-gray-700">
          <p className="text-xs text-gray-500 font-medium">Effective Date: 09/19/2025</p>
          
          <p>
            Nest Navigate Inc. ("Nest Navigate," "we," "our," or "us") is committed to making our website, mobile applications, and services accessible to individuals with disabilities.
          </p>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">1. Commitment to Accessibility</h3>
            <p>We strive to follow recognized accessibility standards, including the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>, to make our digital properties usable for as many people as possible.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">2. Ongoing Efforts</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>We regularly review and update our website and applications for accessibility.</li>
              <li>Some content, features, or partner integrations may not yet meet all accessibility standards. We are actively working to improve.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">3. Alternative Access</h3>
            <p>If you encounter any difficulty using our site or services due to a disability, you may request assistance by contacting us:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Email:</strong> <a href="mailto:eric@nestnavigate.com" className="text-blue-600 hover:underline">eric@nestnavigate.com</a></li>
              <li><strong>Phone:</strong> <a href="tel:949-683-7472" className="text-blue-600 hover:underline">(949) 683-7472</a></li>
            </ul>
            <p>We will make reasonable efforts to provide the information, item, or transaction you need through an accessible communication method (for example, telephone support).</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">4. No Guarantee / Limitation of Liability</h3>
            <p>While we are committed to accessibility, <strong>we do not guarantee that our Services are error-free or accessible to every individual's specific needs or assistive technology.</strong> By using our Services, you agree that your sole remedy for accessibility issues is to contact us for assistance.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">5. Dispute Resolution</h3>
            <p>Any disputes related to accessibility will follow the <strong>dispute resolution process in our Terms & Conditions</strong>, including mandatory <strong>mediation and arbitration in California</strong>, waiver of jury trial, and limitation of remedies.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">7. Intellectual Property</h3>
            <p>All content, branding, and technology of Nest Navigate are protected intellectual property. Users may not copy, distribute, or exploit them without prior written consent.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">8. Limitation of Liability</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Services are provided "AS IS" and "AS AVAILABLE."</li>
              <li>Nest Navigate disclaims all liability, including for lost profits, data, indirect or consequential damages.</li>
              <li>Your sole remedy is to stop using the Services.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">9. Indemnification</h3>
            <p>You agree to indemnify and hold harmless Nest Navigate, its officers, directors, employees, and affiliates against any claims, damages, or liabilities arising from your use of the Services or partner offers.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">10. Dispute Resolution & Legal Costs</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>All disputes must first go to <strong>confidential mediation in California</strong>.</li>
              <li>If unresolved, disputes will proceed to <strong>binding arbitration in California</strong> under AAA rules.</li>
              <li>You waive rights to jury trial and class action claims.</li>
              <li><strong>Even if you prevail, you are responsible for your own legal costs and must reimburse Nest Navigate's reasonable attorneys' fees and expenses.</strong></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">11. Termination</h3>
            <p>Nest Navigate may suspend or terminate accounts at any time, with or without cause.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">12. Severability</h3>
            <p>If any provision of these Terms is held invalid or unenforceable, the remainder will remain in effect.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">13. Governing Law</h3>
            <p>These Terms are governed by the laws of the State of California and apply nationwide to all U.S. users, subject to applicable state privacy rights.</p>
          </div>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={privacyModal}
        onClose={() => setPrivacyModal(false)}
        title="Nest Navigate™ Privacy Policy"
      >
        <div className="space-y-6 text-sm text-gray-700">
          <p className="text-xs text-gray-500 font-medium">Effective Date: 09/19/2025</p>
          
          <p>
            Nest Navigate Inc. ("Nest Navigate," "we," "our," or "us") values transparency and is committed to protecting your privacy while maintaining flexibility in how we use information. This Privacy Policy applies to all users of our Services in the United States and is designed to comply with the <strong>California Consumer Privacy Act ("CCPA")</strong> and other applicable state privacy laws.
          </p>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">1. Information We Collect</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Personal Data:</strong> name, email, phone, address, and account credentials.</li>
              <li><strong>Behavioral Data:</strong> progress through education modules, in-app actions, browsing, and redemptions.</li>
              <li><strong>Transactional Data:</strong> purchases, affiliate offers, and reward activity.</li>
              <li><strong>Technical Data:</strong> IP address, device IDs, cookies, analytics.</li>
              <li><strong>Third-Party Data:</strong> from brokers, lenders, affiliates, and partners.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">2. How We Use Information</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>To operate and improve Services.</li>
              <li>To issue and manage <strong>Nest Coins™</strong>.</li>
              <li>To market and deliver offers from Nest Navigate and third-party partners.</li>
              <li>To analyze and create <strong>anonymized or aggregated datasets</strong> that may be sold, licensed, or otherwise monetized.</li>
              <li>To comply with laws and enforce our Terms.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">3. Sharing & Monetization</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>We may share, license, sell, or commercialize user data with partners and affiliates (e.g., U-Haul, Best Buy).</li>
              <li>Aggregated/anonymized data may be retained and monetized indefinitely, including after account closure.</li>
              <li>By using the Services, you consent to all described uses.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">4. CCPA/CPRA & State Privacy Rights</h3>
            <p>California and other state residents have the following rights, subject to verification of identity:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Right to Know/Access:</strong> You may request disclosure of the categories and specific pieces of personal information we collect, use, disclose, sell, or share.</li>
              <li><strong>Right to Delete:</strong> You may request that we delete personal information, subject to exceptions.</li>
              <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information.</li>
              <li><strong>Right to Opt-Out of Sale/Sharing:</strong> You may opt out of the sale or sharing of personal information at any time by using the "Do Not Sell or Share My Personal Information" link available on our website and app, or by contacting us at <a href="mailto:eric@nestnavigate.com" className="text-blue-600 hover:underline">eric@nestnavigate.com</a>.</li>
              <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> If we collect sensitive personal information (such as precise geolocation, government IDs, or financial data), you may limit its use and disclosure to only those purposes necessary to perform our services.</li>
            </ul>
            <p className="mt-2">We will respond to verified consumer requests within <strong>45 days</strong>, with the option to extend an additional 45 days (for a total of 90 days) if reasonably necessary, as permitted by law. We may deny requests that are excessive, repetitive, or conflict with legal/business needs. Once deleted or anonymized, data may not be recoverable.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">5. Retention</h3>
            <p>We retain personal information only for as long as necessary to fulfill the purposes described in this Privacy Policy, or as required by law. Retention periods may vary by data category and business purpose, for example:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Personal Data</strong> (e.g., account info): retained for the duration of your account plus 2 years.</li>
              <li><strong>Behavioral Data</strong> (e.g., in-app progress, activity logs): retained up to 3 years for analytics and product improvement.</li>
              <li><strong>Transactional Data</strong> (e.g., purchases, rewards): retained for 7 years to comply with financial and tax obligations.</li>
              <li><strong>Technical Data</strong> (e.g., device identifiers, cookies): retained 2 years, unless anonymized earlier.</li>
              <li><strong>Third-Party Data</strong> (from affiliates, brokers, lenders): retained in alignment with contractual obligations and subject to anonymization.</li>
            </ul>
            <p className="mt-2">Aggregated or anonymized data may be retained and monetized indefinitely, including after account closure, as permitted by law.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">6. Security</h3>
            <p>We use reasonable safeguards but cannot guarantee absolute security.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">7. Children</h3>
            <p>Services are not directed to individuals under 18.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">8. Updates</h3>
            <p>We may update this Privacy Policy from time to time. If we make material changes, we will provide notice by updating the effective date at the top of this page and, where required by law, by providing direct notice (e.g., email, in-app notification). Continued use of our Services after such notice means you accept the updated policy.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">9. Severability</h3>
            <p>If any provision is found invalid or unenforceable, the remainder shall remain in effect.</p>
          </div>
        </div>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        isOpen={termsModal}
        onClose={() => setTermsModal(false)}
        title="Nest Navigate™ Terms & Conditions"
      >
        <div className="space-y-6 text-sm text-gray-700">
          <p className="text-xs text-gray-500 font-medium">Effective Date: September 19, 2025</p>
          
          <p>By accessing or using Nest Navigate's Services, you agree to these Terms.</p>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">1. Services</h3>
            <p>Nest Navigate provides gamified homebuyer education modules and issues <strong>Nest Coins™</strong> rewards. Services may be modified, suspended, or discontinued at any time without liability.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">2. Rewards</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Nest Coins™</strong> currently have no cash value but may be in the future and are non-transferable.</li>
              <li>At Nest Navigate's sole discretion, <strong>Nest Coins™ may in the future be exchangeable for currency or other services</strong>. No present right or guarantee exists.</li>
              <li>Partner offers and rewards are fulfilled by third parties. Nest Navigate is not liable for partner products or services.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">3. User Responsibilities</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>You must be 18+ and provide accurate account information.</li>
              <li>You agree not to misuse the Services, including by fraud, hacking, scraping, or reverse engineering.</li>
              <li>You are responsible for safeguarding your account credentials.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">4. Data Use & Monetization</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>By using the Services, you grant Nest Navigate a <strong>perpetual, worldwide, irrevocable license</strong> to collect, use, analyze, sell, share, license, and otherwise monetize your personal, transactional, behavioral, and technical data.</li>
              <li>Data may be retained, shared, and monetized even after account termination or deletion, as permitted by law.</li>
              <li>You will not receive compensation for Nest Navigate's use of data.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">5. Privacy Rights (CCPA/CPRA and Similar State Laws)</h3>
            <p>If you are a California resident (or live in a state with similar laws), you have rights described in our <strong>Privacy Policy</strong>, including:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Right to know/access</li>
              <li>Right to delete</li>
              <li>Right to correct</li>
              <li>Right to opt out of sale/sharing</li>
              <li>Right to limit use of sensitive personal information</li>
              <li>Users may exercise their rights, including the right to opt out of the sale or sharing of personal information, by using the 'Do Not Sell or Share My Personal Information' link provided on our website or app.</li>
            </ul>
            <p className="mt-2">These rights may be exercised through the methods described in our Privacy Policy.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">6. Data Requests & Timing</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Verified consumer requests will be processed within <strong>45 days</strong>, with one possible 45-day extension if reasonably necessary, as permitted by law.</li>
              <li>Requests may be denied if repetitive, excessive, or conflicting with ongoing business or legal obligations.</li>
              <li>Once data is deleted or anonymized, recovery may not be possible.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">7. Competitor Use Prohibited</h3>
            <p>You may not access or use Nest Navigate's Services if you are a <strong>Competitor</strong>. For purposes of these Terms, "Competitor" means any individual, company, or organization that develops, offers, or intends to develop or offer products, services, or software that are similar to or compete with any aspect of Nest Navigate's platform, features, rewards system, or business model.</p>
            <p className="mt-2">Nest Navigate reserves the right, in its sole discretion, to determine whether an entity or individual qualifies as a Competitor. Accounts found to be operated by or on behalf of Competitors may be suspended or terminated immediately, and Nest Navigate may pursue <strong>injunctive relief, cease-and-desist demands, or other legal remedies</strong> to protect its rights and regardless of outcome, Competitor will pay all legal costs.</p>
            <p className="mt-2">Any Competitor who accesses or uses Nest Navigate's Services in violation of these Terms shall be liable for all damages, losses, costs, and expenses (including attorneys' fees) incurred by Nest Navigate in investigating, enforcing, or litigating such violation. <strong>Competitor agrees to indemnify and reimburse Nest Navigate for all such costs, regardless of the outcome of any claim, defense, or proceeding.</strong></p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">8. Competitor Use & Liability</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p><strong>Competitor Use Prohibited.</strong> You may not access or use Nest Navigate's Services if you are a <strong>Competitor</strong>. A "Competitor" means any individual, company, or organization that develops, offers, or intends to develop or support companies financially including investors to offer products, services, or software that are similar to, or compete with, any aspect of Nest Navigate's platform, features, rewards system, or business model.</p>
              <p className="mt-2">Nest Navigate reserves the right, in its sole discretion, to determine whether an entity or individual qualifies as a Competitor.</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p><strong>Competitor Liability.</strong> Any Competitor who accesses or uses Nest Navigate's Services in violation of these Terms shall be liable for all damages, losses, costs, and expenses (including reasonable attorneys' fees) incurred by Nest Navigate in investigating, enforcing, or litigating such violation. Competitor agrees to indemnify and reimburse Nest Navigate for all such costs, <strong>regardless of the outcome</strong> of any claim, defense, or proceeding.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">9. TCPA & Communications Consent</h3>
            <p><strong>Communications Consent.</strong> By providing your phone number, email, or other contact information, you expressly consent to receive calls, text messages, emails, and other communications (including via automatic telephone dialing systems and prerecorded messages) from Nest Navigate, its affiliates, and its partners (including Realtors, mortgage loan officers, and service providers) related to your use of the Services, offers, rewards, and transactions.</p>
            <p className="mt-2">Consent to receive these communications is a <strong>condition of using the Services</strong>. You may opt out at any time by following the instructions provided in any communication, but doing so may limit or disable certain features of the Services.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">10. Notice & Cure Requirement</h3>
            <p><strong>Notice and Cure.</strong> Before bringing any claim or initiating any arbitration, you must first provide Nest Navigate with written notice of the dispute and a reasonable description of the claim at <a href="mailto:eric@nestnavigate.com" className="text-blue-600 hover:underline">eric@nestnavigate.com</a>. Nest Navigate shall have <strong>thirty (30) days</strong> from receipt of such notice to resolve the matter to your satisfaction. This notice and cure period is a <strong>mandatory condition precedent</strong> to the initiation of any arbitration or legal proceeding.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">11. Communications Consent</h3>
            <p>By providing your phone number, email address, or other contact information, you expressly consent to receive communications from Nest Navigate, its affiliates, partners, Realtors, Mortgage Loan Officers ("MLOs"), and other partners or participants in the Nest Navigate ecosystem. These communications may include calls, text messages, mail, targeted advertisement, emails, and in-app notifications regarding educational content, rewards, offers, services, or opportunities.</p>
            <p className="mt-2">You acknowledge and agree that:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Such communications may be generated using automated technology (including auto dialers, prerecorded messages, A.I. systems, human reaching out or text messaging systems).</li>
              <li>Consent to receive these communications is not a condition of using Nest Navigate's Services.</li>
              <li>Standard messaging and data rates may apply.</li>
              <li>You may opt out of marketing communications at any time by following the unsubscribe instructions provided in the message or by contacting us at <a href="mailto:privacy@nestnavigate.com" className="text-blue-600 hover:underline">privacy@nestnavigate.com</a>.</li>
            </ul>
            <p className="mt-2">Nest Navigate is not responsible for, and disclaims liability relating to, communications sent by independent third-party partners (including Realtors and MLOs or other businesses or individuals) once your contact information has been shared in accordance with this Policy.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">12. User Content, Communications & Third-Party Messaging</h3>
            <p>Users may upload content (including profile pictures, messages, and other submissions) and may use chat or messaging features to communicate with each other or with third parties (including Realtors, Mortgage Loan Officers, lenders, and service providers). You acknowledge and agree that:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Content Restrictions:</strong> You may not upload, post, share, or transmit any content that is unlawful, obscene, hateful, harassing, defamatory, pornographic, misleading, or otherwise inappropriate.</li>
              <li><strong>Responsibility:</strong> You are solely responsible for the content of your communications and any consequences thereof.</li>
              <li><strong>No Liability:</strong> Nest Navigate does not pre-screen or actively monitor all content or communications and is not responsible or liable for (a) the content of messages exchanged between Users, (b) communications from third parties such as Realtors, MLOs, or service providers, or (c) any promises, offers, or representations made in such communications.</li>
              <li><strong>Enforcement Rights:</strong> Nest Navigate reserves the right, but not the obligation, to review, restrict, remove, or suspend accounts and content that violate these Terms or applicable law.</li>
              <li><strong>Indemnification:</strong> Users agree to indemnify and hold Nest Navigate harmless from any claims, damages, or liabilities arising from their content, communications, or interactions with other Users or third parties.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">13. No Liability for Homebuyer or Third-Party Conduct</h3>
            <p>Nest Navigate is an educational and rewards platform. We do not broker, underwrite, guarantee, or assume responsibility for any real estate, mortgage, or financial transaction. You acknowledge that Nest Navigate merely connects users with third parties (including homebuyers, Realtors, mortgage loan officers, lenders, and service providers), and Nest Navigate is not responsible or liable for the actions, defaults, or misconduct of any homebuyer, Realtor, MLO, lender, or other third party with whom you may interact through the Services.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">14. Educational Content & Disclaimers</h3>
            <p>Nest Navigate provides educational modules, gamified experiences, and informational content for general educational purposes only. While we strive to keep our content current and accurate, we do not warrant or guarantee that any content provided through the Services is complete, reliable, up to date, or suitable for your particular situation.</p>
            <p className="mt-2"><strong>No Professional Advice.</strong> The educational content, modules, or rewards provided by Nest Navigate or its affiliates are not legal, financial, tax, or real estate advice. You should consult with qualified professionals before making any financial, real estate, or other decisions.</p>
            <p className="mt-2"><strong>No Liability.</strong> Nest Navigate is not responsible or liable for any errors, omissions, or outdated information in its educational content, gamified modules, or communications, nor for any decisions made by users in reliance on such content. Use of the Services is at your own risk.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default PublicFooter
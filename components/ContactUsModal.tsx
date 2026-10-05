/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MailIcon, CheckIcon, SparklesIcon } from './icons';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
  const contactEmail = 'sabhyamtrivedy@gmail.com';
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [topic, setTopic] = useState('Fitting Support');
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Construct mailto link so user can immediately send from their email client as well
    const subject = encodeURIComponent(`[Sabhyam AI - ${topic}] Message from ${name || 'Customer'}`);
    const body = encodeURIComponent(
      `Hi Sabhyam AI Team,\n\n${message}\n\nFrom: ${name || 'User'}\nReply-To: ${userEmail || 'N/A'}`
    );

    window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, '_blank');
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setName('');
      setUserEmail('');
      setMessage('');
      onClose();
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-gray-950 via-purple-950 to-gray-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-pink-400 shadow-inner">
                <MailIcon className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                  Contact Us
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Have questions, feedback, or custom requests? We&apos;d love to hear from you.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-grow text-gray-900">
            {/* Direct Email Card with 1-Click Copy */}
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <MailIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                    Direct Official Email
                  </span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-sm font-bold text-purple-950 hover:text-purple-700 underline transition-colors"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <span>Copy Email</span>
                  )}
                </button>

                <a
                  href={`mailto:${contactEmail}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-2xs transition-all"
                >
                  Send Mail
                </a>
              </div>
            </div>

            {/* Inquiry Form */}
            {sentSuccess ? (
              <div className="py-10 flex flex-col items-center justify-center text-center p-6 bg-green-50 rounded-2xl border border-green-200">
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mb-3">
                  <CheckIcon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-serif font-bold text-green-950">
                  Opening Your Email Client
                </h4>
                <p className="text-xs text-green-800 mt-1 max-w-sm">
                  Your message has been formatted for <strong>{contactEmail}</strong>. We typically respond within 24 hours!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Inquiry Topic
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      'Fitting Support',
                      'Style Advice',
                      'Brand Collab',
                      'Feature Request',
                    ].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTopic(t)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          topic === t
                            ? 'bg-purple-600 border-purple-600 text-white font-bold shadow-2xs'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shailesh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Your Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Your Message / Feedback
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you'd like to see, or any questions about your virtual try-on..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <SparklesIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Founder-led response within 24h</span>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-pink-600 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md active:scale-95"
                  >
                    Send to {contactEmail}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Sabhyam AI Virtual Fitting Studio</span>
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-black font-semibold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ContactUsModal;

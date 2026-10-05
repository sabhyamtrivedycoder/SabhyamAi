/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MailIcon, CheckIcon } from './icons';

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

    const subject = encodeURIComponent(`[Sabhyam AI - ${topic}] Inquiry from ${name || 'User'}`);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.08] overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans"
        >
          {/* Header matching Neurapex clean aesthetic */}
          <div className="p-6 sm:p-7 border-b border-black/[0.06] bg-white flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-serif text-[#111827] tracking-tight">
                <span className="font-normal">Get in </span>
                <span className="font-normal italic">Touch</span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 font-sans">
                Direct founder & support channel at Sabhyam AI Solutions.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#9ca3af] hover:text-[#111827] rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-grow text-[#111827]">
            {/* Direct Email Card matching Neurapex soft elevated button style */}
            <div className="p-4 bg-[#fafaf9] border border-black/[0.06] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.08] text-[#111827] flex items-center justify-center shrink-0 shadow-2xs">
                  <MailIcon className="w-4 h-4 text-[#111827]" />
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#6b7280] block">
                    Direct Email
                  </span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-xs sm:text-sm font-semibold text-[#111827] hover:underline transition-colors"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs ${
                    copied
                      ? 'bg-[#111827] text-white'
                      : 'bg-white hover:bg-gray-50 text-[#374151] border border-black/[0.08]'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>

                <a
                  href={`mailto:${contactEmail}`}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-gray-50 text-[#111827] border border-black/[0.08] shadow-2xs transition-all"
                >
                  Compose
                </a>
              </div>
            </div>

            {/* Inquiry Form */}
            {sentSuccess ? (
              <div className="py-10 flex flex-col items-center justify-center text-center p-6 bg-[#fafaf9] rounded-2xl border border-black/[0.06]">
                <div className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center mb-3">
                  <CheckIcon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-serif font-normal text-[#111827]">
                  Opening Your Email Client
                </h4>
                <p className="text-xs text-[#6b7280] mt-1 max-w-sm">
                  Your message has been addressed to <strong>{contactEmail}</strong>. We reply within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6b7280] mb-1.5">
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
                        className={`py-1.5 px-2 rounded-xl text-xs transition-all ${
                          topic === t
                            ? 'bg-[#111827] text-white font-medium shadow-sm'
                            : 'bg-white border border-black/[0.08] text-[#4b5563] hover:text-[#111827]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6b7280] mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shailesh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#fafaf9] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6b7280] mb-1">
                      Your Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#fafaf9] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6b7280] mb-1">
                    Your Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you'd like to see, or any questions about your virtual try-on..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs p-3 bg-[#fafaf9] border border-black/[0.08] rounded-xl focus:bg-white focus:outline-none focus:border-black transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#6b7280]">
                    Response within 24h
                  </span>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-white text-[#111827] hover:bg-[#fafaf9] border border-black/[0.1] rounded-xl text-xs font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all active:scale-98"
                  >
                    Send Email &rarr;
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-[#fafaf9] border-t border-black/[0.06] flex items-center justify-between text-xs text-[#6b7280]">
            <span>Sabhyam AI Solutions Pvt Ltd.</span>
            <button
              onClick={onClose}
              className="text-[#111827] hover:underline font-medium"
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

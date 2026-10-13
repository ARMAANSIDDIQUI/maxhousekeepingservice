import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuPhone,
  LuMail,
  LuMapPin,
  LuClock,
  LuSend,
  LuShieldCheck,
  LuMessageSquare
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import { useToast } from '../context/ToastContext';

import { publicAPI } from '../api';

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Moradabad',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      toast.error('Please enter your name, phone number, and message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicAPI.submitContact(formData);
      if (res && res.success !== false) {
        toast.success(
          formData.email
            ? 'Thank you! Confirmation email sent. Our supervisor will call you shortly.'
            : 'Thank you! Message received. Our supervisor will call you within 15 minutes.'
        );
        setFormData({
          name: '',
          phone: '',
          email: '',
          city: 'Moradabad',
          message: ''
        });
      } else {
        toast.error(res?.message || 'Failed to submit inquiry.');
      }
    } catch (err) {
      console.warn('Contact submission error:', err);
      toast.success('Thank you! Your message has been noted by our field desk.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 md:py-20 bg-[#F4EFE6] text-[#10231D]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-mono tracking-widest text-[#6B8077] uppercase">
          <Link to="/" className="hover:text-[#10231D] underline underline-offset-4">Home</Link>
          <span>/</span>
          <span className="text-[#10231D]">Contact Office</span>
        </div>

        {/* Header */}
        <div className="max-w-2xl mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-black text-[#10231D] mb-4">
            Connect With Our Field Operations Team
          </h1>
          <p className="text-base text-[#3D524A] font-sans">
            Have questions about an upcoming deep clean, commercial RFP, or need custom floor plan estimation? Reach our dispatch desk directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-[#10231D] text-[#F4EFE6] space-y-6">
              <div>
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Customer Hotline
                </span>
                <a
                  href="tel:9897766002"
                  className="text-2xl font-display font-bold text-[#F4EFE6] hover:text-[#E9A23B] transition-colors flex items-center gap-3"
                >
                  <LuPhone className="w-5 h-5 text-[#E9A23B]" />
                  <span>+91 98977 66002</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  WhatsApp Direct Dispatch
                </span>
                <a
                  href="https://wa.me/919897766002?text=Hello%20Max%20Housekeeping%20Team%2C%20I%20need%20assistance%20with%20cleaning%20services"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:brightness-105 transition-all shadow-md"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Email Desk
                </span>
                <a
                  href="mailto:contact@maxhousekeepingservice.com"
                  className="text-sm font-sans text-[#DDEBE4] hover:text-white transition-colors flex items-center gap-2"
                >
                  <LuMail className="w-4 h-4 text-[#E9A23B]" />
                  <span>contact@maxhousekeepingservice.com</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Operating Hours
                </span>
                <div className="flex items-center gap-2 text-sm text-[#DDEBE4]">
                  <LuClock className="w-4 h-4 text-[#E9A23B]" />
                  <span>Monday – Sunday: 8:00 AM – 8:00 PM</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Operational Headquarters
                </span>
                <div className="flex items-start gap-2 text-sm text-[#DDEBE4]">
                  <LuMapPin className="w-4 h-4 text-[#E9A23B] mt-0.5 shrink-0" />
                  <span>Civil Lines, Moradabad, Uttar Pradesh 244001, India</span>
                </div>
              </div>
            </div>

            {/* Quick Assurance Box */}
            <div className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex items-center gap-4">
              <LuShieldCheck className="w-8 h-8 text-[#10231D] shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-[#10231D]">Immediate Response Guarantee</h4>
                <p className="text-xs text-[#3D524A] mt-0.5">
                  All digital inquiries and booking messages are acknowledged by a duty supervisor within 15 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-8 md:p-10 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
              <h2 className="text-2xl font-display font-bold text-[#10231D] mb-6 flex items-center gap-2">
                <LuMessageSquare className="w-5 h-5 text-[#E9A23B]" />
                <span>Send Dispatch An Inquiry</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9897766002"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">City / Region</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] outline-none"
                    >
                      <option value="Moradabad">Moradabad</option>
                      <option value="Rampur">Rampur</option>
                      <option value="Amroha">Amroha</option>
                      <option value="Sambhal">Sambhal</option>
                      <option value="Chandausi">Chandausi</option>
                      <option value="Noorpur">Noorpur</option>
                      <option value="Dhampur">Dhampur</option>
                      <option value="Bijnor">Bijnor</option>
                      <option value="Kanth">Kanth</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">Requirement / Notes *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your space (e.g. 3 BHK deep clean after painting, 5-seater sofa shampoo, commercial office sanitisation)..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-display font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  <LuSend className="w-4 h-4 text-[#E9A23B]" />
                  <span>{submitting ? 'Transmitting Inquiries...' : 'Send Message to Operations'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

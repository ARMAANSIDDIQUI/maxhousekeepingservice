import React, { useState, useEffect } from 'react';
import {
  LuPhone,
  LuMail,
  LuMapPin,
  LuClock,
  LuSend,
  LuShieldCheck,
  LuMessageSquare
} from 'react-icons/lu';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa6';
import { useToast } from '../context/ToastContext';

import { publicAPI } from '../api';
import { useBooking } from '../context/BookingContext';
import CustomSelect from '../components/common/CustomSelect';
import SEO from '../components/common/SEO';

export default function ContactPage() {
  const { toast } = useToast();
  const { cities, selectedCity, settings: contextSettings } = useBooking();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: selectedCity?.name || (cities.length > 0 ? (typeof cities[0] === 'string' ? cities[0] : cities[0].name) : ''),
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const settings = contextSettings || {
    brandName: 'Max Housekeeping Service',
    phone: '+91 98977 66002',
    alternatePhone: '',
    email: 'contactmaxhousekeepingservice@gmail.com',
    whatsappNumber: '+91 98977 66002',
    workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
    address: 'Kanth road, Behind Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001'
  };

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
      toast.error(err.message || 'Failed to submit inquiry. Please try again or call our hotline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 md:py-20 bg-[#F4EFE6] text-[#10231D]">
      <SEO
        title="Contact Field Operations & Support"
        description="Connect with Max Housekeeping Service dispatch desk in Moradabad. Call our hotline +91 98977 66002, WhatsApp, or send an inquiry for home and commercial cleaning."
        keywords="contact max housekeeping, cleaning service phone number, Moradabad cleaning contact, housekeeping dispatch Western UP, cleaning booking enquiry"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
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
                  href={`tel:${(settings.phone || '').replace(/[^0-9+]/g, '')}`}
                  className="text-2xl font-display font-bold text-[#F4EFE6] hover:text-[#E9A23B] transition-colors flex items-center gap-3"
                >
                  <LuPhone className="w-5 h-5 text-[#E9A23B]" />
                  <span>{settings.phone}</span>
                </a>
                {settings.alternatePhone && (
                  <a
                    href={`tel:${(settings.alternatePhone || '').replace(/[^0-9+]/g, '')}`}
                    className="text-sm font-semibold text-[#DDEBE4]/80 hover:text-[#E9A23B] transition-colors flex items-center gap-2 mt-2 ml-8"
                  >
                    <span>Alternate: {settings.alternatePhone}</span>
                  </a>
                )}
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  WhatsApp Direct Dispatch
                </span>
                <a
                  href={`https://wa.me/${(settings.whatsappNumber || '9897766002').replace(/[^0-9]/g, '')}?text=Hello%20Max%20Housekeeping%20Team%2C%20I%20need%20assistance%20with%20cleaning%20services`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:brightness-105 transition-all shadow-md"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>Chat on WhatsApp ({settings.whatsappNumber})</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Official Instagram Channel
                </span>
                <a
                  href="https://www.instagram.com/maxhousekeepingservice/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-xs font-bold hover:brightness-110 transition-all shadow-md group"
                >
                  <FaInstagram className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Follow @maxhousekeepingservice</span>
                </a>
                <p className="text-[11px] text-[#DDEBE4]/70 mt-1.5 leading-relaxed">
                  Watch live cleaning transformation reels, before & after video proofs, and direct message us for instant estimates.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Email Desk
                </span>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm font-sans text-[#DDEBE4] hover:text-white transition-colors flex items-center gap-2"
                >
                  <LuMail className="w-4 h-4 text-[#E9A23B]" />
                  <span>{settings.email}</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Operating Hours
                </span>
                <div className="flex items-center gap-2 text-sm text-[#DDEBE4]">
                  <LuClock className="w-4 h-4 text-[#E9A23B]" />
                  <span>{settings.workingHours}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2D9C8]/10">
                <span className="text-xs font-mono text-[#E9A23B] uppercase tracking-widest block mb-1">
                  Operational Headquarters
                </span>
                <div className="flex items-start gap-2 text-sm text-[#DDEBE4]">
                  <LuMapPin className="w-4 h-4 text-[#E9A23B] mt-0.5 shrink-0" />
                  <span>{settings.address}</span>
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
                <span>Send An Inquiry</span>
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
                    <span className="text-[11px] text-[#6B8077] block mt-1">
                      Enter email to receive an instant confirmation receipt of your inquiry.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">City / Region</label>
                    <CustomSelect
                      value={formData.city}
                      onChange={(val) => setFormData({ ...formData, city: val })}
                      options={cities.map((c) => {
                        const name = typeof c === 'string' ? c : (c.name || c.slug);
                        return { value: name, label: name };
                      })}
                      placeholder="Select City..."
                    />
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
                  <span>{submitting ? 'Transmitting Inquiries...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

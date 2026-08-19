import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function ThankYouPage() {
  usePageTitle('Thank You');

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0b1c30] px-6 text-center">
      {/* Background Graphic */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://raft-blast-61784561.figma.site/_assets/v11/16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png"
          alt="Abstract decorative sky background"
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-white/90 border border-[#e5eeff] backdrop-blur-xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-[#006a61]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0b1c30] mb-2 leading-none uppercase tracking-wide font-serif" style={{ fontFamily: "'Ogg Medium', Georgia, serif" }}>Success!</h1>
        <p className="text-[#0b1c30]/80 text-sm mb-6 leading-relaxed">
          Thank you for signing up to our platform. You have been successfully registered for early updates and dashboard workspace access.
        </p>
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="w-full bg-[#006a61] hover:bg-[#00524a] text-white text-xs font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/" className="block text-xs text-[#0b1c30] hover:underline transition-colors uppercase tracking-wider font-semibold">
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}

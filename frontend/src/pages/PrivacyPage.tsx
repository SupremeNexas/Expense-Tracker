import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function PrivacyPage() {
  usePageTitle('Privacy Policy');

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0b1c30] text-slate-100 p-6 md:p-12 lg:p-16">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://raft-blast-61784561.figma.site/_assets/v11/16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png"
          alt="Abstract decorative sky background"
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-normal font-serif uppercase tracking-wide" style={{ fontFamily: "'Ogg Medium', Georgia, serif" }}>
              Privacy & Legal
            </h1>
          </div>
          <Link to="/" className="text-xs uppercase tracking-widest text-[#fdf1e1] hover:underline font-bold">
            Back to Home
          </Link>
        </header>

        <main className="space-y-8 bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl leading-relaxed text-sm text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">1. Privacy Policy Overview</h2>
            <p>
              We prioritize the privacy of your financial logs and data inputs. This policy describes how we collect, store, and segment user balance lists, transaction logs, and metadata configurations securely.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">2. Data Security & Storage</h2>
            <p>
              All database values run inside logically isolated workspaces utilizing tenant keys. We ensure strict cryptographic boundary rules. Any uploaded document analyzed with the AI statement parse engines is immediately purged after metadata extraction. We use bank-grade AES-256 standard protocols.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">3. Cookie & Tracking Disclosures</h2>
            <p>
              Cookies are solely used to persist authentication session parameters (Zustand store keys and user tokens). No tracking metrics are redistributed or shared with third-party networks for marketing campaigns.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">4. Third-Party Integrations</h2>
            <p>
              Google Identity Sign-In coordinates only metadata identities required to assign your active account. Financial data endpoints are fully decoupled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">5. Contact Information</h2>
            <p>
              For legal claims or data erasure queries, message our engineering coordinators at legal@finova.example.com.
            </p>
          </section>
        </main>

        <footer className="mt-8 text-center text-xs text-slate-500">
          Last revised: August 2026. Finova Security Group.
        </footer>
      </div>
    </div>
  );
}

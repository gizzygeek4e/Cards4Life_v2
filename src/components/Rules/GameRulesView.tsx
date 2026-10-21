import React from 'react';
import { BookOpen, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { AMERICAN_JOKER_ROUNDS, CARD_POINT_VALUES } from '../../types';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';

export const GameRulesView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Heraldic Fourie Family Crest Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#0d223d] via-[#091a2f] to-[#0d223d] border-2 border-[#1b3558] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400/90 shadow-[0_0_16px_rgba(217,155,38,0.35)] shrink-0 bg-[#071322] p-0.5">
            <img src={fourieFamilyLogo} alt="Fourie Family Crest" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              FOURIE FAMILY OFFICIAL RULEBOOK
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Rules & Scoring Guide
            </h1>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Official American Joker 5-round contracts, penalty cards, and scoring mechanics
            </p>
          </div>
        </div>
      </div>

      {/* American Joker The Golden Rule Banner */}
      <div className="bg-gradient-to-r from-[#0d223d] via-[#091a2f] to-[#122844] border-2 border-amber-400/50 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🃏</span>
          <h2 className="font-display font-bold text-lg text-amber-300">
            The Golden Rule: 0-Score Preservation
          </h2>
        </div>
        <p className="text-sm text-blue-100/90 leading-relaxed">
          In American Joker Rummy, lowest cumulative score wins the championship! The first player to successfully fulfill the round contract and discard their last card <strong>goes out with exactly 0 points</strong>. All other players are penalized by counting the remaining unmelded cards held in their hands.
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300/90 pt-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>In Cards 4 Life, tapping &quot;Went Out&quot; instantly preserves 0 for that player.</span>
        </div>
      </div>

      {/* American Joker 5-Round Contracts */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <span>American Joker 5-Round Contracts</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AMERICAN_JOKER_ROUNDS.map((r) => (
            <div
              key={r.roundNumber}
              className="bg-[#0c1c30] border border-[#1b385e] rounded-2xl p-4 space-y-2 hover:border-amber-400/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-amber-400">
                  {r.name}
                </span>
                <span className="text-[11px] font-semibold text-blue-200 bg-[#071322] px-2 py-0.5 rounded border border-[#1b3558]">
                  Deal: {r.cardsDealt} Cards
                </span>
              </div>
              <p className="text-xs font-bold text-white">
                Contract: <span className="text-amber-200">{r.contract}</span>
              </p>
              <p className="text-xs text-blue-200/80 leading-relaxed">
                {r.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Card Penalty Point Values */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-white">
          Hand Penalty Card Values
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CARD_POINT_VALUES.map((cv) => (
            <div
              key={cv.label}
              className="bg-[#0c1c30] border border-[#1b385e] rounded-2xl p-4 text-center space-y-1"
            >
              <span className={`font-display text-2xl font-black ${cv.color}`}>
                {cv.points}
              </span>
              <h3 className="text-xs font-bold text-white">{cv.label}</h3>
              <p className="text-[11px] text-blue-300/80">{cv.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stepper Guide */}
      <div className="bg-[#0c1c30] border border-[#1b385e] rounded-2xl p-5 space-y-3">
        <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          Rapid Hold-to-Accelerate Stepper Tips
        </h2>
        <ul className="text-xs text-blue-100/90 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            <strong>Tap Once:</strong> Adjusts score by +1 or -1 point.
          </li>
          <li>
            <strong>Press & Hold:</strong> Automatically accelerates! Shifts smoothly to +5, then +10, and up to +25 points per tick for rapid hand tallying.
          </li>
          <li>
            <strong>Quick Card Chips:</strong> Use the dedicated <code className="text-amber-300 bg-[#071322] px-1.5 py-0.5 rounded border border-[#1b385e]">+50</code> (Joker), <code className="text-rose-300 bg-[#071322] px-1.5 py-0.5 rounded border border-[#1b385e]">+20</code> (Ace), <code className="text-blue-300 bg-[#071322] px-1.5 py-0.5 rounded border border-[#1b385e]">+10</code> (Face), and <code className="text-blue-200 bg-[#071322] px-1.5 py-0.5 rounded border border-[#1b385e]">+5</code> buttons for instant one-touch addition.
          </li>
          <li>
            <strong>Tap to Type:</strong> Tap the number in the center of the stepper to open direct numeric entry.
          </li>
        </ul>
      </div>
    </div>
  );
};


"use client";

import React, { useState } from "react";

export function ValidationPolicyDisclosure() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm mb-12">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 bg-slate-950/60 flex items-center justify-between text-left hover:bg-slate-950 transition cursor-pointer"
				aria-expanded={isOpen}
			>
				<div className="flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-amber-400"></span>
					<h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
						Validation & Moderation Policy Specification
					</h3>
					<span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
						Security & Compliance
					</span>
				</div>
				<span className="text-xs text-slate-400 font-mono">
					{isOpen ? "▲ Hide Policy" : "▼ View Policy Details"}
				</span>
			</button>

			{isOpen && (
				<div className="p-4 sm:p-5 text-xs text-slate-300 space-y-4 border-t border-slate-800/80">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
								<span className="text-indigo-400">1.</span>{" "}
								Structural Input Constraints
							</h4>
							<ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 font-mono text-[11px]">
								<li>
									Leading & trailing whitespace automatically
									trimmed
								</li>
								<li>
									Empty or whitespace-only values strictly
									rejected
								</li>
								<li>Length enforced: maximum 50 characters</li>
								<li>
									Control characters (\u0000–\u001F,
									\u007F–\u009F) rejected
								</li>
							</ul>
						</div>

						<div className="space-y-2">
							<h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
								<span className="text-indigo-400">2.</span>{" "}
								Anti-Bypass Obfuscation Filter
							</h4>
							<ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 font-mono text-[11px]">
								<li>
									Leetspeak character mapping (@→a, $→s, 1→i,
									0→o, etc.)
								</li>
								<li>
									Repeated separator collapsing (f.u.c.k,
									f-u-c-k, f u c k)
								</li>
								<li>
									Run of repeated letters collapsed (fuuuuuck
									→ fuck)
								</li>
								<li>
									Case-insensitive evaluation on both client
									and backend
								</li>
							</ul>
						</div>
					</div>

					<div className="space-y-2 pt-2 border-t border-slate-800/60">
						<h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
							<span className="text-emerald-400">3.</span>{" "}
							Scunthorpe Problem Protection
						</h4>
						<p className="text-slate-400 leading-relaxed text-[11px]">
							Substrings resembling vulgarities in legitimate
							names are prevented from triggering false positives.
							Words such as{" "}
							<strong className="text-slate-200">
								Cassandra
							</strong>{" "}
							(contains &apos;ass&apos;),{" "}
							<strong className="text-slate-200">Dickson</strong>{" "}
							(contains &apos;dick&apos;),{" "}
							<strong className="text-slate-200">Titus</strong>{" "}
							(contains &apos;tit&apos;),{" "}
							<strong className="text-slate-200">Hancock</strong>{" "}
							(contains &apos;cock&apos;), and{" "}
							<strong className="text-slate-200">Butter</strong>{" "}
							(contains &apos;butt&apos;) are explicitly preserved
							via token boundary checking and curated legitimate
							name exemptions.
						</p>
					</div>

					<div className="space-y-2 pt-2 border-t border-slate-800/60">
						<h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
							<span className="text-purple-400">4.</span> Defense
							in Depth & Error Handling
						</h4>
						<p className="text-slate-400 leading-relaxed text-[11px]">
							Every backend write endpoint independently enforces
							the validation rules. Bypassing frontend
							verification will yield an HTTP 400 Bad Request with
							structured errors. Rejected offensive input is never
							echoed back in responses, logged to disk, or stored
							in any database.
						</p>
					</div>

					{/* Mandatory Disclaimer */}
					<div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-200/90 text-[11px] leading-relaxed">
						<strong>Important Moderation Disclaimer:</strong>{" "}
						Automated profanity and abusive-language detection is
						heuristic and imperfect. It is designed to prevent
						disruptive and offensive submissions during live
						deployment demonstrations, but is not a replacement for
						human moderation, organization-specific policies, or
						comprehensive security controls.
					</div>
				</div>
			)}
		</div>
	);
}

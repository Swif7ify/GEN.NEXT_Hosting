"use client";

import React, { useState, useCallback } from "react";
import { Header } from "../components/Header";
import { ServiceStatusSection } from "../components/ServiceStatusSection";
import { DatabasePlaygroundSection } from "../components/DatabasePlaygroundSection";
import { ConsoleLogger, LogEntry } from "../components/ConsoleLogger";
import { ValidationPolicyDisclosure } from "../components/ValidationPolicyDisclosure";

export default function HomePage() {
	const [logs, setLogs] = useState<LogEntry[]>([]);

	const addLog = useCallback(
		(entry: { type: "info" | "success" | "error"; message: string }) => {
			const newEntry: LogEntry = {
				id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
				timestamp: new Date().toLocaleTimeString(),
				type: entry.type,
				message: entry.message,
			};
			setLogs((prev) => [newEntry, ...prev.slice(0, 49)]); // keep last 50
		},
		[],
	);

	const clearLogs = () => {
		setLogs([]);
	};

	return (
		<div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
			{/* Top Navigation Bar */}
			<Header />

			{/* Main Content Area */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Intro Banner */}
				<div className="mb-8 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h2 className="text-sm font-bold text-white tracking-wide">
							Single-Page Live Deployment & Connectivity Benchmark
						</h2>
						<p className="text-xs text-slate-400 mt-0.5">
							Designed for live webinar demonstration across{" "}
							<strong>Vercel</strong> (Next.js App Router
							frontend), <strong>Render / Coolify</strong>{" "}
							(Express REST API backend), and cloud data services.
						</p>
					</div>
					<div className="flex items-center gap-2 text-xs font-mono">
						<span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
							Vercel ↔ Render ↔ Coolify
						</span>
					</div>
				</div>

				{/* SECTION A: SERVICE STATUS */}
				<ServiceStatusSection onLog={addLog} />

				{/* SECTION B: DATABASE PLAYGROUND */}
				<DatabasePlaygroundSection onLog={addLog} />

				{/* LOGGING CONSOLE */}
				<ConsoleLogger logs={logs} onClear={clearLogs} />

				{/* POLICY & MODERATION SPECIFICATION */}
				<ValidationPolicyDisclosure />
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
				<div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
					<span>
						Deployment Playground — Production Architecture Demo
					</span>
					<span>
						Next.js 15 · Express · Supabase · MongoDB · Redis
					</span>
				</div>
			</footer>
		</div>
	);
}

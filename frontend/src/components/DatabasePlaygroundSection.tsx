"use client";

import React, { useState, useMemo } from "react";
import { validateDemoName } from "../lib/nameValidator";
import {
	saveDemoRecord,
	getDemoRecords,
	checkApiHealth,
	DemoEntryRecord,
	RedisDemoRecord,
} from "../lib/apiClient";

interface DatabasePlaygroundSectionProps {
	onLog?: (entry: {
		type: "info" | "success" | "error";
		message: string;
	}) => void;
}

export function DatabasePlaygroundSection({
	onLog,
}: DatabasePlaygroundSectionProps) {
	// Form State
	const [name, setName] = useState("Ada Lovelace");
	const [backendFieldError, setBackendFieldError] = useState<string | null>(
		null,
	);
	const [bypassFrontendValidation, setBypassFrontendValidation] =
		useState(false);

	// Loading States
	const [activeAction, setActiveAction] = useState<string | null>(null);

	// Data States
	const [supabaseRecords, setSupabaseRecords] = useState<DemoEntryRecord[]>(
		[],
	);
	const [mongoRecords, setMongoRecords] = useState<DemoEntryRecord[]>([]);
	const [redisData, setRedisData] = useState<RedisDemoRecord | null>(null);
	const [apiHealthData, setApiHealthData] = useState<{
		status: string;
		uptime: number;
		timestamp: string;
	} | null>(null);

	// Status feedback bar
	const [actionFeedback, setActionFeedback] = useState<{
		type: "success" | "error" | "warning" | "info";
		message: string;
		details?: string;
	} | null>(null);

	// Derived client validation error computed directly during render (avoids cascading renders)
	const clientValidationError = useMemo(() => {
		if (bypassFrontendValidation || name.length === 0) {
			return null;
		}
		const validation = validateDemoName(name);
		return validation.isValid
			? null
			: validation.error?.message || "Invalid name";
	}, [name, bypassFrontendValidation]);

	// Combined field error: server rejection takes priority if present, otherwise client validation
	const fieldError = backendFieldError || clientValidationError;

	const handleNameChange = (newName: string) => {
		setName(newName);
		if (backendFieldError) {
			setBackendFieldError(null);
		}
	};

	// Execute client-side check before submission
	const validateBeforeSubmit = (): boolean => {
		if (bypassFrontendValidation) {
			onLog?.({
				type: "info",
				message:
					"⚠️ Frontend validation bypassed (testing backend security enforcement).",
			});
			return true;
		}

		const validation = validateDemoName(name);
		if (!validation.isValid) {
			const err = validation.error?.message || "Validation error";
			setActionFeedback({
				type: "error",
				message: `Frontend Validation Rejection: ${err}`,
			});
			onLog?.({
				type: "error",
				message: `Frontend rejected input: ${err}`,
			});
			return false;
		}
		setBackendFieldError(null);
		return true;
	};

	// ==========================================
	// SUPABASE ACTIONS
	// ==========================================
	const handleSaveSupabase = async () => {
		if (!validateBeforeSubmit()) return;

		setActiveAction("save-supabase");
		setActionFeedback(null);
		onLog?.({
			type: "info",
			message: `Sending POST /api/demo/supabase with name: "${name}"`,
		});

		try {
			const res = await saveDemoRecord("supabase", name);
			if (res.success && res.record) {
				const newRecord = res.record as DemoEntryRecord;
				setSupabaseRecords((prev) => [
					newRecord,
					...prev.filter((r) => r.id !== newRecord.id),
				]);
				setActionFeedback({
					type: "success",
					message:
						'Saved to Supabase PostgreSQL table "demo_entries".',
				});
				onLog?.({
					type: "success",
					message: `Supabase write succeeded. ID: ${newRecord.id}`,
				});
			} else {
				const errorMsg =
					res.error?.message ||
					res.message ||
					"Supabase write failed";
				if (res.error?.field === "name") {
					setBackendFieldError(`Backend rejection: ${errorMsg}`);
				}
				setActionFeedback({
					type: "error",
					message: `Supabase Error: ${errorMsg}`,
				});
				onLog?.({
					type: "error",
					message: `Supabase write failed: ${errorMsg}`,
				});
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Request failed";
			setActionFeedback({
				type: "error",
				message: `Network Error: ${msg}`,
			});
			onLog?.({
				type: "error",
				message: `Network error during Supabase write: ${msg}`,
			});
		} finally {
			setActiveAction(null);
		}
	};

	const handleFetchSupabase = async () => {
		setActiveAction("fetch-supabase");
		setActionFeedback(null);
		onLog?.({ type: "info", message: "Sending GET /api/demo/supabase" });

		try {
			const res = await getDemoRecords("supabase");
			if (res.success) {
				setSupabaseRecords((res.records as DemoEntryRecord[]) || []);
				setActionFeedback({
					type: "success",
					message: `Retrieved ${res.records?.length || 0} records from Supabase.`,
				});
				onLog?.({
					type: "success",
					message: `Retrieved ${res.records?.length || 0} Supabase records.`,
				});
			} else {
				setActionFeedback({
					type: "error",
					message: `Supabase Read Error: ${res.message || "Unable to retrieve records"}`,
				});
				onLog?.({
					type: "error",
					message: `Supabase fetch failed: ${res.message}`,
				});
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Request failed";
			setActionFeedback({
				type: "error",
				message: `Network Error: ${msg}`,
			});
			onLog?.({
				type: "error",
				message: `Network error during Supabase fetch: ${msg}`,
			});
		} finally {
			setActiveAction(null);
		}
	};

	// ==========================================
	// MONGODB ACTIONS
	// ==========================================
	const handleSaveMongo = async () => {
		if (!validateBeforeSubmit()) return;

		setActiveAction("save-mongo");
		setActionFeedback(null);
		onLog?.({
			type: "info",
			message: `Sending POST /api/demo/mongodb with name: "${name}"`,
		});

		try {
			const res = await saveDemoRecord("mongodb", name);
			if (res.success && res.record) {
				const newRecord = res.record as DemoEntryRecord;
				setMongoRecords((prev) => [
					newRecord,
					...prev.filter((r) => r.id !== newRecord.id),
				]);
				setActionFeedback({
					type: "success",
					message:
						'Saved document into MongoDB collection "demo_entries".',
				});
				onLog?.({
					type: "success",
					message: `MongoDB write succeeded. Inserted ID: ${newRecord.id}`,
				});
			} else {
				const errorMsg =
					res.error?.message || res.message || "MongoDB write failed";
				if (res.error?.field === "name") {
					setBackendFieldError(`Backend rejection: ${errorMsg}`);
				}
				setActionFeedback({
					type: "error",
					message: `MongoDB Error: ${errorMsg}`,
				});
				onLog?.({
					type: "error",
					message: `MongoDB write failed: ${errorMsg}`,
				});
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Request failed";
			setActionFeedback({
				type: "error",
				message: `Network Error: ${msg}`,
			});
			onLog?.({
				type: "error",
				message: `Network error during MongoDB write: ${msg}`,
			});
		} finally {
			setActiveAction(null);
		}
	};

	const handleFetchMongo = async () => {
		setActiveAction("fetch-mongo");
		setActionFeedback(null);
		onLog?.({ type: "info", message: "Sending GET /api/demo/mongodb" });

		try {
			const res = await getDemoRecords("mongodb");
			if (res.success) {
				setMongoRecords((res.records as DemoEntryRecord[]) || []);
				setActionFeedback({
					type: "success",
					message: `Retrieved ${res.records?.length || 0} documents from MongoDB.`,
				});
				onLog?.({
					type: "success",
					message: `Retrieved ${res.records?.length || 0} MongoDB documents.`,
				});
			} else {
				setActionFeedback({
					type: "error",
					message: `MongoDB Read Error: ${res.message || "Unable to retrieve records"}`,
				});
				onLog?.({
					type: "error",
					message: `MongoDB fetch failed: ${res.message}`,
				});
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Request failed";
			setActionFeedback({
				type: "error",
				message: `Network Error: ${msg}`,
			});
			onLog?.({
				type: "error",
				message: `Network error during MongoDB fetch: ${msg}`,
			});
		} finally {
			setActiveAction(null);
		}
	};

	// ==========================================
	// REDIS ACTIONS
	// ==========================================
	const handleSaveRedis = async () => {
		if (!validateBeforeSubmit()) return;

		setActiveAction("save-redis");
		setActionFeedback(null);
		onLog?.({
			type: "info",
			message: `Sending POST /api/demo/redis with name: "${name}"`,
		});

		try {
			const res = await saveDemoRecord("redis", name);
			if (res.success && res.record) {
				const record = res.record as RedisDemoRecord;
				setRedisData(record);
				setActionFeedback({
					type: "success",
					message:
						"Stored in Redis key-value store with 300-second expiration TTL.",
				});
				onLog?.({
					type: "success",
					message: `Redis key updated: ${record.key} (TTL: ${record.ttl_seconds}s)`,
				});
			} else {
				const errorMsg =
					res.error?.message || res.message || "Redis write failed";
				if (res.error?.field === "name") {
					setBackendFieldError(`Backend rejection: ${errorMsg}`);
				}
				setActionFeedback({
					type: "error",
					message: `Redis Error: ${errorMsg}`,
				});
				onLog?.({
					type: "error",
					message: `Redis write failed: ${errorMsg}`,
				});
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Request failed";
			setActionFeedback({
				type: "error",
				message: `Network Error: ${msg}`,
			});
			onLog?.({
				type: "error",
				message: `Network error during Redis write: ${msg}`,
			});
		} finally {
			setActiveAction(null);
		}
	};

	const handleFetchRedis = async () => {
		setActiveAction("fetch-redis");
		setActionFeedback(null);
		onLog?.({ type: "info", message: "Sending GET /api/demo/redis" });

		try {
			const res = await getDemoRecords("redis");
			if (res.success) {
				if (res.record) {
					setRedisData(res.record as RedisDemoRecord);
					setActionFeedback({
						type: "success",
						message:
							"Active cached key found and retrieved from Redis memory.",
					});
					onLog?.({
						type: "success",
						message: "Retrieved active Redis cached value.",
					});
				} else {
					setRedisData(null);
					setActionFeedback({
						type: "info",
						message:
							res.message ||
							"No active demo key in Redis (key has expired or not set).",
					});
					onLog?.({
						type: "info",
						message: "Redis get returned null (expired or unset).",
					});
				}
			} else {
				setActionFeedback({
					type: "error",
					message: `Redis Read Error: ${res.message || "Unable to get key"}`,
				});
				onLog?.({
					type: "error",
					message: `Redis fetch failed: ${res.message}`,
				});
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Request failed";
			setActionFeedback({
				type: "error",
				message: `Network Error: ${msg}`,
			});
			onLog?.({
				type: "error",
				message: `Network error during Redis fetch: ${msg}`,
			});
		} finally {
			setActiveAction(null);
		}
	};

	// ==========================================
	// INDEPENDENT API HEALTH ACTION
	// ==========================================
	const handleCheckApiHealth = async () => {
		setActiveAction("check-health");
		setActionFeedback(null);
		onLog?.({
			type: "info",
			message: "Sending GET /api/health (independent backend liveness)",
		});

		try {
			const health = await checkApiHealth();
			setApiHealthData(health);
			setActionFeedback({
				type: "success",
				message: `Express API is healthy! Server uptime: ${health.uptime}s.`,
			});
			onLog?.({
				type: "success",
				message: `API health verified: status ${health.status}, uptime ${health.uptime}s.`,
			});
		} catch (err: unknown) {
			const msg =
				err instanceof Error
					? err.message
					: "Failed to query API health";
			setActionFeedback({
				type: "error",
				message: `API Health Check Failed: ${msg}`,
			});
			onLog?.({ type: "error", message: `API health error: ${msg}` });
		} finally {
			setActiveAction(null);
		}
	};

	// Test Presets
	const applyPreset = (presetValue: string, bypass = false) => {
		setName(presetValue);
		setBypassFrontendValidation(bypass);
		setBackendFieldError(null);
	};

	return (
		<section
			className="mb-10"
			aria-labelledby="database-playground-heading"
		>
			{/* Section Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
				<div>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-cyan-500"></span>
						<h2
							id="database-playground-heading"
							className="text-base font-bold text-slate-100 tracking-wide uppercase"
						>
							Section B: Database Playground
						</h2>
					</div>
					<p className="text-xs text-slate-400 mt-1">
						Validate inputs and execute real database reads/writes
						across Supabase, MongoDB, and Redis.
					</p>
				</div>

				{/* Independent API Health Button */}
				<button
					id="btn-check-api-health"
					onClick={handleCheckApiHealth}
					disabled={activeAction === "check-health"}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 rounded-lg border border-slate-700 transition-colors focus:ring-2 focus:ring-cyan-500 cursor-pointer self-start sm:self-auto"
				>
					{activeAction === "check-health" ? (
						<>
							<svg
								className="animate-spin w-3 h-3 text-cyan-400"
								viewBox="0 0 24 24"
								fill="none"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v8H4z"
								></path>
							</svg>
							Checking API Health...
						</>
					) : (
						<>
							<span className="w-2 h-2 rounded-full bg-cyan-400"></span>
							Check API Health (Independent)
						</>
					)}
				</button>
			</div>

			{/* Form Card */}
			<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
				<div className="mb-4">
					<div className="flex items-center justify-between mb-1.5">
						<label
							htmlFor="input-demo-name"
							className="text-xs font-semibold text-slate-200"
						>
							Demonstration Name{" "}
							<span className="text-slate-400 font-normal">
								(Trimmed, max 50 chars, profanity filtered)
							</span>
						</label>
						<span
							className={`text-xs font-mono font-medium ${
								name.length > 50
									? "text-rose-400 font-bold"
									: name.length === 0
										? "text-slate-400"
										: "text-slate-400"
							}`}
						>
							{name.length} / 50 characters
						</span>
					</div>

					<div className="relative">
						<input
							id="input-demo-name"
							type="text"
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="Enter a demonstration name (e.g. Grace Hopper)..."
							maxLength={70} // Allow slight overflow so users see the length error in action
							className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
								fieldError
									? "border-rose-500 text-rose-100 focus:ring-rose-500/40"
									: "border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/30"
							}`}
						/>
						{name.length > 0 && (
							<button
								type="button"
								onClick={() => handleNameChange("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer"
								title="Clear input"
							>
								✕
							</button>
						)}
					</div>

					{/* Field-level error message */}
					{fieldError && (
						<div
							id="field-error-message"
							className="mt-2 flex items-center gap-2 text-xs text-rose-400 font-medium"
						>
							<svg
								className="w-4 h-4 flex-shrink-0 text-rose-400"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
							<span>{fieldError}</span>
						</div>
					)}

					{/* Bypass frontend validation checkbox to demonstrate backend independently validating */}
					<div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3">
						<label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer select-none">
							<input
								id="checkbox-bypass-validation"
								type="checkbox"
								checked={bypassFrontendValidation}
								onChange={(e) => {
									setBypassFrontendValidation(
										e.target.checked,
									);
									setBackendFieldError(null);
								}}
								className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
							/>
							<span>
								Simulate Direct API Call / Bypass Frontend Check{" "}
								<span className="text-[10px] text-amber-400">
									(verifies backend returns HTTP 400
									rejection)
								</span>
							</span>
						</label>
					</div>
				</div>

				{/* Quick Test Presets */}
				<div>
					<span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block mb-2">
						Webinar Demonstration Presets:
					</span>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							id="preset-valid-ada"
							onClick={() => applyPreset("Ada Lovelace")}
							className="px-2.5 py-1 text-xs rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
						>
							✓ Valid: Ada Lovelace
						</button>
						<button
							type="button"
							id="preset-scunthorpe-cassandra"
							onClick={() => applyPreset("Cassandra Titus")}
							className="px-2.5 py-1 text-xs rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 transition cursor-pointer"
							title="Contains substrings 'ass' and 'tit' but must be safely accepted"
						>
							✓ Scunthorpe Safe: Cassandra Titus
						</button>
						<button
							type="button"
							id="preset-scunthorpe-dickson"
							onClick={() => applyPreset("Dickson Hancock")}
							className="px-2.5 py-1 text-xs rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 transition cursor-pointer"
							title="Contains substrings 'dick' and 'cock' but must be safely accepted"
						>
							✓ Scunthorpe Safe: Dickson Hancock
						</button>
						<button
							type="button"
							id="preset-profanity"
							onClick={() => applyPreset("fuck")}
							className="px-2.5 py-1 text-xs rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition cursor-pointer"
						>
							✗ Direct Profanity
						</button>
						<button
							type="button"
							id="preset-leetspeak"
							onClick={() => applyPreset("b!tch")}
							className="px-2.5 py-1 text-xs rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition cursor-pointer"
						>
							✗ Leetspeak (b!tch)
						</button>
						<button
							type="button"
							id="preset-spaced"
							onClick={() => applyPreset("f-u-c-k")}
							className="px-2.5 py-1 text-xs rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition cursor-pointer"
						>
							✗ Separators (f-u-c-k)
						</button>
						<button
							type="button"
							id="preset-toolong"
							onClick={() =>
								applyPreset(
									"DevOps Architect for High Reliability Cloud Deployments Across Global Regions",
								)
							}
							className="px-2.5 py-1 text-xs rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 transition cursor-pointer"
						>
							✗ Exceeds 50 Chars
						</button>
					</div>
				</div>

				{/* Global Action Feedback Notice */}
				{actionFeedback && (
					<div
						id="action-feedback-banner"
						className={`mt-4 p-3 rounded-lg text-xs font-mono flex items-start gap-2.5 border ${
							actionFeedback.type === "success"
								? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
								: actionFeedback.type === "error"
									? "bg-rose-950/40 border-rose-800 text-rose-300"
									: actionFeedback.type === "warning"
										? "bg-amber-950/40 border-amber-800 text-amber-300"
										: "bg-slate-800 border-slate-700 text-slate-300"
						}`}
					>
						<span className="font-bold">
							{actionFeedback.type === "success"
								? "✓"
								: actionFeedback.type === "error"
									? "✗"
									: "ℹ"}
						</span>
						<div className="flex-1">
							<p className="font-semibold">
								{actionFeedback.message}
							</p>
							{actionFeedback.details && (
								<p className="text-[11px] text-slate-400 mt-0.5">
									{actionFeedback.details}
								</p>
							)}
						</div>
						<button
							onClick={() => setActionFeedback(null)}
							className="text-slate-400 hover:text-slate-200 cursor-pointer"
						>
							✕
						</button>
					</div>
				)}
			</div>

			{/* 3 Dedicated Service Playground Cards (Supabase, MongoDB, Redis) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* ========================================================= */}
				{/* 1. SUPABASE PANEL */}
				{/* ========================================================= */}
				<div
					id="playground-supabase"
					className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm"
				>
					<div>
						<div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
							<div>
								<span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
									PostgreSQL Tier
								</span>
								<h3 className="text-sm font-bold text-slate-100">
									Supabase
								</h3>
							</div>
							<span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
								table: demo_entries
							</span>
						</div>

						<p className="text-xs text-slate-400 mb-4">
							Executes parameterized SQL inserts and selects via
							the Supabase client through the Express backend.
						</p>

						{/* Action Buttons */}
						<div className="grid grid-cols-2 gap-2 mb-4">
							<button
								id="btn-save-supabase"
								onClick={handleSaveSupabase}
								disabled={activeAction === "save-supabase"}
								className="px-3 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
							>
								{activeAction === "save-supabase" ? (
									<>
										<svg
											className="animate-spin w-3 h-3"
											viewBox="0 0 24 24"
											fill="none"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8v8H4z"
											></path>
										</svg>
										Saving...
									</>
								) : (
									"Save to Supabase"
								)}
							</button>

							<button
								id="btn-fetch-supabase"
								onClick={handleFetchSupabase}
								disabled={activeAction === "fetch-supabase"}
								className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
							>
								{activeAction === "fetch-supabase"
									? "Retrieving..."
									: "Retrieve Records"}
							</button>
						</div>

						{/* Records Display */}
						<div>
							<div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
								<span>Retrieved Records</span>
								<span>{supabaseRecords.length} loaded</span>
							</div>
							<div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 max-h-48 overflow-y-auto">
								{supabaseRecords.length === 0 ? (
									<p className="text-[11px] text-slate-400 italic text-center py-4">
										No Supabase records loaded yet. Click
										&quot;Save to Supabase&quot; or
										&quot;Retrieve Records&quot;.
									</p>
								) : (
									<div className="space-y-1.5">
										{supabaseRecords.map((r, idx) => (
											<div
												key={r.id || idx}
												className="p-2 rounded bg-slate-900 border border-slate-800 text-xs"
											>
												<div className="flex items-center justify-between font-mono text-[10px] text-emerald-400 mb-0.5">
													<span className="truncate max-w-[120px]">
														id: {r.id}
													</span>
													<span className="text-slate-400">
														{r.created_at
															? new Date(
																	r.created_at,
																).toLocaleTimeString()
															: ""}
													</span>
												</div>
												<div className="font-medium text-slate-100">
													{r.name}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* ========================================================= */}
				{/* 2. MONGODB PANEL */}
				{/* ========================================================= */}
				<div
					id="playground-mongodb"
					className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm"
				>
					<div>
						<div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
							<div>
								<span className="text-[10px] font-mono uppercase text-green-400 font-semibold tracking-wider">
									Document Store
								</span>
								<h3 className="text-sm font-bold text-slate-100">
									MongoDB
								</h3>
							</div>
							<span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
								collection: demo_entries
							</span>
						</div>

						<p className="text-xs text-slate-400 mb-4">
							Performs BSON document insertions and projections
							into MongoDB Atlas through the backend.
						</p>

						{/* Action Buttons */}
						<div className="grid grid-cols-2 gap-2 mb-4">
							<button
								id="btn-save-mongodb"
								onClick={handleSaveMongo}
								disabled={activeAction === "save-mongo"}
								className="px-3 py-2 text-xs font-semibold text-white bg-green-700 hover:bg-green-600 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
							>
								{activeAction === "save-mongo" ? (
									<>
										<svg
											className="animate-spin w-3 h-3"
											viewBox="0 0 24 24"
											fill="none"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8v8H4z"
											></path>
										</svg>
										Saving...
									</>
								) : (
									"Save to MongoDB"
								)}
							</button>

							<button
								id="btn-fetch-mongodb"
								onClick={handleFetchMongo}
								disabled={activeAction === "fetch-mongo"}
								className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
							>
								{activeAction === "fetch-mongo"
									? "Retrieving..."
									: "Retrieve Documents"}
							</button>
						</div>

						{/* Records Display */}
						<div>
							<div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
								<span>Retrieved Documents</span>
								<span>{mongoRecords.length} loaded</span>
							</div>
							<div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 max-h-48 overflow-y-auto">
								{mongoRecords.length === 0 ? (
									<p className="text-[11px] text-slate-400 italic text-center py-4">
										No MongoDB documents loaded yet. Click
										&quot;Save to MongoDB&quot; or
										&quot;Retrieve Documents&quot;.
									</p>
								) : (
									<div className="space-y-1.5">
										{mongoRecords.map((r, idx) => (
											<div
												key={r.id || idx}
												className="p-2 rounded bg-slate-900 border border-slate-800 text-xs"
											>
												<div className="flex items-center justify-between font-mono text-[10px] text-green-400 mb-0.5">
													<span className="truncate max-w-[120px]">
														_id: {r.id}
													</span>
													<span className="text-slate-400">
														{r.created_at
															? new Date(
																	r.created_at,
																).toLocaleTimeString()
															: ""}
													</span>
												</div>
												<div className="font-medium text-slate-100">
													{r.name}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* ========================================================= */}
				{/* 3. REDIS PANEL */}
				{/* ========================================================= */}
				<div
					id="playground-redis"
					className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm"
				>
					<div>
						<div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
							<div>
								<span className="text-[10px] font-mono uppercase text-red-400 font-semibold tracking-wider">
									In-Memory Cache
								</span>
								<h3 className="text-sm font-bold text-slate-100">
									Redis
								</h3>
							</div>
							<span className="text-[10px] bg-red-950/60 text-red-300 border border-red-800/40 px-2 py-0.5 rounded font-mono">
								TTL: 300s Auto-Expire
							</span>
						</div>

						<p className="text-xs text-slate-400 mb-2">
							Redis is utilized here as an ephemeral key-value
							store/cache to demonstrate low-latency memory
							operations.
						</p>

						<div className="p-2 rounded bg-red-950/20 border border-red-900/40 text-[11px] text-red-200/90 mb-4">
							💡 <strong>Demo Architecture Note:</strong> Entries
							are stored under{" "}
							<code className="text-red-300 font-mono">
								demo:playground:latest_entry
							</code>{" "}
							with a 300s TTL to prevent test clutter.
						</div>

						{/* Action Buttons */}
						<div className="grid grid-cols-2 gap-2 mb-4">
							<button
								id="btn-save-redis"
								onClick={handleSaveRedis}
								disabled={activeAction === "save-redis"}
								className="px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-600 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
							>
								{activeAction === "save-redis" ? (
									<>
										<svg
											className="animate-spin w-3 h-3"
											viewBox="0 0 24 24"
											fill="none"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8v8H4z"
											></path>
										</svg>
										Caching...
									</>
								) : (
									"Store in Redis"
								)}
							</button>

							<button
								id="btn-fetch-redis"
								onClick={handleFetchRedis}
								disabled={activeAction === "fetch-redis"}
								className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
							>
								{activeAction === "fetch-redis"
									? "Retrieving..."
									: "Get Redis Value"}
							</button>
						</div>

						{/* Redis Result Display */}
						<div>
							<div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
								<span>Cached Key State</span>
								{redisData && (
									<span className="text-red-400 font-semibold">
										{redisData.ttl_seconds}s TTL remaining
									</span>
								)}
							</div>
							<div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 min-h-[92px]">
								{redisData ? (
									<div className="space-y-1 text-xs">
										<div className="text-[10px] font-mono text-slate-400">
											key:{" "}
											<span className="text-red-400">
												{redisData.key}
											</span>
										</div>
										<div className="font-semibold text-slate-100 text-sm">
											{redisData.name}
										</div>
										<div className="text-[10px] text-slate-400">
											Cached at{" "}
											{new Date(
												redisData.saved_at,
											).toLocaleTimeString()}
										</div>
										<div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60">
											{redisData.explanation}
										</div>
									</div>
								) : (
									<p className="text-[11px] text-slate-400 italic text-center py-4">
										No active cached value in Redis. Click
										&quot;Store in Redis&quot; or &quot;Get
										Redis Value&quot;.
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Backend API Liveness Details Modal/Box (if checked) */}
			{apiHealthData && (
				<div className="mt-4 p-3 rounded-lg bg-slate-900 border border-cyan-800/40 text-xs font-mono flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
						<span className="text-cyan-300 font-semibold">
							Independent API Health OK
						</span>
						<span className="text-slate-400">|</span>
						<span className="text-slate-300">
							Uptime: {apiHealthData.uptime}s
						</span>
						<span className="text-slate-400">|</span>
						<span className="text-slate-400">
							Server Time: {apiHealthData.timestamp}
						</span>
					</div>
					<button
						onClick={() => setApiHealthData(null)}
						className="text-slate-400 hover:text-slate-200 text-xs"
					>
						✕ Dismiss
					</button>
				</div>
			)}
		</section>
	);
}

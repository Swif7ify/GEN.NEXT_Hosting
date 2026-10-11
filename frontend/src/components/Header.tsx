"use client";

import React from "react";

export function Header() {
	return (
		<header className="border-b border-slate-200 bg-white sticky top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				{/* Title */}
				<div className="flex items-center gap-3">
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-base font-semibold text-slate-900">
								Deployment Playground
							</h1>
						</div>
						<p className="text-xs text-slate-500">
							Cross-Platform Connectivity & Database Playground
						</p>
					</div>
				</div>
			</div>
		</header>
	);
}

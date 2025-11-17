/** @format */

import {
	type RouteConfig,
	index,
	layout,
	route,
} from "@react-router/dev/routes";

const INVITE_MANAGEMENT_PATH = "invite-management";
const MESSAGES_PATH = "messages";

export default [
	layout("./routes/route.tsx", [
		// Landing Pages
		layout("./routes/landing/pages/layout/index.tsx", [
			index("./routes/landing/pages/home/index.tsx"),
			route("faq", "./routes/landing/pages/faq/index.tsx"),
			route("about", "./routes/landing/pages/about/index.tsx"),
			route("contact-us", "./routes/landing/pages/contact-us/index.tsx"),
			route(
				"privacy-policy",
				"./routes/landing/pages/privacy-policy/privacy-policy.tsx",
			),
		]),

		// Auth Routes
		route("/signup", "./routes/auth/signup/route.tsx", [
			// user type select
			index("./routes/auth/signup/routes/index/route.tsx"),
			// sign up form
			route("*", "./routes/auth/signup/routes/signup-form/route.tsx"),
		]),

		route("/login", "./routes/auth/login/route.tsx", [
			index("./routes/auth/login/routes/index/route.tsx"),
			route(
				"forgot-password",
				"./routes/auth/login/routes/forgot-password/route.tsx",
			),
		]),

		route("/verify-email", "routes/auth/routes/verify-email/route.tsx"),

		// decline invite page
		route(
			INVITE_MANAGEMENT_PATH + "/decline",
			"routes/main/routes/invite-management/routes/decline/route.tsx",
		),

		// Post chat inquiry confirmation
		route(
			MESSAGES_PATH + "/post-chat-inquiry",
			"routes/main/routes/messages/routes/post-chat-inquiry/route.tsx",
		),

		// Onboarding and Main App features wrapper
		layout("./routes/main/authenticated-layout-route.tsx", [
			// Onboarding
			route("onboarding", "./routes/main/routes/onboarding/route.tsx", [
				index("./routes/main/routes/onboarding/routes/index/route.tsx"),
				route(
					"completed",
					"./routes/main/routes/onboarding/routes/completed/route.tsx",
				),
				route(
					"questionnaire",
					"./routes/main/routes/onboarding/routes/questionnaire/route.tsx",
				),
			]),

			// Main App Features
			layout("./routes/main/route.tsx", [
				layout("./routes/under-layout-error-boundary.tsx", [
					// Dashboard
					route(
						"dashboard",
						"./routes/main/routes/dashboard/route.tsx",
					),

					// Profile page
					route("profile", "./routes/main/routes/profile/route.tsx"),

					// Settings
					route(
						"settings",
						"./routes/main/routes/settings/route.tsx",
						[
							route(
								"profile",
								"./routes/main/routes/settings/routes/profile/route.tsx",
							),
							route(
								"password",
								"./routes/main/routes/settings/routes/password/route.tsx",
							),
							route(
								"notifications",
								"./routes/main/routes/settings/routes/notifications/route.tsx",
							),
						],
					),

					// Notifications
					route(
						"notifications",
						"./routes/main/routes/notifications/route.tsx",
					),

					// Recruiting Flow
					route(
						"recruiting/shortlisted/:id",
						"./routes/main/routes/recruiting/routes/shortlisted/routes/candidates/route.tsx",
					),

					route(
						"recruiting/hired/:id",
						"./routes/main/routes/recruiting/routes/hired/routes/candidates/route.tsx",
					),

					route(
						"recruiting",
						"./routes/main/routes/recruiting/route.tsx",
						[
							route(
								"search",
								"./routes/main/routes/recruiting/routes/search/route.tsx",
							),
							route(
								"shortlisted",
								"./routes/main/routes/recruiting/routes/shortlisted/routes/index/route.tsx",
							),
							route(
								"hired",
								"./routes/main/routes/recruiting/routes/hired/routes/index/route.tsx",
							),
						],
					),

					// Job Management
					route(
						"job-management",
						"./routes/main/routes/job-management/route.tsx",
						[
							route(
								"posted",
								"routes/main/routes/job-management/routes/job-posted/route.tsx",
							),
							route(
								"drafts",
								"routes/main/routes/job-management/routes/jobs-drafted/route.tsx",
							),
							route(
								"new",
								"routes/main/routes/job-management/routes/new-job/route.tsx",
							),
						],
					),

					// Club/Admin Affiliate Management
					route(
						"affiliate-management",
						"./routes/main/routes/affiliate-management/route.tsx",
						[
							route(
								"search",
								"./routes/main/routes/affiliate-management/club/sections/search-and-filter/route.tsx",
							),

							route(
								"saved",
								"./routes/main/routes/affiliate-management/club/sections/saved/route.tsx",
							),
							route(
								"invites",
								"routes/main/routes/affiliate-management/club/sections/invites/route.tsx",
							),
						],
					),

					// Revenue Management
					route(
						"revenue-management",
						"./routes/main/routes/revenue-management/route.tsx",
					),

					// Player/Supporter Jobs pages
					// no tabs
					route(
						"jobs/:id",
						"./routes/main/routes/jobs/routes/job-details/route.tsx",
					),
					route(
						"jobs/apply/:id",
						"./routes/main/routes/jobs/routes/apply/route.tsx",
					),
					route(
						"jobs/companies/:id",
						"routes/main/routes/jobs/routes/companies/routes/company-jobs/route.tsx",
					),

					// with tabs
					route("jobs", "./routes/main/routes/jobs/route.tsx", [
						route(
							"search",
							"./routes/main/routes/jobs/routes/search/route.tsx",
						),
						route(
							"companies",
							"routes/main/routes/jobs/routes/companies/route.tsx",
						),
						route(
							"tracking",
							"./routes/main/routes/jobs/routes/tracking/route.tsx",
						),
					]),

					// Admin Company Management
					route(
						"company-management",
						"./routes/main/routes/company-management/route.tsx",
						[
							index(
								"./routes/main/routes/company-management/index/route.tsx",
							),
							route(
								":id",
								"./routes/main/routes/company-management/hires/route.tsx",
							),
						],
					),

					// Admin Club Management
					route(
						"club-management",
						"./routes/main/routes/club-management/route.tsx",
						[
							index(
								"./routes/main/routes/club-management/index/route.tsx",
							),
							route(
								":id",
								"./routes/main/routes/club-management/hires/route.tsx",
							),
						],
					),

					// Admin Request Management
					route(
						"request-management",
						"./routes/main/routes/request-management/route.tsx",
						[
							index(
								"./routes/main/routes/request-management/index/route.tsx",
							),
						],
					),

					// Admin invites management
					route(
						INVITE_MANAGEMENT_PATH,
						"routes/main/routes/invite-management/route.tsx",
						[
							route(
								"invites-to-approve",
								"routes/main/routes/invite-management/routes/invites-to-approve/route.tsx",
							),
							route(
								"unclaimed-invites",
								"routes/main/routes/invite-management/routes/unclaimed-invites/route.tsx",
							),
						],
					),

					// Messages
					route(
						MESSAGES_PATH,
						"./routes/main/routes/messages/route.tsx",
						[
							route(
								"new",
								"./routes/main/routes/messages/routes/new/route.tsx",
							),
							route(
								":id",
								"./routes/main/routes/messages/routes/chat/route.tsx",
							),
						],
					),

					// Admin invoice management
					route(
						"invoice-management",
						"routes/main/routes/invoice-management/route.tsx",
						[
							route(
								"company",
								"routes/main/routes/invoice-management/routes/company/route.tsx",
							),
							route(
								"club",
								"routes/main/routes/invoice-management/routes/club/route.tsx",
							),
						],
					),

					// Entities profile viewing
					route(
						":userType/:id",
						"./routes/main/routes/entity/route.tsx",
					),

					// Catch-all route
					route("*?", "catchall.tsx"),
				]),
			]),
		]),
	]),
] satisfies RouteConfig;

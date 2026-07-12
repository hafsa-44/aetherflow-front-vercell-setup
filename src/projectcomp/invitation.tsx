
//new changes 
// invitation.tsx — /invite/:token page
// Updated to handle all 5 roles with correct labels and descriptions.

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../api"

interface InviteDetails {
  project:   { _id: string; name: string; description: string; color: string; category: string }
  invitedBy: { name: string; email: string }
  email:     string
  role:      "manager" | "developer" | "designer" | "member"
  expiresAt: string
  token:     string
}

type PageState = "loading" | "valid" | "invalid" | "accepting" | "done" | "error"

// ── Role display config ───────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; description: string; initial: string }> = {
  manager: {
    label:       "Manager",
    description: "Can manage the team, invite members, and advance project phases.",
    initial:     "M",
  },
  developer: {
    label:       "Developer",
    description: "Full board access including the development environment and terminal.",
    initial:     "D",
  },
  designer: {
    label:       "Designer",
    description: "Access to planning and design boards. No access to the development board.",
    initial:     "D",
  },
  member: {
    label:       "Member",
    description: " Access across all project data  .Cannot edit or manage project settings.",
    initial:     "Mmr",
  },
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate  = useNavigate()

  const { currentUser, isAuthReady } = useAuth()
  const authLoading = !isAuthReady

  const [state,   setState]   = useState<PageState>("loading")
  const [details, setDetails] = useState<InviteDetails | null>(null)
  const [message, setMessage] = useState("")

  // Step 1 — validate the token (public, no auth needed)
  useEffect(() => {
    if (!token) { setState("invalid"); setMessage("No invitation token found."); return }
    api.get(`/invites/${token}`)
      .then((res) => { setDetails(res.data); setState("valid") })
      .catch((err) => {
        setState("invalid")
        setMessage(err.response?.data?.message || "This invitation is invalid or has expired.")
      })
  }, [token])

  // Step 2 — if user just returned from OAuth with a pending invite, auto-accept
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingInviteToken")
    if (pending && pending === token && currentUser && state === "valid") {
      sessionStorage.removeItem("pendingInviteToken")
      handleAccept()
    }
  }, [currentUser, state]) // eslint-disable-line

  const handleAccept = async () => {
    if (!currentUser) {
      sessionStorage.setItem("pendingInviteToken", token ?? "")
      navigate(`/signin?redirect=/invite/${token}`)
      return
    }

    setState("accepting")
    try {
      const res = await api.post(`/invites/${token}/accept`)
      setState("done")
      setMessage(res.data.message)
      setTimeout(() => navigate(`/project/${res.data.projectId}/board`), 1500)
    } catch (err: any) {
      setState("error")
      setMessage(err.response?.data?.message || "Something went wrong.")
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    )
  }

  const roleMeta = details ? (ROLE_META[details.role] ?? ROLE_META.viewer) : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 shadow-lg w-full max-w-md rounded-xl overflow-hidden">

        {/* Color bar */}
        <div className="h-1 w-full" style={{ backgroundColor: details?.project?.color ?? "#4f46e5" }} />

        <div className="px-8 py-8">

          {/* Loading */}
          {state === "loading" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Validating invitation…</p>
            </div>
          )}

          {/* Invalid */}
          {state === "invalid" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 border border-red-200 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-xl font-bold">✕</span>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Invitation Not Found</h2>
              <p className="text-sm text-gray-500">{message}</p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Go to dashboard →
              </button>
            </div>
          )}

          {/* Valid / Accepting / Error */}
          {(state === "valid" || state === "accepting" || state === "error") && details && roleMeta && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                Project Invitation
              </p>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">You have been invited</h1>
              <p className="text-sm text-gray-500 mb-6">
                by <span className="font-medium text-gray-700">{details.invitedBy.name}</span>
              </p>

              {/* Project card */}
              <div className="border border-gray-200 rounded-lg mb-5 overflow-hidden">
                <div className="h-1" style={{ backgroundColor: details.project.color }} />
                <div className="px-4 py-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {details.project.category}
                  </p>
                  <p className="text-base font-semibold text-gray-900">{details.project.name}</p>
                  {details.project.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {details.project.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Role display */}
              <div className="flex items-start gap-3 px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg mb-6">
                <div className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-700 rounded-md">
                  {roleMeta.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{roleMeta.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {roleMeta.description}
                  </p>
                </div>
              </div>

              {/* Error banner */}
              {state === "error" && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg mb-4">
                  {message}
                </div>
              )}

              {/* Email hint */}
              {!currentUser && (
                <p className="text-xs text-gray-400 mb-4">
                  Sign in with{" "}
                  <span className="font-medium text-gray-600">{details.email}</span> to accept.
                </p>
              )}

              {/* Accept button */}
              <button
                onClick={handleAccept}
                disabled={state === "accepting"}
                className="w-full py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {state === "accepting"
                  ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining…
                    </>
                  )
                  : currentUser ? "Accept Invitation" : "Sign in to Accept"
                }
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Expires{" "}
                {new Date(details.expiresAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            </>
          )}

          {/* Done */}
          {state === "done" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 border border-green-200 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">You're in!</h2>
              <p className="text-sm text-gray-500">{message}</p>
              <p className="text-xs text-gray-400 mt-2">Redirecting to the board…</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// invitation.tsx
// FIX: after accepting, navigate to /project/:id/board (not /board/:id)


import React, { useEffect, useMemo, useState } from "react";
import { ID } from "appwrite";

import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  GraduationCap,
  Target,
  CalendarDays,
  Clock3,
  BookMarked,
  BarChart3,
  Sun,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Search,
  Check,
  ChevronLeft,
  AlertCircle,
  Youtube,
  Trophy,
  Timer,
  Coffee,
  Moon,
  Save,
  LogOut,
  Heart,
  User,
  MessageSquare,
  MessageCircle,
  Link2,
  Copy,
  CheckCircle2,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

import {
  account,
  functions,
  APPWRITE_ASSIGNMENTS_COLLECTION_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID,
  APPWRITE_FOCUS_COLLECTION_ID,
  APPWRITE_GOALS_COLLECTION_ID,
  APPWRITE_NOTES_COLLECTION_ID,
  APPWRITE_SKILLS_COLLECTION_ID,
  APPWRITE_TASKS_COLLECTION_ID,
  databases,
  isAppwriteConfigured,
  Query,
} from "./lib/appwrite";
import { isAdminUser } from "./lib/auth";
import {
  validatePassword,
  getPasswordStrengthLevel,
  getPasswordStrengthColor,
  validateSignupForm,
} from "./lib/validators";
import { useGoogleReCaptcha } from "./lib/recaptcha.jsx";
import AboutPage from "./components/AboutPage";
import DonationPage from "./components/DonationPage";
import SuggestionsPage from "./components/SuggestionsPage";
import AnnouncementsPage from "./components/AnnouncementsPage";
import AdminDashboard from "./components/AdminDashboard";

/* =========================================================
   HELPERS
========================================================= */

function getLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

const today = getLocalDateString();
const USER_NAME_STORAGE_KEY = "mahei-pathap_user";
const DISCORD_INVITE_URL = import.meta.env.VITE_DISCORD_INVITE_URL || "https://discord.gg/BmYmwRrheX";
const DISCORD_LINK_FUNCTION_ENABLED = Boolean(APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID);

function createId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function normalizeVideoItem(video) {
  if (!video) return null;

  if (typeof video === "string") {
    try {
      const parsed = JSON.parse(video);
      return {
        id: parsed.id || createId(),
        title: parsed.title || "Untitled lesson",
        videoId: parsed.videoId || "",
        watched: Boolean(parsed.watched),
        notes: parsed.notes || "",
      };
    } catch {
      return null;
    }
  }

  if (typeof video === "object") {
    return {
      id: video.id || createId(),
      title: video.title || "Untitled lesson",
      videoId: video.videoId || "",
      watched: Boolean(video.watched),
      notes: video.notes || "",
    };
  }

  return null;
}

function mapVideosFromDocument(videos) {
  if (!Array.isArray(videos)) return [];

  return videos
    .map(normalizeVideoItem)
    .filter(Boolean);
}

function encodeVideosForAppwrite(videos) {
  if (!Array.isArray(videos)) return [];

  return videos.map((video) =>
    JSON.stringify({
      id: video.id || createId(),
      title: video.title || "Untitled lesson",
      videoId: video.videoId || "",
      watched: Boolean(video.watched),
      notes: video.notes || "",
    })
  );
}

function isProgressSchemaMissing(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes('unknown attribute: "progress"') ||
    message.includes("unknown attribute: 'progress'") ||
    (message.includes("invalid document structure") &&
      message.includes("progress"))
  );
}

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSkillsStorageKey(userId) {
  return userId ? `mahei-pathap_skills_${userId}` : "mahei-pathap_skills";
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function getYouTubeId(url) {
  if (!url) return "";

  try {
    const normalized = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    const parsed = new URL(normalized);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").split("?")[0];
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");

      if (videoId) return videoId;

      const parts = parsed.pathname.split("/");

      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }

      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1];
      }
    }
  } catch {
    return "";
  }

  return "";
}

function formatDate(date) {
  if (!date) return "No date";

  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysUntil(date) {
  if (!date) return null;

  const now = new Date(`${today}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);

  return Math.ceil((target - now) / 86400000);
}

/* =========================================================
   DEFAULT DATA
========================================================= */

const defaultTasks = [
  {
    id: 1,
    title: "Complete Data Structures Assignment",
    category: "College",
    priority: "High",
    deadline: today,
    estTime: 90,
    notes: "Focus on AVL Trees and rotations.",
    status: "Pending",
  },
  {
    id: 2,
    title: "Watch Python lesson",
    category: "Learning",
    priority: "Medium",
    deadline: today,
    estTime: 45,
    notes: "Complete one lesson.",
    status: "Pending",
  },
  {
    id: 3,
    title: "Practice C programming",
    category: "Learning",
    priority: "Low",
    deadline: today,
    estTime: 30,
    notes: "Solve 3 problems.",
    status: "Completed",
  },
];

const defaultAssignments = [
  {
    id: 1,
    subject: "Computer Science",
    title: "Data Structures Project",
    description: "Implement BFS and DFS.",
    dueDate: today,
    progress: 40,
    status: "In Progress",
  },
  {
    id: 2,
    subject: "Mathematics",
    title: "Problem Set",
    description: "Complete this week's problems.",
    dueDate: today,
    progress: 20,
    status: "In Progress",
  },
];

const defaultSkills = [
  {
    id: 1,
    name: "Python",
    category: "Programming",
    notes: "Learn Python from basics to projects.",
    progress: 0,
    videos: [],
  },
  {
    id: 2,
    name: "Web Development",
    category: "Development",
    notes: "HTML, CSS, JavaScript and React.",
    progress: 0,
    videos: [],
  },
];

const defaultGoals = [
  {
    id: 1,
    title: "Become a Full-Stack Developer",
    timeframe: "Long-term",
    category: "Career",
    progress: 25,
    targetDate: "2027-01-01",
  },
  {
    id: 2,
    title: "Complete JavaScript Course",
    timeframe: "Monthly",
    category: "Learning",
    progress: 45,
    targetDate: today,
  },
];

const defaultNotes = [
  {
    id: 1,
    title: "My Learning Plan",
    content:
      "Learn programming consistently and build real projects instead of only watching tutorials.",
    category: "Journal",
    date: today,
  },
];

const defaultFocus = [];

function createTaskDraft() {
  return {
    title: "",
    category: "College",
    priority: "Medium",
    deadline: today,
    estTime: 30,
    notes: "",
  };
}

function createAssignmentDraft() {
  return {
    subject: "College",
    title: "",
    description: "",
    dueDate: today,
    progress: 0,
    status: "Not Started",
  };
}

function createSkillDraft() {
  return {
    name: "",
    category: "Programming",
    notes: "",
  };
}

function createVideoDraft(skillId = "") {
  return {
    skillId,
    title: "",
    url: "",
    notes: "",
  };
}

function createGoalDraft() {
  return {
    title: "",
    timeframe: "Weekly",
    category: "Growth",
    progress: 0,
    targetDate: today,
  };
}

function createNoteDraft() {
  return {
    title: "",
    content: "",
    category: "Journal",
  };
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  // Get reCAPTCHA hook for bot protection
  const { executeRecaptcha } = useGoogleReCaptcha() || {};

  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [panelType, setPanelType] = useState(null);
  const [taskForm, setTaskForm] = useState(createTaskDraft());
  const [assignmentForm, setAssignmentForm] = useState(createAssignmentDraft());
  const [skillForm, setSkillForm] = useState(createSkillDraft());
  const [videoForm, setVideoForm] = useState(createVideoDraft());
  const [goalForm, setGoalForm] = useState(createGoalDraft());
  const [noteForm, setNoteForm] = useState(createNoteDraft());
  const [panelError, setPanelError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [skillStatus, setSkillStatus] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [discordLinkCode, setDiscordLinkCode] = useState("");
  const [discordLinkExpiresAt, setDiscordLinkExpiresAt] = useState("");
  const [discordLinkLoading, setDiscordLinkLoading] = useState(false);
  const [discordLinkError, setDiscordLinkError] = useState("");
  const [discordLinkCopied, setDiscordLinkCopied] = useState(false);
  const [discordLinked, setDiscordLinked] = useState(false);
const [discordUsername, setDiscordUsername] = useState("");
const [discordLinkChecking, setDiscordLinkChecking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [userName, setUserName] = useState(
    localStorage.getItem(USER_NAME_STORAGE_KEY) ||
      // Keep displaying a name saved by older releases, then migrate it to
      // the consistently named key on the next render.
      localStorage.getItem("Mahei-Pathap_user") ||
      "Bikram"
  );

  const [tasks, setTasks] = useState(defaultTasks);

  const [assignments, setAssignments] = useState(defaultAssignments);

  const [skills, setSkills] = useState(() =>
    isAppwriteConfigured ? [] : loadData("mahei-pathap_skills", defaultSkills)
  );

  const [goals, setGoals] = useState(defaultGoals);

  const [notes, setNotes] = useState(defaultNotes);

  const [focusHistory, setFocusHistory] = useState(defaultFocus);

  function mapTaskDocument(doc) {
    return {
      id: doc.$id,
      title: doc.title,
      category: doc.category || "College",
      priority: doc.priority || "Medium",
      deadline: doc.deadline || today,
      estTime: Number(doc.estTime) || 30,
      notes: doc.notes || "",
      status: doc.status || "Pending",
    };
  }

  function mapAssignmentDocument(doc) {
    return {
      id: doc.$id,
      subject: doc.subject || "College",
      title: doc.title,
      description: doc.description || "",
      dueDate: doc.dueDate || today,
      progress: Number(doc.progress) || 0,
      status: doc.status || "Not Started",
    };
  }

  function mapSkillDocument(doc) {
    return {
      id: doc.$id,
      name: doc.name || "Untitled skill",
      category: doc.category || "Programming",
      notes: doc.notes || "",
      progress: Math.max(0, Math.min(100, Number(doc.progress) || 0)),
      videos: mapVideosFromDocument(doc.videos),
    };
  }

  function mapGoalDocument(doc) {
    return {
      id: doc.$id,
      title: doc.title,
      timeframe: doc.timeframe || "Weekly",
      category: doc.category || "Growth",
      progress: Number(doc.progress) || 0,
      targetDate: doc.targetDate || today,
    };
  }

  function mapFocusDocument(doc) {
    return {
      id: doc.$id,
      date: doc.date || today,
      duration: Number(doc.duration) || 0,
      task: doc.task || "General Study",
    };
  }

  function mapNoteDocument(doc) {
    return {
      id: doc.$id,
      title: doc.title,
      content: doc.content,
      category: doc.category || "Journal",
      date: doc.date || today,
    };
  }

  async function listUserDocuments(collectionId, userId) {
    const pageSize = 100;
    const documents = [];
    let offset = 0;
    let total = 0;
    let pageDocuments = [];

    do {
      const page = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        collectionId,
        [Query.equal("userId", userId), Query.limit(pageSize), Query.offset(offset)]
      );

      pageDocuments = page.documents;
      documents.push(...pageDocuments);
      total = page.total;
      offset += pageDocuments.length;
    } while (offset < total && pageDocuments.length > 0);

    return documents;
  }

  async function syncUserDataFromAppwrite(userId) {
    if (!isAppwriteConfigured || !userId) return;

    try {
      const [taskDocuments, assignmentDocuments, skillDocuments, goalDocuments, focusDocuments, noteDocuments] =
        await Promise.all([
          listUserDocuments(APPWRITE_TASKS_COLLECTION_ID, userId),
          listUserDocuments(APPWRITE_ASSIGNMENTS_COLLECTION_ID, userId),
          listUserDocuments(APPWRITE_SKILLS_COLLECTION_ID, userId),
          listUserDocuments(APPWRITE_GOALS_COLLECTION_ID, userId),
          listUserDocuments(APPWRITE_FOCUS_COLLECTION_ID, userId),
          listUserDocuments(APPWRITE_NOTES_COLLECTION_ID, userId),
        ]);

      setTasks(taskDocuments.map(mapTaskDocument));
      setAssignments(assignmentDocuments.map(mapAssignmentDocument));
      const syncedSkills = skillDocuments.map(mapSkillDocument);
      setSkills((currentSkills) =>
        syncedSkills.length > 0
          ? syncedSkills.map((skill) => {
              const localMatch = currentSkills.find(
                (item) => String(item.id) === String(skill.id)
              );

              const mergedProgress =
                Number(skill.progress) > 0
                  ? Number(skill.progress)
                  : Number(localMatch?.progress) || 0;

              // Appwrite is the source of truth for videos/watched state.
              // Never replace a saved empty video list with stale local data.
              return {
                ...skill,
                progress: mergedProgress,
              };
            })
          : currentSkills
      );
      setGoals(goalDocuments.map(mapGoalDocument));
      setFocusHistory(focusDocuments.map(mapFocusDocument));
      setNotes(noteDocuments.map(mapNoteDocument));
    } catch (error) {
      console.error("Failed to load Appwrite data:", error);
    }
  }

  async function migrateLegacyData(userId) {
    if (!isAppwriteConfigured || !userId) return;

    const migrationMap = [
      {
        key: "mahei-pathap_tasks",
        collectionId: APPWRITE_TASKS_COLLECTION_ID,
        mapper: (item) => ({
          userId,
          title: item.title,
          category: item.category || "College",
          priority: item.priority || "Medium",
          deadline: item.deadline || today,
          estTime: Number(item.estTime) || 30,
          notes: item.notes || "",
          status: item.status || "Pending",
        }),
      },
      {
        key: "mahei-pathap_assignments",
        collectionId: APPWRITE_ASSIGNMENTS_COLLECTION_ID,
        mapper: (item) => ({
          userId,
          subject: item.subject || "College",
          title: item.title,
          description: item.description || "",
          dueDate: item.dueDate || today,
          progress: Number(item.progress) || 0,
          status: item.status || "Not Started",
        }),
      },
      {
        key: "mahei-pathap_goals",
        collectionId: APPWRITE_GOALS_COLLECTION_ID,
        mapper: (item) => ({
          userId,
          title: item.title,
          timeframe: item.timeframe || "Weekly",
          category: item.category || "Growth",
          progress: Number(item.progress) || 0,
          targetDate: item.targetDate || today,
        }),
      },
      {
        key: "mahei-pathap_focus",
        collectionId: APPWRITE_FOCUS_COLLECTION_ID,
        mapper: (item) => ({
          userId,
          date: item.date || today,
          duration: Number(item.duration) || 0,
          task: item.task || "General Study",
        }),
      },
      {
        key: "mahei-pathap_notes",
        collectionId: APPWRITE_NOTES_COLLECTION_ID,
        mapper: (item) => ({
          userId,
          title: item.title,
          content: item.content,
          category: item.category || "Journal",
          date: item.date || today,
        }),
      },
    ];

    for (const migration of migrationMap) {
      try {
        const existing = await databases.listDocuments(APPWRITE_DATABASE_ID, migration.collectionId, [
          Query.equal("userId", userId),
        ]);

        if (existing.documents.length > 0) {
          continue;
        }

        const raw = localStorage.getItem(migration.key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        const rows = Array.isArray(parsed) ? parsed : [];

        for (const item of rows) {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            migration.collectionId,
            ID.unique(),
            migration.mapper(item)
          );
        }

        localStorage.removeItem(migration.key);
      } catch (error) {
        console.error(`Failed to migrate ${migration.key}:`, error);
      }
    }
  }

  async function saveFocusSession(entry) {
    if (!isAppwriteConfigured || !authUser) return;

    try {
      const created = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOCUS_COLLECTION_ID,
        ID.unique(),
        {
          userId: authUser.$id,
          date: entry.date,
          duration: Number(entry.duration) || 0,
          task: entry.task || "General Study",
        }
      );

      setFocusHistory((items) => [mapFocusDocument(created), ...items]);
    } catch (error) {
      console.error("Failed to save focus session:", error);
    }
  }

  async function executeTrustedFocus(action, payload = {}) {
    if (!APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID || !authUser) return null;

    const execution = await functions.createExecution(
      APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID,
      JSON.stringify({ action, ...payload }),
      false,
      "/",
      "POST",
      { "content-type": "application/json" }
    );

    let body = {};
    try {
      body = execution.responseBody ? JSON.parse(execution.responseBody) : {};
    } catch {
      throw new Error("The focus service returned an invalid response.");
    }

    if (execution.responseStatusCode >= 400 || body.ok === false) {
      throw new Error(body.error || "The focus service could not complete the request.");
    }

    return body;
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setEmailVerificationSent(false);

    try {
      if (!isAppwriteConfigured) {
        setIsAuthenticated(true);
        setUserName(authForm.name || userName);
        return;
      }

      // Get reCAPTCHA token for bot protection
      let token = null;
      const action = authMode === "signup" ? "signup" : "login";
      if (executeRecaptcha) {
        try {
          token = await executeRecaptcha(action);
          setRecaptchaToken(token);
          console.log(`reCAPTCHA token obtained for ${action}`);
        } catch (recaptchaError) {
          console.error("reCAPTCHA error:", recaptchaError);
          setAuthError("Security verification failed. Please try again.");
          return;
        }
      }

      if (authMode === "signup") {
        // Validate signup form
        const validation = validateSignupForm(authForm);
        if (!validation.isValid) {
          const errorMessages = Object.values(validation.errors).join("\n");
          setAuthError(errorMessages);
          return;
        }

        // Create user account
        await account.create(
          ID.unique(),
          authForm.email,
          authForm.password,
          authForm.name
        );

        // Appwrite requires an authenticated session to send verification email.
        try {
          await account.createEmailPasswordSession(
            authForm.email,
            authForm.password
          );
          await account.createVerification(
            `${window.location.origin}${window.location.pathname}`
          );
          await account.updatePrefs({
            emailVerificationPending: true,
          });
        } catch (verificationError) {
          console.error("Email verification setup failed:", verificationError);
          setAuthError("Account created, but the verification email could not be sent. Please try again.");
          return;
        } finally {
          try {
            await account.deleteSession("current");
          } catch (sessionError) {
            console.error("Failed to close signup session:", sessionError);
          }
        }

        setEmailVerificationSent(true);
        setAuthSuccess("Verification email sent to your email. Please check your spam folder too, then verify your address before logging in.");
        setAuthForm({ name: "", email: "", password: "", confirmPassword: "" });
        setPasswordStrength(0);
        return;
      }

      // Login flow (works for both signup and login attempts)
      await account.createEmailPasswordSession(
        authForm.email,
        authForm.password
      );

      const currentUser = await account.get();

      if (!currentUser.emailVerification && currentUser.prefs?.emailVerificationPending) {
        await account.deleteSession("current");
        setAuthError("Please verify your email address before logging in.");
        return;
      }

      if (currentUser.emailVerification && currentUser.prefs?.emailVerificationPending) {
        await account.updatePrefs({
          emailVerificationPending: false,
        });
      }

      // ✅ Allow login (email verification infrastructure is in place for future use)
      setAuthUser(currentUser);
      setSkills(loadData(getSkillsStorageKey(currentUser.$id), []));
      setIsAuthenticated(true);
      setUserName(currentUser.name || authForm.name || "Mahei-Pathap User");
      localStorage.setItem(USER_NAME_STORAGE_KEY, currentUser.name || authForm.name || "Mahei-Pathap User");
      setIsAdmin(await isAdminUser());
      await migrateLegacyData(currentUser.$id);
      await syncUserDataFromAppwrite(currentUser.$id);
    } catch (error) {
      // More specific error messages
      if (error.message?.includes("user already exists")) {
        setAuthError("This email is already registered. Please login or use a different email.");
      } else if (error.message?.includes("Invalid credentials")) {
        setAuthError("Invalid email or password. Please try again.");
      } else if (error.message?.includes("user_email_already_exists")) {
        setAuthError("This email is already in use. Please login or use a different email.");
      } else {
        setAuthError(error.message || "Authentication failed. Please try again.");
      }
    }
  }

  function handleGoogleSignIn() {
    if (!isAppwriteConfigured) {
      setAuthError("Google sign-in requires Appwrite configuration.");
      return;
    }

    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const failureUrl = `${redirectUrl}?authError=google`;

    account.createOAuth2Session("google", redirectUrl, failureUrl);
  }

  async function logout() {
    try {
      if (isAppwriteConfigured) {
        await account.deleteSession("current");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    setAuthUser(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
    setAuthForm({ name: "", email: "", password: "", confirmPassword: "" });
    setAuthError("");
    setAuthSuccess("");
    setPasswordStrength(0);
    setEmailVerificationSent(false);
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authErrorCode = searchParams.get("authError");
    const verificationUserId = searchParams.get("userId");
    const verificationSecret = searchParams.get("secret");

    if (authErrorCode === "google") {
      setAuthError("Google sign-in was cancelled or failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (verificationUserId && verificationSecret) {
      account
        .updateVerification(verificationUserId, verificationSecret)
        .then(() => {
          setAuthSuccess("Your email is verified. You can now log in.");
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(() => {
          setAuthError("This verification link is invalid or has expired. Please request a new one.");
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    if (!isAppwriteConfigured) {
      setIsAuthenticated(true);
      return;
    }

    account.get()
      .then(async (currentUser) => {
        setAuthUser(currentUser);
        setSkills(loadData(getSkillsStorageKey(currentUser.$id), []));
        setUserName(currentUser.name || userName);
        setIsAuthenticated(true);
        const admin = await isAdminUser();
        setIsAdmin(admin);
        await migrateLegacyData(currentUser.$id);
        await syncUserDataFromAppwrite(currentUser.$id);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  /* =========================================================
     SAVE DATA
  ========================================================= */

  useEffect(() => {
    localStorage.setItem(USER_NAME_STORAGE_KEY, userName);
  }, [userName]);

  useEffect(() => {
    if (isAppwriteConfigured && !authUser) return;

    saveData(getSkillsStorageKey(authUser?.$id), skills);
  }, [skills, authUser]);

  /* =========================================================
     POMODORO
  ========================================================= */

  const [timerMode, setTimerMode] = useState("work");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusTask, setFocusTask] = useState("General Study");
  const [trustedFocusSessionId, setTrustedFocusSessionId] = useState(null);
  const [focusActionBusy, setFocusActionBusy] = useState(false);
  const [focusStatus, setFocusStatus] = useState("");

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerSeconds !== 0) return;

    setTimerRunning(false);
    if (timerMode !== "work") return;

    let cancelled = false;
    (async () => {
      setFocusActionBusy(true);
      setFocusStatus("Verifying your focus session…");
      try {
        if (APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID && authUser) {
          const result = await executeTrustedFocus("complete_focus", {
            sessionId: trustedFocusSessionId,
          });
          if (!cancelled) {
            setTrustedFocusSessionId(null);
            setFocusStatus(`Focus completed — +${result.xpAwarded || 10} XP earned.`);
            await saveFocusSession({
              date: getLocalDateString(),
              duration: 25,
              task: focusTask.trim() || "General Study",
            });
          }
        } else if (authUser) {
          await saveFocusSession({
            date: getLocalDateString(),
            duration: 25,
            task: focusTask.trim() || "General Study",
          });
          if (!cancelled) setFocusStatus("Focus completed and saved.");
        }
      } catch (error) {
        console.error("Failed to verify focus session:", error);
        if (!cancelled) {
          setTrustedFocusSessionId(null);
          setFocusStatus(error.message || "Focus verification failed.");
        }
      } finally {
        if (!cancelled) setFocusActionBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [timerSeconds, timerRunning, timerMode, focusTask, trustedFocusSessionId, authUser]);

  async function handleFocusStartPause() {
    if (focusActionBusy) return;
    if (timerRunning) {
      setTimerRunning(false);
      setFocusStatus("Focus paused. The secure session clock continues until completion.");
      return;
    }

    setFocusStatus("");
    if (timerMode === "work" && APPWRITE_DISCORD_INTEGRATION_FUNCTION_ID && authUser) {
      setFocusActionBusy(true);
      try {
        const result = await executeTrustedFocus("start_focus", {
          subject: focusTask.trim() || "General Study",
        });
        setTrustedFocusSessionId(result.sessionId);
        setTimerRunning(true);
        setFocusStatus("Focus started.");
      } catch (error) {
        console.error("Failed to start trusted focus session:", error);
        setFocusStatus(error.message || "Could not start the focus session.");
      } finally {
        setFocusActionBusy(false);
      }
      return;
    }
    setTimerRunning(true);
  }

  function setTimerModeAndReset(mode) {
    setTimerRunning(false);
    setTimerMode(mode);

    if (mode === "work") setTimerSeconds(25 * 60);
    if (mode === "short") setTimerSeconds(5 * 60);
    if (mode === "long") setTimerSeconds(15 * 60);
  }

  function resetTimer() {
    setTimerRunning(false);

    if (timerMode === "work") setTimerSeconds(25 * 60);
    if (timerMode === "short") setTimerSeconds(5 * 60);
    if (timerMode === "long") setTimerSeconds(15 * 60);
  }

  const timerMinutes = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;

  /* =========================================================
     STATISTICS
  ========================================================= */

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const todayTasks = tasks.filter((task) => task.deadline === today);

  const focusMinutes = focusHistory.reduce(
    (total, item) => total + Number(item.duration || 0),
    0
  );

  const watchedVideos = skills.reduce(
    (total, skill) =>
      total + skill.videos.filter((video) => video.watched).length,
    0
  );

  const totalVideos = skills.reduce(
    (total, skill) => total + skill.videos.length,
    0
  );

  const learningProgress =
    totalVideos === 0
      ? 0
      : Math.round((watchedVideos / totalVideos) * 100);

  const productivity =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  async function checkDiscordLinkStatus() {
  if (!authUser || !DISCORD_LINK_FUNCTION_ENABLED) {
    return false;
  }

  try {
    setDiscordLinkChecking(true);

    const result = await executeTrustedFocus(
      "check_discord_link"
    );

    if (result?.linked) {
      setDiscordLinked(true);
      setDiscordUsername(
        result.discordUsername || ""
      );

      return true;
    }

    setDiscordLinked(false);
    setDiscordUsername("");

    return false;
  } catch (error) {
    console.error(
      "Failed to check Discord link status:",
      error
    );

    return false;
  } finally {
    setDiscordLinkChecking(false);
  }
}

  async function createDiscordLinkCode() {
    setDiscordLinkError("");
    setDiscordLinkCopied(false);

    if (!authUser || !DISCORD_LINK_FUNCTION_ENABLED) {
      setDiscordLinkError("Discord account linking is not configured yet.");
      return;
    }

    setDiscordLinkLoading(true);
    try {
      const result = await executeTrustedFocus("create_discord_link");
      setDiscordLinkCode(result.code || "");
      setDiscordLinkExpiresAt(result.expiresAt || "");
    } catch (error) {
      setDiscordLinkError(error.message || "Unable to create a Discord link code.");
    } finally {
      setDiscordLinkLoading(false);
    }
  }
  useEffect(() => {
  if (
    !authUser ||
    !DISCORD_LINK_FUNCTION_ENABLED ||
    activePage !== "discord"
  ) {
    return undefined;
  }

  let cancelled = false;
  let intervalId = null;

  const check = async () => {
    if (cancelled || discordLinked) return;

    const linked = await checkDiscordLinkStatus();

    if (linked && intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  check();

  intervalId = window.setInterval(check, 3000);

  return () => {
    cancelled = true;

    if (intervalId) {
      window.clearInterval(intervalId);
    }
  };
}, [
  authUser?.$id,
  activePage,
  discordLinked,
]);

  async function copyDiscordLinkCode() {
    if (!discordLinkCode) return;
    try {
      await navigator.clipboard.writeText(discordLinkCode);
      setDiscordLinkCopied(true);
      window.setTimeout(() => setDiscordLinkCopied(false), 1800);
    } catch {
      setDiscordLinkError("Copy failed. Please copy the code manually.");
    }
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "orange",
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      color: "peach",
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: GraduationCap,
      color: "coral",
    },
    {
      id: "skills",
      label: "Skill Learning",
      icon: BookOpen,
      color: "purple",
    },
    {
      id: "goals",
      label: "Goals",
      icon: Target,
      color: "yellow",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarDays,
      color: "green",
    },
    {
      id: "focus",
      label: "Focus",
      icon: Clock3,
      color: "blue",
    },
    {
      id: "notes",
      label: "Notes",
      icon: BookMarked,
      color: "mint",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      color: "sky",
    },
    {
      id: "review",
      label: "Daily Review",
      icon: Sun,
      color: "gold",
    },
    {
      id: "about",
      label: "About Me",
      icon: User,
      color: "purple",
    },
    {
      id: "donation",
      label: "Donation",
      icon: Heart,
      color: "coral",
    },
    {
      id: "suggestions",
      label: "Suggestions",
      icon: MessageSquare,
      color: "yellow",
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: Megaphone,
      color: "blue",
    },
    {
      id: "discord",
      label: "Discord",
      icon: MessageCircle,
      color: "purple",
    },
    ...(isAdmin ? [{
      id: "admin",
      label: "Admin Panel",
      icon: ShieldCheck,
      color: "coral",
    }] : []),
  ];

  function navigate(page) {
    setActivePage(page);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openPanel(type, payload = {}) {
    setPanelError("");
    setPanelType(type);

    if (type === "task") setTaskForm(createTaskDraft());
    if (type === "assignment") setAssignmentForm(createAssignmentDraft());
    if (type === "skill") setSkillForm(createSkillDraft());
    if (type === "video") setVideoForm(createVideoDraft(payload.skillId || ""));
    if (type === "goal") setGoalForm(createGoalDraft());
    if (type === "note") setNoteForm(createNoteDraft());
  }

  function closePanel() {
    setPanelError("");
    setPanelType(null);
  }

  /* =========================================================
     ADD TASK
  ========================================================= */

  function addTask() {
    openPanel("task");
  }

  async function submitTask(event) {
    event.preventDefault();

    if (!taskForm.title.trim()) return;

    const newTask = {
      title: taskForm.title.trim(),
      category: taskForm.category,
      priority: taskForm.priority,
      deadline: taskForm.deadline || today,
      estTime: Number(taskForm.estTime) || 30,
      notes: taskForm.notes.trim(),
      status: "Pending",
    };

    if (isAppwriteConfigured && authUser) {
      try {
        const created = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TASKS_COLLECTION_ID,
          ID.unique(),
          {
            userId: authUser.$id,
            ...newTask,
          }
        );

        setTasks((items) => [mapTaskDocument(created), ...items]);
        closePanel();
        return;
      } catch (error) {
        console.error("Failed to save task to Appwrite:", error);
      }
    }

    setTasks((items) => [
      { id: createId(), ...newTask },
      ...items,
    ]);
    closePanel();
  }

  async function toggleTask(id) {
    const current = tasks.find((task) => task.id === id);
    if (!current) return;

    const nextStatus = current.status === "Completed" ? "Pending" : "Completed";

    if (isAppwriteConfigured && authUser && typeof id === "string") {
      try {
        const updated = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TASKS_COLLECTION_ID,
          id,
          { status: nextStatus }
        );

        setTasks((items) =>
          items.map((task) => (task.id === id ? mapTaskDocument(updated) : task))
        );
        return;
      } catch (error) {
        console.error("Failed to update task in Appwrite:", error);
      }
    }

    setTasks((items) =>
      items.map((task) =>
        task.id === id
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    );
  }

  async function deleteTask(id) {
    if (isAppwriteConfigured && authUser && typeof id === "string") {
      try {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TASKS_COLLECTION_ID,
          id
        );
      } catch (error) {
        console.error("Failed to delete task from Appwrite:", error);
      }
    }

    setTasks((items) => items.filter((task) => task.id !== id));
  }

  /* =========================================================
     ADD ASSIGNMENT
  ========================================================= */

  function addAssignment() {
    openPanel("assignment");
  }

  async function submitAssignment(event) {
    event.preventDefault();

    if (!assignmentForm.title.trim()) return;

    const newAssignment = {
      subject: assignmentForm.subject.trim() || "College",
      title: assignmentForm.title.trim(),
      description: assignmentForm.description.trim(),
      dueDate: assignmentForm.dueDate || today,
      progress: Number(assignmentForm.progress) || 0,
      status: "Not Started",
    };

    if (isAppwriteConfigured && authUser) {
      try {
        const created = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_ASSIGNMENTS_COLLECTION_ID,
          ID.unique(),
          {
            userId: authUser.$id,
            ...newAssignment,
          }
        );

        setAssignments((items) => [...items, mapAssignmentDocument(created)]);
        closePanel();
        return;
      } catch (error) {
        console.error("Failed to save assignment to Appwrite:", error);
      }
    }

    setAssignments((items) => [...items, { id: createId(), ...newAssignment }]);
    closePanel();
  }

  async function increaseAssignmentProgress(id) {
    const current = assignments.find((assignment) => assignment.id === id);
    if (!current) return;

    const progress = Math.min(100, current.progress + 25);
    const nextStatus = progress === 100 ? "Completed" : "In Progress";

    if (isAppwriteConfigured && authUser && typeof id === "string") {
      try {
        const updated = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_ASSIGNMENTS_COLLECTION_ID,
          id,
          {
            progress,
            status: nextStatus,
          }
        );

        setAssignments((items) =>
          items.map((assignment) =>
            assignment.id === id ? mapAssignmentDocument(updated) : assignment
          )
        );
        return;
      } catch (error) {
        console.error("Failed to update assignment in Appwrite:", error);
      }
    }

    setAssignments((items) =>
      items.map((assignment) => {
        if (assignment.id !== id) return assignment;

        return {
          ...assignment,
          progress,
          status: nextStatus,
        };
      })
    );
  }

  async function deleteAssignment(id) {
    if (isAppwriteConfigured && authUser && typeof id === "string") {
      try {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_ASSIGNMENTS_COLLECTION_ID,
          id
        );
      } catch (error) {
        console.error("Failed to delete assignment from Appwrite:", error);
      }
    }

    setAssignments((items) => items.filter((assignment) => assignment.id !== id));
  }

  /* =========================================================
     SKILLS
  ========================================================= */

  function addSkill() {
    openPanel("skill");
  }

  async function submitSkill(event) {
    event.preventDefault();

    if (!skillForm.name.trim()) return;

    const nextSkill = {
      name: skillForm.name.trim(),
      category: skillForm.category,
      notes: skillForm.notes.trim(),
      progress: 0,
      videos: [],
    };

    if (isAppwriteConfigured && authUser) {
      try {
        let created;

        try {
          created = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_SKILLS_COLLECTION_ID,
            ID.unique(),
            {
              userId: authUser.$id,
              ...nextSkill,
            }
          );
        } catch (error) {
          if (!isProgressSchemaMissing(error)) {
            throw error;
          }

          created = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_SKILLS_COLLECTION_ID,
            ID.unique(),
            {
              userId: authUser.$id,
              name: nextSkill.name,
              category: nextSkill.category,
              notes: nextSkill.notes,
              videos: [],
            }
          );

          setSkillStatus(
            "Skill saved. Add a numeric progress attribute in Appwrite Skills collection to sync progress to cloud."
          );
        }

        setSkills((items) => [...items, mapSkillDocument(created)]);
        closePanel();
        return;
      } catch (error) {
        console.error("Failed to save skill to Appwrite:", error);
      }
    }

    setSkills((items) => [
      ...items,
      {
        id: createId(),
        ...nextSkill,
      },
    ]);
    closePanel();
  }

  function addYouTubeVideo(skillId) {
    setSkillStatus("");
    openPanel("video", { skillId });
  }

  async function increaseSkillProgress(skillId) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    const nextProgress = Math.min(100, (Number(skill.progress) || 0) + 10);

    if (nextProgress === Number(skill.progress || 0)) {
      setSkillStatus(`${skill.name} is already at 100%.`);
      return;
    }

    const updatedSkill = {
      ...skill,
      progress: nextProgress,
    };

    setSkills((items) =>
      items.map((item) => (item.id === skillId ? updatedSkill : item))
    );
    setSkillStatus(`Progress updated for ${skill.name}.`);

    if (isAppwriteConfigured && authUser && typeof skillId === "string") {
      try {
        const updated = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SKILLS_COLLECTION_ID,
          skillId,
          { progress: nextProgress }
        );

        setSkills((items) =>
          items.map((item) =>
            item.id === skillId ? mapSkillDocument(updated) : item
          )
        );
      } catch (error) {
        if (isProgressSchemaMissing(error)) {
          setSkillStatus(
            "Progress updated locally. Add a numeric progress attribute in Appwrite Skills collection to sync progress to cloud."
          );
        } else {
          console.error("Failed to increase skill progress in Appwrite:", error);
        }
      }
    }
  }

  async function undoSkillProgress(skillId) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    const nextProgress = Math.max(0, (Number(skill.progress) || 0) - 10);

    if (nextProgress === Number(skill.progress || 0)) {
      setSkillStatus(`${skill.name} is already at 0%.`);
      return;
    }

    const updatedSkill = {
      ...skill,
      progress: nextProgress,
    };

    setSkills((items) =>
      items.map((item) => (item.id === skillId ? updatedSkill : item))
    );
    setSkillStatus(`Progress updated for ${skill.name}.`);

    if (isAppwriteConfigured && authUser && typeof skillId === "string") {
      try {
        const updated = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SKILLS_COLLECTION_ID,
          skillId,
          { progress: nextProgress }
        );

        setSkills((items) =>
          items.map((item) =>
            item.id === skillId ? mapSkillDocument(updated) : item
          )
        );
      } catch (error) {
        if (isProgressSchemaMissing(error)) {
          setSkillStatus(
            "Progress updated locally. Add a numeric progress attribute in Appwrite Skills collection to sync progress to cloud."
          );
        } else {
          console.error("Failed to undo skill progress in Appwrite:", error);
        }
      }
    }
  }

  async function submitVideo(event) {
    event.preventDefault();

    const title = videoForm.title.trim();
    const url = videoForm.url.trim();

    if (!title) {
      setPanelError("Please enter a video title.");
      return;
    }

    const videoId = getYouTubeId(url);
    if (!videoId) {
      setPanelError("Please enter a valid YouTube URL.");
      return;
    }

    const video = {
      id: createId(),
      title,
      videoId,
      watched: false,
      notes: videoForm.notes.trim(),
    };

    const skillId = videoForm.skillId;

    const skill = skills.find((item) => item.id === skillId);
    if (!skill) {
      setPanelError("Skill not found. Please try again.");
      return;
    }

    const updatedSkill = {
      ...skill,
      videos: [...skill.videos, video],
    };

    setSkills((items) =>
      items.map((item) => (item.id === skillId ? updatedSkill : item))
    );

    closePanel();

    if (isAppwriteConfigured && authUser && typeof skillId === "string") {
      try {
        const updated = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SKILLS_COLLECTION_ID,
          skillId,
          {
            videos: encodeVideosForAppwrite(updatedSkill.videos),
          }
        );

        setSkills((items) =>
          items.map((item) =>
            item.id === skillId ? mapSkillDocument(updated) : item
          )
        );
      } catch (error) {
        console.error("Failed to update skill video list in Appwrite:", error);
      }
    }
  }

  function updateVideoNotes(skillId, videoId, value) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    const updatedSkill = {
      ...skill,
      videos: skill.videos.map((video) =>
        video.id === videoId ? { ...video, notes: value } : video
      ),
    };

    setSkills((items) =>
      items.map((item) => (item.id === skillId ? updatedSkill : item))
    );

    if (isAppwriteConfigured && authUser && typeof skillId === "string") {
      databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SKILLS_COLLECTION_ID,
        skillId,
        { videos: encodeVideosForAppwrite(updatedSkill.videos) }
      ).catch((error) => {
        console.error("Failed to save video notes to Appwrite:", error);
      });
    }
  }

  async function toggleVideo(skillId, videoId) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    const previousSkill = skill;
    const updatedSkill = {
      ...skill,
      videos: skill.videos.map((video) =>
        video.id === videoId ? { ...video, watched: !video.watched } : video
      ),
    };

    // Update the UI immediately, then persist the exact same video list.
    setSkills((items) =>
      items.map((item) => (item.id === skillId ? updatedSkill : item))
    );

    if (isAppwriteConfigured && authUser && typeof skillId === "string") {
      try {
        const saved = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SKILLS_COLLECTION_ID,
          skillId,
          { videos: encodeVideosForAppwrite(updatedSkill.videos) }
        );

        // Use Appwrite's saved document as the final state. This keeps the
        // watched count consistent after refresh and prevents stale local data.
        setSkills((items) =>
          items.map((item) =>
            item.id === skillId ? mapSkillDocument(saved) : item
          )
        );
      } catch (error) {
        console.error("Failed to update video watched status in Appwrite:", error);

        // Do not show a watched state that was not actually saved.
        setSkills((items) =>
          items.map((item) =>
            item.id === skillId ? previousSkill : item
          )
        );
        setSkillStatus("Could not save the video status. Please try again.");
      }
    }
  }

  async function deleteSkill(skillId) {
    if (isAppwriteConfigured && authUser && typeof skillId === "string") {
      try {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_SKILLS_COLLECTION_ID,
          skillId
        );
      } catch (error) {
        console.error("Failed to delete skill from Appwrite:", error);
      }
    }

    setSkills((items) => items.filter((skill) => skill.id !== skillId));
  }

  /* =========================================================
     GOALS
  ========================================================= */

  function addGoal() {
    openPanel("goal");
  }

  async function submitGoal(event) {
    event.preventDefault();

    if (!goalForm.title.trim()) return;

    const newGoal = {
      title: goalForm.title.trim(),
      timeframe: goalForm.timeframe,
      category: goalForm.category,
      progress: Number(goalForm.progress) || 0,
      targetDate: goalForm.targetDate || today,
    };

    if (isAppwriteConfigured && authUser) {
      try {
        const created = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_GOALS_COLLECTION_ID,
          ID.unique(),
          {
            userId: authUser.$id,
            ...newGoal,
          }
        );

        setGoals((items) => [mapGoalDocument(created), ...items]);
        closePanel();
        return;
      } catch (error) {
        console.error("Failed to save goal to Appwrite:", error);
      }
    }

    setGoals((items) => [
      ...items,
      {
        id: createId(),
        ...newGoal,
      },
    ]);
    closePanel();
  }

  async function increaseGoal(id) {
    const current = goals.find((goal) => goal.id === id);
    if (!current) return;

    const progress = Math.min(100, current.progress + 10);

    if (isAppwriteConfigured && authUser && typeof id === "string") {
      try {
        const updated = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_GOALS_COLLECTION_ID,
          id,
          { progress }
        );

        setGoals((items) =>
          items.map((goal) => (goal.id === id ? mapGoalDocument(updated) : goal))
        );
        return;
      } catch (error) {
        console.error("Failed to update goal in Appwrite:", error);
      }
    }

    setGoals((items) =>
      items.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              progress,
            }
          : goal
      )
    );
  }

  async function deleteGoal(id) {
    if (isAppwriteConfigured && authUser && typeof id === "string") {
      try {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_GOALS_COLLECTION_ID,
          id
        );
      } catch (error) {
        console.error("Failed to delete goal from Appwrite:", error);
      }
    }

    setGoals((items) => items.filter((goal) => goal.id !== id));
  }

  /* =========================================================
     NOTES
  ========================================================= */

  function addNote() {
    openPanel("note");
  }

  async function submitNote(event) {
    event.preventDefault();

    if (!noteForm.title.trim() || !noteForm.content.trim()) return;

    const notePayload = {
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
      category: noteForm.category,
      date: today,
    };

    if (isAppwriteConfigured && authUser) {
      try {
        const created = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_NOTES_COLLECTION_ID,
          ID.unique(),
          {
            userId: authUser.$id,
            ...notePayload,
          }
        );

        setNotes((items) => [mapNoteDocument(created), ...items]);
        closePanel();
        return;
      } catch (error) {
        console.error("Failed to save note to Appwrite:", error);
      }
    }

    setNotes((items) => [{ id: createId(), ...notePayload }, ...items]);
    closePanel();
  }

  async function deleteNote(id) {
    if (isAppwriteConfigured && authUser && typeof id === "string") {
      await deleteNoteFromAppwrite(id);
    }

    setNotes((items) => items.filter((note) => note.id !== id));
  }

  async function deleteNoteFromAppwrite(noteId) {
    if (!isAppwriteConfigured || !authUser) return;

    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_NOTES_COLLECTION_ID,
        noteId
      );
    } catch (error) {
      console.error("Failed to delete Appwrite note:", error);
    }
  }

  async function completeTodayReview() {
    const title = `Daily Review - ${today}`;
    const existingReview = notes.find(
      (note) => note.title === title && note.category === "Reflection"
    );

    const unfinishedCount = tasks.filter(
      (task) => task.status !== "Completed"
    ).length;

    const content = [
      `Completed tasks: ${completedTasks}`,
      `Focus minutes: ${focusMinutes}`,
      `Videos watched: ${watchedVideos}`,
      `Carry forward tasks: ${unfinishedCount}`,
    ].join("\n");

    const notePayload = {
      title,
      content,
      category: "Reflection",
      date: today,
    };

    if (existingReview) {
      setReviewStatus("Today's review is already saved.");
      return;
    }

    if (isAppwriteConfigured && authUser) {
      try {
        const created = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_NOTES_COLLECTION_ID,
          ID.unique(),
          {
            userId: authUser.$id,
            ...notePayload,
          }
        );

        setNotes((items) => [mapNoteDocument(created), ...items]);
        setReviewStatus("Today's review has been saved.");
        return;
      } catch (error) {
        console.error("Failed to save daily review:", error);
      }
    }

    setNotes((items) => [{ id: createId(), ...notePayload }, ...items]);
    setReviewStatus("Today's review has been saved locally.");
  }

  /* =========================================================
     PAGE TITLE
  ========================================================= */

  const pageTitle = useMemo(() => {
    const found = navigation.find((item) => item.id === activePage);
    return found?.label || "Dashboard";
  }, [activePage]);

  /* =========================================================
     RENDER
  ========================================================= */

  if (!isAuthenticated) {
    return (
      <LoginPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        authError={authError}
        authSuccess={authSuccess}
        onSubmit={handleAuthSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        isAppwriteConfigured={isAppwriteConfigured}
        passwordStrength={passwordStrength}
        setPasswordStrength={setPasswordStrength}
        emailVerificationSent={emailVerificationSent}
      />
    );
  }

  return (
    <div className="app">
      {/* MOBILE HEADER */}

      <header className="mobile-header">
        <button
          className="icon-button"
          onClick={() => setMobileMenu(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="brand-small">
          <span className="brand-logo">🌱</span>
          <strong>Mahei-Pathap</strong>
        </div>

        <span className="mobile-streak">
          <Flame size={16} />
          5
        </span>
      </header>

      {/* SIDEBAR */}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div>
          <div className="brand">
            <div className="brand-logo">🌱</div>

            <div>
              <h1>Mahei-Pathap</h1>
              <p>ꯑꯗꯣꯝꯒꯤ ꯃꯍꯩꯒꯤ ꯃꯥꯔꯨꯞ</p>
            </div>

            <button
              className="mobile-close"
              onClick={() => setMobileMenu(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="navigation">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`nav-item ${
                    activePage === item.id ? "active" : ""
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="profile-card">
          <div className="avatar">🦊</div>

          <div>
            <strong>{userName}</strong>

            <span>
              <Flame size={13} />
              5 day streak
            </span>
          </div>
        </div>

        <button
          type="button"
          className="mobile-logout"
          onClick={logout}
        >
          <LogOut size={17} />
          Logout
        </button>
      </aside>

      {/* MAIN */}

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">
              <Sparkles size={14} />
              Your personal workspace
            </div>

            <h2>{pageTitle}</h2>

            <p>
              Welcome back, {userName}! Let&apos;s make today wonderfully
              productive.
            </p>
          </div>

          <div className="top-actions">
            <div className="task-chip">
              <Check size={14} />
              {completedTasks} tasks done
            </div>

            <button
              className="dark-button"
              onClick={() => navigate("focus")}
            >
              <Timer size={16} />
              Focus
            </button>

            <button className="dark-button" onClick={logout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <div className="content">
          {/* DISCORD */}

          {activePage === "discord" && (
            <DiscordPage
              inviteUrl={DISCORD_INVITE_URL}
              linkCode={discordLinkCode}
              expiresAt={discordLinkExpiresAt}
              loading={discordLinkLoading}
              error={discordLinkError}
              copied={discordLinkCopied}
              linked={discordLinked}
              discordUsername={discordUsername}
              checking={discordLinkChecking}
              onCreateCode={createDiscordLinkCode}
              onCopyCode={copyDiscordLinkCode}
            />
          )}

          {/* DASHBOARD */}

          {activePage === "dashboard" && (
            <Dashboard
              userName={userName}
              tasks={tasks}
              assignments={assignments}
              completedTasks={completedTasks}
              focusMinutes={focusMinutes}
              watchedVideos={watchedVideos}
              productivity={productivity}
              learningProgress={learningProgress}
              navigate={navigate}
              toggleTask={toggleTask}
            />
          )}

          {/* ABOUT ME */}
          {activePage === "about" && (
            <AboutPage
              userName={userName}
              authUser={authUser}
              isAdmin={isAdmin}
            />
          )}

          {/* DONATION */}
          {activePage === "donation" && (
            <DonationPage />
          )}

          {/* SUGGESTIONS */}
          {activePage === "suggestions" && (
            <SuggestionsPage
              authUser={authUser}
              userName={userName}
            />
          )}

          {/* ANNOUNCEMENTS */}
          {activePage === "announcements" && (
            <AnnouncementsPage
              authUser={authUser}
            />
          )}

          {/* ADMIN */}
          {activePage === "admin" && isAdmin && (
            <AdminDashboard
              authUser={authUser}
            />
          )}

          {/* TASKS */}

          {activePage === "tasks" && (
            <TasksPage
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
            />
          )}

          {panelType && (
            <CreatePanel
              type={panelType}
              taskForm={taskForm}
              setTaskForm={setTaskForm}
              assignmentForm={assignmentForm}
              setAssignmentForm={setAssignmentForm}
              skillForm={skillForm}
              setSkillForm={setSkillForm}
              videoForm={videoForm}
              setVideoForm={setVideoForm}
              goalForm={goalForm}
              setGoalForm={setGoalForm}
              noteForm={noteForm}
              setNoteForm={setNoteForm}
              panelError={panelError}
              onClose={closePanel}
              onSubmit={
                panelType === "task"
                  ? submitTask
                  : panelType === "assignment"
                    ? submitAssignment
                    : panelType === "skill"
                      ? submitSkill
                      : panelType === "video"
                        ? submitVideo
                      : panelType === "goal"
                        ? submitGoal
                        : submitNote
              }
            />
          )}

          {/* ASSIGNMENTS */}

          {activePage === "assignments" && (
            <AssignmentsPage
              assignments={assignments}
              addAssignment={addAssignment}
              increaseAssignmentProgress={increaseAssignmentProgress}
              deleteAssignment={deleteAssignment}
            />
          )}

          {/* SKILLS */}

          {activePage === "skills" && (
            <SkillsPage
              skills={skills}
              skillStatus={skillStatus}
              addSkill={addSkill}
              addYouTubeVideo={addYouTubeVideo}
              increaseSkillProgress={increaseSkillProgress}
              undoSkillProgress={undoSkillProgress}
              toggleVideo={toggleVideo}
              updateVideoNotes={updateVideoNotes}
              deleteSkill={deleteSkill}
            />
          )}

          {/* GOALS */}

          {activePage === "goals" && (
            <GoalsPage
              goals={goals}
              addGoal={addGoal}
              increaseGoal={increaseGoal}
              deleteGoal={deleteGoal}
            />
          )}

          {/* CALENDAR */}

          {activePage === "calendar" && (
            <CalendarPage tasks={tasks} assignments={assignments} />
          )}

          {/* FOCUS */}

          {activePage === "focus" && (
            <FocusPage
              timerMode={timerMode}
              timerSeconds={timerSeconds}
              timerRunning={timerRunning}
              timerMinutes={timerMinutes}
              timerSecs={timerSecs}
              focusTask={focusTask}
              setFocusTask={setFocusTask}
              setTimerRunning={setTimerRunning}
              setTimerModeAndReset={setTimerModeAndReset}
              resetTimer={resetTimer}
              focusHistory={focusHistory}
              focusStatus={focusStatus}
              focusActionBusy={focusActionBusy}
              handleFocusStartPause={handleFocusStartPause}
            />
          )}

          {/* NOTES */}

          {activePage === "notes" && (
            <NotesPage
              notes={notes}
              addNote={addNote}
              deleteNote={deleteNote}
            />
          )}

          {/* ANALYTICS */}

          {activePage === "analytics" && (
            <AnalyticsPage
              tasks={tasks}
              completedTasks={completedTasks}
              focusMinutes={focusMinutes}
              watchedVideos={watchedVideos}
              totalVideos={totalVideos}
              productivity={productivity}
              learningProgress={learningProgress}
              assignments={assignments}
              goals={goals}
            />
          )}

          {/* REVIEW */}

          {activePage === "review" && (
            <ReviewPage
              tasks={tasks}
              completedTasks={completedTasks}
              focusMinutes={focusMinutes}
              watchedVideos={watchedVideos}
              reviewStatus={reviewStatus}
              onCompleteReview={completeTodayReview}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function DiscordPage({
  inviteUrl,
  linkCode,
  expiresAt,
  loading,
  error,
  copied,
  linked,
  discordUsername,
  checking,
  onCreateCode,
  onCopyCode,
}) {
  return (
    <section className="page-section discord-page">
      <div className="page-heading">
       <div>
        <span className="section-kicker">COMMUNITY</span>

        <h3>
       {linked
          ? "Discord Connected"
          : "Connect your Discord"}
          </h3>

          <p>
            {linked
              ? "Your Mahei-Pathap account is connected to your Discord account."
              : "Link your Mahei-Pathap account with your Discord account so your study activity can be connected later."}
          </p>
          </div>
        <MessageCircle size={32} />
      </div>
      {linked && (
  <div className="discord-connect-card">
    <div className="discord-connect-icon">
      <ShieldCheck size={28} />
    </div>

    <div className="discord-connect-content">
      <h4>Discord account successfully linked</h4>

      <p>
        {discordUsername
          ? <>Connected as <strong>{discordUsername}</strong>.</>
          : "Your Discord account is connected to your Mahei-Pathap account."}
      </p>

      <a
        className="dark-button"
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={16} /> Open Discord
      </a>
    </div>
  </div>
)}
    {!linked && (
  <>
      <div className="discord-connect-card">
        <div className="discord-connect-icon"><Link2 size={28} /></div>
        <div className="discord-connect-content">
          <h4>1. Join the Mahei-Pathap Discord</h4>
          <p>Join the server first, then use the one-time code below to link the two accounts.</p>
          <a className="dark-button" href={inviteUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={16} /> Join Discord
          </a>
        </div>
      </div>

      <div className="discord-connect-card">
        <div className="discord-connect-icon"><Link2 size={28} /></div>
        <div className="discord-connect-content">
          <h4>2. Generate your linking code</h4>
          <p>Generate a short-lived code while signed in to Mahei-Pathap. Never share this code with anyone.</p>
          <button className="dark-button" type="button" onClick={onCreateCode} disabled={loading}>
            <Link2 size={16} /> {loading ? "Generating…" : linkCode ? "Generate New Code" : "Generate Link Code"}
          </button>

          {linkCode && (
            <div className="discord-link-code">
              <strong>{linkCode}</strong>
              <button type="button" onClick={onCopyCode} aria-label="Copy Discord link code">
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
              {expiresAt && <small>Expires {new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>}
            </div>
          )}
        </div>
      </div>

      <div className="discord-connect-card">
        <div className="discord-connect-icon"><MessageCircle size={28} /></div>
        <div className="discord-connect-content">
          <h4>3. Confirm inside Discord</h4>
          <p>In the Mahei-Pathap Discord server, run <code>/link YOUR-CODE</code>. The bot will securely attach your Discord ID to your Mahei-Pathap account.</p>
        </div>
      </div>
    </>
)}
      {error && <div className="inline-error">{error}</div>}
    </section>
  );
}

function Dashboard({
  userName,
  tasks,
  assignments,
  completedTasks,
  focusMinutes,
  watchedVideos,
  productivity,
  learningProgress,
  navigate,
  toggleTask,
}) {
  const pending = tasks.filter((task) => task.status !== "Completed");
  const greeting = getGreeting();

  return (
    <div className="page-stack">
      <section className="welcome-card">
        <div className="welcome-decoration">✨</div>

        <div className="welcome-content">
          <span className="date-pill">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>

          <h1>{greeting}, {userName}!</h1>

          <p>
            You have <strong>{pending.length} tasks</strong> waiting and{" "}
            <strong>{assignments.length} assignments</strong> on your radar.
            Keep going—you&apos;re doing great! 🌱
          </p>

          <div className="welcome-buttons">
            <button
              className="white-button"
              onClick={() => navigate("tasks")}
            >
              <CheckSquare size={17} />
              View today&apos;s tasks
            </button>

            <button
              className="glass-button"
              onClick={() => navigate("focus")}
            >
              <Play size={16} />
              Quick focus
            </button>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard
          icon="📝"
          title="Completed Tasks"
          value={completedTasks}
          extra={`/ ${tasks.length}`}
          color="orange"
        />

        <StatCard
          icon="⏱️"
          title="Focus Time"
          value={focusMinutes}
          extra="mins"
          color="blue"
        />

        <StatCard
          icon="🎓"
          title="Videos Watched"
          value={watchedVideos}
          extra="videos"
          color="purple"
        />

        <StatCard
          icon="🔥"
          title="Productivity"
          value={productivity}
          extra="%"
          color="yellow"
        />
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader
            title="Today&apos;s Tasks"
            icon="📝"
            color="orange"
            action="View all"
            onAction={() => navigate("tasks")}
          />

          <div className="item-list">
            {tasks.slice(0, 4).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
              />
            ))}

            {tasks.length === 0 && <EmptyState text="No tasks yet 🎉" />}
          </div>
        </div>

        <div className="card">
          <SectionHeader
            title="Upcoming Assignments"
            icon="📚"
            color="coral"
            action="View all"
            onAction={() => navigate("assignments")}
          />

          <div className="item-list">
            {assignments.slice(0, 3).map((assignment) => (
              <AssignmentMini
                key={assignment.id}
                assignment={assignment}
              />
            ))}

            {assignments.length === 0 && (
              <EmptyState text="No assignments 🎉" />
            )}
          </div>
        </div>
      </section>

      <section className="card learning-summary">
        <div>
          <span className="section-label">🎓 Learning progress</span>

          <h3>Keep building your skills</h3>

          <p>
            Your overall video learning progress is{" "}
            <strong>{learningProgress}%</strong>.
          </p>
        </div>

        <div className="big-progress">
          <div className="progress-number">{learningProgress}%</div>

          <div className="progress-track">
            <div
              className="progress-fill purple"
              style={{ width: `${learningProgress}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   TASK PAGE
========================================================= */

function TasksPage({ tasks, addTask, toggleTask, deleteTask }) {
  const [search, setSearch] = useState("");

  const filtered = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-stack">
      <PageIntro
        title="Task Manager"
        description="Organize college work, personal tasks, and learning."
        buttonText="Add New Task"
        onClick={addTask}
        icon={<Plus size={17} />}
        color="orange"
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <span className="result-count">{filtered.length} tasks</span>
      </div>

      <div className="task-list">
        {filtered.map((task) => (
          <div
            className={`task-card ${
              task.status === "Completed" ? "completed" : ""
            }`}
            key={task.id}
          >
            <div className="task-main">
              <button
                className={`check-button ${
                  task.status === "Completed" ? "checked" : ""
                }`}
                onClick={() => toggleTask(task.id)}
              >
                {task.status === "Completed" && <Check size={15} />}
              </button>

              <div>
                <h3>{task.title}</h3>

                <p>{task.notes || "No notes added."}</p>

                <div className="tag-row">
                  <span className="tag orange">{task.category}</span>
                  <span className="tag gray">⏱ {task.estTime} min</span>
                  <span className="tag gray">
                    📅 {formatDate(task.deadline)}
                  </span>
                </div>
              </div>
            </div>

            <div className="task-actions">
              <PriorityTag priority={task.priority} />

              <button
                className="delete-button"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <EmptyState text="No matching tasks found." />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ASSIGNMENTS
========================================================= */

function AssignmentsPage({
  assignments,
  addAssignment,
  increaseAssignmentProgress,
  deleteAssignment,
}) {
  return (
    <div className="page-stack">
      <PageIntro
        title="Assignment Manager"
        description="Track college deadlines and project progress."
        buttonText="Add Assignment"
        onClick={addAssignment}
        icon={<Plus size={17} />}
        color="coral"
      />

      <div className="two-column">
        {assignments.map((assignment) => (
          <div className="card assignment-card" key={assignment.id}>
            <div className="assignment-top">
              <span className="tag coral">{assignment.subject}</span>

              <span className="due">
                {getDaysUntil(assignment.dueDate) === 0
                  ? "Due today"
                  : `${getDaysUntil(assignment.dueDate)} days left`}
              </span>
            </div>

            <h3>{assignment.title}</h3>

            <p>{assignment.description || "No description added."}</p>

            <div className="progress-header">
              <span>Progress</span>
              <strong>{assignment.progress}%</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill coral"
                style={{ width: `${assignment.progress}%` }}
              />
            </div>

            <div className="assignment-footer">
              <button
                className="small-button coral-button"
                onClick={() => increaseAssignmentProgress(assignment.id)}
              >
                +25% Progress
              </button>

              <button
                className="delete-button"
                onClick={() => deleteAssignment(assignment.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   SKILLS
========================================================= */

function SkillsPage({
  skills,
  skillStatus,
  addSkill,
  addYouTubeVideo,
  increaseSkillProgress,
  undoSkillProgress,
  toggleVideo,
  updateVideoNotes,
  deleteSkill,
}) {
  return (
    <div className="page-stack">
      <PageIntro
        title="Skill Learning"
        description="Learn skills and watch YouTube courses directly inside Mahei-Pathap."
        buttonText="Add New Skill"
        onClick={addSkill}
        icon={<Plus size={17} />}
        color="purple"
      />

      {skillStatus && <p className="auth-hint">{skillStatus}</p>}

      {skills.length === 0 && (
        <div className="card">
          <EmptyState text="No skills added yet. Create one to start your learning journey." />
        </div>
      )}

      {skills.map((skill) => {
        const watched = skill.videos.filter((video) => video.watched).length;
        const watchedProgress =
          skill.videos.length === 0
            ? 0
            : Math.round((watched / skill.videos.length) * 100);

        const progress = Math.max(
          0,
          Math.min(
            100,
            Number.isFinite(Number(skill.progress))
              ? Number(skill.progress)
              : watchedProgress
          )
        );

        return (
          <div className="card skill-card" key={skill.id}>
            <div className="skill-header">
              <div>
                <span className="tag purple">{skill.category}</span>

                <h3>{skill.name}</h3>

                <p>{skill.notes || "Keep learning consistently."}</p>
              </div>

              <div className="skill-actions">
                <div className="skill-progress">
                  <strong>{progress}%</strong>
                  <span>complete</span>
                </div>

                <button
                  className="small-button purple-button"
                  onClick={() => addYouTubeVideo(skill.id)}
                >
                  <Youtube size={15} />
                  Add YouTube
                </button>

                <button
                  className="small-button purple-button"
                  onClick={() => increaseSkillProgress(skill.id)}
                >
                  + Progress
                </button>

                <button
                  className="small-button"
                  onClick={() => undoSkillProgress(skill.id)}
                >
                  Undo -10%
                </button>

                <button
                  className="delete-button"
                  onClick={() => deleteSkill(skill.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill purple"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="video-grid">
              {skill.videos.map((video) => (
                <div className="video-card" key={video.id}>
                  <div className="video-title">
                    <div>
                      <Youtube size={17} />
                      <strong>{video.title}</strong>
                    </div>

                    <button
                      className={`watch-button ${
                        video.watched ? "watched" : ""
                      }`}
                      onClick={() => toggleVideo(skill.id, video.id)}
                    >
                      {video.watched ? "✓ Watched" : "Mark watched"}
                    </button>
                  </div>

                  <div className="video-content">
                    <div className="youtube-frame">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>

                    <div className="video-notes">
                      <label htmlFor={`video-notes-${video.id}`}>
                        Notes
                      </label>
                      <textarea
                        id={`video-notes-${video.id}`}
                        value={video.notes || ""}
                        onChange={(event) =>
                          updateVideoNotes(skill.id, video.id, event.target.value)
                        }
                        placeholder="Write key takeaways while watching..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {skill.videos.length === 0 && (
                <div className="empty-video">
                  <Youtube size={30} />
                  <p>Add your first YouTube learning video.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   GOALS
========================================================= */

function GoalsPage({ goals, addGoal, increaseGoal, deleteGoal }) {
  return (
    <div className="page-stack">
      <PageIntro
        title="Goals & Growth"
        description="Turn big dreams into small actions."
        buttonText="Add Goal"
        onClick={addGoal}
        icon={<Plus size={17} />}
        color="yellow"
      />

      <div className="two-column">
        {goals.map((goal) => (
          <div className="card goal-card" key={goal.id}>
            <div className="goal-top">
              <span className="tag yellow">{goal.timeframe}</span>
              <span>{goal.category}</span>
            </div>

            <h3>{goal.title}</h3>

            <p>Target: {formatDate(goal.targetDate)}</p>

            <div className="progress-header">
              <span>Progress</span>
              <strong>{goal.progress}%</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill yellow"
                style={{ width: `${goal.progress}%` }}
              />
            </div>

            <div className="goal-footer">
              <button
                className="small-button yellow-button"
                onClick={() => increaseGoal(goal.id)}
              >
                +10% Progress
              </button>

              <button
                className="delete-button"
                onClick={() => deleteGoal(goal.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   CALENDAR
========================================================= */

function CalendarPage({ tasks, assignments }) {
  const todayDate = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDay = new Date(year, month, 1).getDay();

  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const events = [...tasks, ...assignments];

  function getDateString(day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getEventsForDate(dateString) {
    return events.filter(
      (item) => item.deadline === dateString || item.dueDate === dateString
    );
  }

  function changeMonth(offset) {
    setViewDate(new Date(year, month + offset, 1));
  }

  function goToToday() {
    setViewDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    setSelectedDate(today);
  }

  const selectedEvents = getEventsForDate(selectedDate);

  return (
    <div className="page-stack">
      <div className="card calendar-card">
        <div className="calendar-header">
          <div>
            <span className="section-label">📅 Your schedule</span>
            <h3>
              {viewDate.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h3>
          </div>

          <div className="calendar-controls">
            <button
              className="icon-button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft size={17} />
            </button>
            <button className="calendar-today" onClick={goToToday}>Today</button>
            <button
              className="icon-button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
            (day) => (
              <div className="calendar-weekday" key={day}>
                {day}
              </div>
            )
          )}

          {Array.from({ length: adjustedFirstDay }).map((_, index) => (
            <div className="calendar-empty" key={`empty-${index}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateString = getDateString(day);
            const isToday = dateString === today;
            const isSelected = dateString === selectedDate;
            const dayEvents = getEventsForDate(dateString);

            return (
              <button
                className={`calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                key={day}
                onClick={() => setSelectedDate(dateString)}
                aria-label={`${dateString}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`}
              >
                <span>{day}</span>

                {dayEvents.length > 0 && <i />}
              </button>
            );
          })}
        </div>

        <div className="selected-day-events">
          <div className="selected-day-heading">
            <strong>{formatDate(selectedDate)}</strong>
            <span>{selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}</span>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="calendar-no-events">No tasks or assignments for this day.</p>
          ) : (
            selectedEvents.map((item) => (
              <div className="calendar-event-row" key={`${item.id}-${item.title}`}>
                <span className={item.deadline ? "event-dot task-dot" : "event-dot assignment-dot"} />
                <strong>{item.title}</strong>
                <span>{item.deadline ? "Task" : "Assignment"}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <SectionHeader title="Upcoming" icon="📌" color="blue" />

        <div className="item-list">
          {events
            .filter((item) => {
              const eventDate = item.deadline || item.dueDate;
              return getDaysUntil(eventDate) !== null;
            })
            .slice(0, 8)
            .map((item) => (
              <div className="upcoming-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{formatDate(item.deadline || item.dueDate)}</span>
                </div>

                <ChevronRight size={17} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FOCUS
========================================================= */

function FocusPage({
  timerMode,
  timerSeconds,
  timerRunning,
  timerMinutes,
  timerSecs,
  focusTask,
  setFocusTask,
  setTimerRunning,
  setTimerModeAndReset,
  resetTimer,
  focusHistory,
  focusStatus,
  focusActionBusy,
  handleFocusStartPause,
}) {
  return (
    <div className="focus-page">
      <div className="card focus-card">
        <span className="section-label">🧠 Deep work room</span>

        <h3>Focus & Pomodoro</h3>

        <p>
          Work in small focused sessions and give your brain proper breaks.
        </p>

        <div className="timer-modes">
          <button
            className={timerMode === "work" ? "selected" : ""}
            onClick={() => setTimerModeAndReset("work")}
          >
            <Timer size={15} />
            Focus 25m
          </button>

          <button
            className={timerMode === "short" ? "selected" : ""}
            onClick={() => setTimerModeAndReset("short")}
          >
            <Coffee size={15} />
            Short 5m
          </button>

          <button
            className={timerMode === "long" ? "selected" : ""}
            onClick={() => setTimerModeAndReset("long")}
          >
            <Moon size={15} />
            Long 15m
          </button>
        </div>

        <div className="timer-circle">
          <div>
            <span>
              {String(timerMinutes).padStart(2, "0")}:
              {String(timerSecs).padStart(2, "0")}
            </span>

            <small>{timerRunning ? "Stay focused" : "Ready?"}</small>
          </div>
        </div>

        <input
          className="focus-input"
          value={focusTask}
          onChange={(event) => setFocusTask(event.target.value)}
          placeholder="What are you working on?"
        />

        {focusStatus && (
          <p className="focus-status" role="status">
            {focusStatus}
          </p>
        )}

        <div className="timer-buttons">
          <button
            className="dark-button large"
            onClick={handleFocusStartPause}
            disabled={focusActionBusy}
          >
            {timerRunning ? <Pause size={18} /> : <Play size={18} />}
            {focusActionBusy ? "Working…" : timerRunning ? "Pause" : "Start Focus"}
          </button>

          <button className="reset-button" onClick={resetTimer}>
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      <div className="card focus-history">
        <SectionHeader title="Focus history" icon="🔥" color="orange" />

        {focusHistory.length === 0 ? (
          <EmptyState text="Your completed focus sessions will appear here." />
        ) : (
          <div className="item-list">
            {focusHistory.slice(-8).reverse().map((item) => (
              <div className="upcoming-row" key={item.id}>
                <div>
                  <strong>{item.task}</strong>
                  <span>
                    {item.duration} minutes · {formatDate(item.date)}
                  </span>
                </div>

                <Timer size={17} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   NOTES
========================================================= */

function NotesPage({ notes, addNote, deleteNote }) {
  return (
    <div className="page-stack">
      <PageIntro
        title="Notes & Journal"
        description="Save learning notes, ideas, reflections and revision points."
        buttonText="Add Note"
        onClick={addNote}
        icon={<Plus size={17} />}
        color="mint"
      />

      <div className="two-column">
        {notes.map((note) => (
          <div className="card note-card" key={note.id}>
            <div className="note-top">
              <span className="tag mint">{note.category}</span>
              <span>{formatDate(note.date)}</span>
            </div>

            <h3>{note.title}</h3>

            <p>{note.content}</p>

            <button
              className="delete-button"
              onClick={() => deleteNote(note.id)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function AnalyticsPage({
  completedTasks,
  focusMinutes,
  watchedVideos,
  totalVideos,
  productivity,
  learningProgress,
  assignments,
  goals,
}) {
  const completedAssignments = assignments.filter(
    (item) => item.progress === 100
  ).length;

  const averageGoalProgress =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length
        );

  return (
    <div className="page-stack">
      <div className="analytics-hero">
        <div>
          <span>📊 Your progress</span>
          <h2>You&apos;re building momentum!</h2>
          <p>
            Small consistent actions are turning into real progress.
          </p>
        </div>

        <Trophy size={50} />
      </div>

      <section className="stat-grid">
        <StatCard
          icon="✅"
          title="Tasks Completed"
          value={completedTasks}
          color="orange"
        />

        <StatCard
          icon="⏱️"
          title="Focus Minutes"
          value={focusMinutes}
          color="blue"
        />

        <StatCard
          icon="🎥"
          title="Videos Watched"
          value={watchedVideos}
          color="purple"
        />

        <StatCard
          icon="🎯"
          title="Goal Progress"
          value={averageGoalProgress}
          extra="%"
          color="yellow"
        />
      </section>

      <div className="two-column">
        <div className="card">
          <SectionHeader title="Productivity" icon="⚡" color="orange" />

          <BigMetric
            label="Task completion"
            value={productivity}
            suffix="%"
            color="orange"
          />

          <BigMetric
            label="Assignment completion"
            value={
              assignments.length === 0
                ? 0
                : Math.round(
                    (completedAssignments / assignments.length) * 100
                  )
            }
            suffix="%"
            color="coral"
          />
        </div>

        <div className="card">
          <SectionHeader title="Learning" icon="🎓" color="purple" />

          <BigMetric
            label={`Video progress (${watchedVideos}/${totalVideos})`}
            value={learningProgress}
            suffix="%"
            color="purple"
          />

          <p className="analytics-message">
            Keep your learning streak alive. Even 20 minutes today counts.
            🌱
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DAILY REVIEW
========================================================= */

function ReviewPage({
  tasks,
  completedTasks,
  focusMinutes,
  watchedVideos,
  reviewStatus,
  onCompleteReview,
}) {
  const unfinished = tasks.filter(
    (task) => task.status !== "Completed"
  );

  return (
    <div className="review-page">
      <div className="card review-card">
        <div className="review-icon">🌅</div>

        <span className="section-label">End of day</span>

        <h2>Daily Review</h2>

        <p>
          Take a moment to see what you accomplished and prepare for
          tomorrow.
        </p>

        <div className="review-stats">
          <div>
            <strong>{completedTasks}</strong>
            <span>Tasks completed</span>
          </div>

          <div>
            <strong>{focusMinutes}</strong>
            <span>Focus minutes</span>
          </div>

          <div>
            <strong>{watchedVideos}</strong>
            <span>Videos watched</span>
          </div>
        </div>

        <div className="review-section">
          <h3>Carry into tomorrow</h3>

          {unfinished.length === 0 ? (
            <div className="success-message">
              <Check size={18} />
              Everything is done. Amazing work! 🎉
            </div>
          ) : (
            <div className="item-list">
              {unfinished.map((task) => (
                <div className="upcoming-row" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.category}</span>
                  </div>

                  <AlertCircle size={17} />
                </div>
              ))}
            </div>
          )}
        </div>

        {reviewStatus && <p className="auth-hint">{reviewStatus}</p>}

        <button className="dark-button large" onClick={onCompleteReview}>
          <Save size={17} />
          Complete today&apos;s review
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function StatCard({ icon, title, value, extra, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>

      <div>
        <span>{title}</span>

        <strong>
          {value}
          {extra && <small>{extra}</small>}
        </strong>
      </div>
    </div>
  );
}

function PageIntro({
  title,
  description,
  buttonText,
  onClick,
  icon,
  color,
}) {
  return (
    <div className="page-intro">
      <div>
        <span className="section-label">✨ Mahei-Pathap</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <button className={`primary-button ${color}`} onClick={onClick}>
        {icon}
        {buttonText}
      </button>
    </div>
  );
}

function SectionHeader({ title, icon, action, onAction, color }) {
  return (
    <div className="section-header">
      <div className="section-title">
        <span className={`section-dot ${color}`} />
        <h3>{icon} {title}</h3>
      </div>

      {action && (
        <button className="link-button" onClick={onAction}>
          {action}
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle }) {
  return (
    <div className={`task-row ${task.status === "Completed" ? "done" : ""}`}>
      <button
        className={`check-button ${
          task.status === "Completed" ? "checked" : ""
        }`}
        onClick={() => onToggle(task.id)}
      >
        {task.status === "Completed" && <Check size={14} />}
      </button>

      <div>
        <strong>{task.title}</strong>

        <div className="mini-tags">
          <span>{task.category}</span>
          <span>{task.estTime}m</span>
        </div>
      </div>

      <PriorityTag priority={task.priority} />
    </div>
  );
}

function PriorityTag({ priority }) {
  const className =
    priority === "High"
      ? "high"
      : priority === "Medium"
      ? "medium"
      : "low";

  return <span className={`priority ${className}`}>{priority}</span>;
}

function AssignmentMini({ assignment }) {
  return (
    <div className="assignment-mini">
      <div className="assignment-mini-top">
        <span>{assignment.subject}</span>

        <small>{formatDate(assignment.dueDate)}</small>
      </div>

      <strong>{assignment.title}</strong>

      <div className="progress-track">
        <div
          className="progress-fill coral"
          style={{ width: `${assignment.progress}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <span>🌱</span>
      <p>{text}</p>
    </div>
  );
}

function LoginPage({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  authError,
  authSuccess,
  onSubmit,
  onGoogleSignIn,
  isAppwriteConfigured,
  passwordStrength,
  setPasswordStrength,
  emailVerificationSent,
}) {
  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand login-brand">
          <div className="brand-logo">🌱</div>

          <div>
            <h1>Mahei-Pathap</h1>
            <p>Your study companion</p>
          </div>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={authMode === "login" ? "active" : ""}
            onClick={() => setAuthMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={authMode === "signup" ? "active" : ""}
            onClick={() => setAuthMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          {authMode === "signup" && (
            <label className="field-group">
              <span>Full name</span>
              <input
                type="text"
                value={authForm.name}
                onChange={(event) =>
                  setAuthForm({ ...authForm, name: event.target.value })
                }
                placeholder="Your name"
              />
            </label>
          )}

          <label className="field-group">
            <span>Email</span>
            <input
              type="email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm({ ...authForm, email: event.target.value })
              }
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field-group">
            <span>Password</span>
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => {
                const newPassword = event.target.value;
                setAuthForm({ ...authForm, password: newPassword });
                if (authMode === "signup") {
                  const validation = validatePassword(newPassword);
                  setPasswordStrength(validation.strength);
                }
              }}
              placeholder="******"
              required
            />
            {authMode === "signup" && authForm.password && (
              <div className="password-strength-container">
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength),
                    }}
                  />
                </div>
                <span className="password-strength-text" style={{ color: getPasswordStrengthColor(passwordStrength) }}>
                  {getPasswordStrengthLevel(passwordStrength)}
                </span>
              </div>
            )}
          </label>

          {authMode === "signup" && (
            <label className="field-group">
              <span>Confirm Password</span>
              <input
                type="password"
                value={authForm.confirmPassword}
                onChange={(event) =>
                  setAuthForm({ ...authForm, confirmPassword: event.target.value })
                }
                placeholder="Confirm your password"
                required
              />
            </label>
          )}

          {!isAppwriteConfigured && (
            <p className="auth-hint">
              Appwrite is not configured yet, so the app is running in demo mode.
            </p>
          )}

          {emailVerificationSent && (
            <p className="auth-success">
              {authSuccess || "Check your email to verify your address."}
            </p>
          )}

          {!emailVerificationSent && authSuccess && (
            <p className="auth-success">{authSuccess}</p>
          )}

          {authError && <p className="auth-error">{authError}</p>}

          <button type="submit" className="primary-button orange full-width">
            {authMode === "login" ? "Login" : "Create account"}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button
            type="button"
            className="google-button full-width"
            onClick={onGoogleSignIn}
          >
            <strong>G</strong>
            Continue with Google
          </button>

          <p className="recaptcha-notice">
            This site is protected by reCAPTCHA and the Google
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Privacy Policy</a>
            and
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"> Terms of Service</a>
            apply.
          </p>
        </form>
      </div>
    </div>
  );
}

function CreatePanel({
  type,
  taskForm,
  setTaskForm,
  assignmentForm,
  setAssignmentForm,
  skillForm,
  setSkillForm,
  videoForm,
  setVideoForm,
  goalForm,
  setGoalForm,
  noteForm,
  setNoteForm,
  panelError,
  onClose,
  onSubmit,
}) {
  const isTask = type === "task";
  const isAssignment = type === "assignment";
  const isSkill = type === "skill";
  const isVideo = type === "video";
  const isGoal = type === "goal";
  const isNote = type === "note";

  const title =
    isTask
      ? "Add New Task"
      : isAssignment
        ? "Add Assignment"
        : isSkill
          ? "Add New Skill"
          : isVideo
            ? "Add YouTube Lesson"
          : isGoal
            ? "Add Goal"
            : "Add Note";

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <span className="section-label">✨ Mahei-Pathap</span>
            <h3>{title}</h3>
          </div>

          <button className="panel-close" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

        <form className="panel-form" onSubmit={onSubmit}>
          {isTask && (
            <>
              <label className="field-group">
                <span>Task title</span>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, title: event.target.value })
                  }
                  placeholder="Complete assignment"
                  required
                />
              </label>

              <div className="two-field-grid">
                <label className="field-group">
                  <span>Category</span>
                  <select
                    value={taskForm.category}
                    onChange={(event) =>
                      setTaskForm({ ...taskForm, category: event.target.value })
                    }
                  >
                    <option>College</option>
                    <option>Learning</option>
                    <option>Personal</option>
                    <option>Wellness</option>
                  </select>
                </label>

                <label className="field-group">
                  <span>Priority</span>
                  <select
                    value={taskForm.priority}
                    onChange={(event) =>
                      setTaskForm({ ...taskForm, priority: event.target.value })
                    }
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
              </div>

              <div className="two-field-grid">
                <label className="field-group">
                  <span>Deadline</span>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(event) =>
                      setTaskForm({ ...taskForm, deadline: event.target.value })
                    }
                  />
                </label>

                <label className="field-group">
                  <span>Est. time (min)</span>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={taskForm.estTime}
                    onChange={(event) =>
                      setTaskForm({ ...taskForm, estTime: event.target.value })
                    }
                  />
                </label>
              </div>

              <label className="field-group">
                <span>Notes</span>
                <textarea
                  rows="4"
                  value={taskForm.notes}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, notes: event.target.value })
                  }
                  placeholder="Add any important notes..."
                />
              </label>
            </>
          )}

          {isAssignment && (
            <>
              <div className="two-field-grid">
                <label className="field-group">
                  <span>Subject</span>
                  <input
                    type="text"
                    value={assignmentForm.subject}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        subject: event.target.value,
                      })
                    }
                    placeholder="Computer Science"
                  />
                </label>

                <label className="field-group">
                  <span>Progress (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={assignmentForm.progress}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        progress: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="field-group">
                <span>Assignment title</span>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(event) =>
                    setAssignmentForm({ ...assignmentForm, title: event.target.value })
                  }
                  placeholder="Research paper"
                  required
                />
              </label>

              <label className="field-group">
                <span>Due date</span>
                <input
                  type="date"
                  value={assignmentForm.dueDate}
                  onChange={(event) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      dueDate: event.target.value,
                    })
                  }
                />
              </label>

              <label className="field-group">
                <span>Description</span>
                <textarea
                  rows="4"
                  value={assignmentForm.description}
                  onChange={(event) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      description: event.target.value,
                    })
                  }
                  placeholder="Add a brief description..."
                />
              </label>
            </>
          )}

          {isSkill && (
            <>
              <label className="field-group">
                <span>Skill name</span>
                <input
                  type="text"
                  value={skillForm.name}
                  onChange={(event) =>
                    setSkillForm({ ...skillForm, name: event.target.value })
                  }
                  placeholder="React Native"
                  required
                />
              </label>

              <label className="field-group">
                <span>Category</span>
                <select
                  value={skillForm.category}
                  onChange={(event) =>
                    setSkillForm({ ...skillForm, category: event.target.value })
                  }
                >
                  <option>Programming</option>
                  <option>Development</option>
                  <option>Design</option>
                  <option>Languages</option>
                </select>
              </label>

              <label className="field-group">
                <span>Notes</span>
                <textarea
                  rows="4"
                  value={skillForm.notes}
                  onChange={(event) =>
                    setSkillForm({ ...skillForm, notes: event.target.value })
                  }
                  placeholder="What do you want to learn?"
                />
              </label>
            </>
          )}

          {isVideo && (
            <>
              <label className="field-group">
                <span>Video title</span>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(event) =>
                    setVideoForm({ ...videoForm, title: event.target.value })
                  }
                  placeholder="Lesson 1: Variables"
                  required
                />
              </label>

              <label className="field-group">
                <span>YouTube URL</span>
                <input
                  type="url"
                  value={videoForm.url}
                  onChange={(event) =>
                    setVideoForm({ ...videoForm, url: event.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v="
                  required
                />
              </label>

              <label className="field-group">
                <span>Notes</span>
                <textarea
                  rows="4"
                  value={videoForm.notes}
                  onChange={(event) =>
                    setVideoForm({ ...videoForm, notes: event.target.value })
                  }
                  placeholder="What should you focus on in this lesson?"
                />
              </label>
            </>
          )}

          {isGoal && (
            <>
              <label className="field-group">
                <span>Goal title</span>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, title: event.target.value })
                  }
                  placeholder="Finish JavaScript course"
                  required
                />
              </label>

              <div className="two-field-grid">
                <label className="field-group">
                  <span>Timeframe</span>
                  <select
                    value={goalForm.timeframe}
                    onChange={(event) =>
                      setGoalForm({ ...goalForm, timeframe: event.target.value })
                    }
                  >
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Long-term</option>
                  </select>
                </label>

                <label className="field-group">
                  <span>Category</span>
                  <select
                    value={goalForm.category}
                    onChange={(event) =>
                      setGoalForm({ ...goalForm, category: event.target.value })
                    }
                  >
                    <option>Growth</option>
                    <option>Career</option>
                    <option>Learning</option>
                    <option>Health</option>
                  </select>
                </label>
              </div>

              <div className="two-field-grid">
                <label className="field-group">
                  <span>Progress (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={goalForm.progress}
                    onChange={(event) =>
                      setGoalForm({ ...goalForm, progress: event.target.value })
                    }
                  />
                </label>

                <label className="field-group">
                  <span>Target date</span>
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(event) =>
                      setGoalForm({ ...goalForm, targetDate: event.target.value })
                    }
                  />
                </label>
              </div>
            </>
          )}

          {isNote && (
            <>
              <label className="field-group">
                <span>Note title</span>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(event) =>
                    setNoteForm({ ...noteForm, title: event.target.value })
                  }
                  placeholder="Study focus"
                  required
                />
              </label>

              <label className="field-group">
                <span>Category</span>
                <select
                  value={noteForm.category}
                  onChange={(event) =>
                    setNoteForm({ ...noteForm, category: event.target.value })
                  }
                >
                  <option>Journal</option>
                  <option>Ideas</option>
                  <option>Reflection</option>
                </select>
              </label>

              <label className="field-group">
                <span>Write your note</span>
                <textarea
                  rows="6"
                  value={noteForm.content}
                  onChange={(event) =>
                    setNoteForm({ ...noteForm, content: event.target.value })
                  }
                  placeholder="Write down your thoughts..."
                  required
                />
              </label>
            </>
          )}

          {panelError && <p className="auth-error">{panelError}</p>}

          <div className="panel-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button orange">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BigMetric({ label, value, suffix, color }) {
  return (
    <div className="big-metric">
      <div className="progress-header">
        <span>{label}</span>
        <strong>{value}{suffix}</strong>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { shiftsAPI, authAPI, adminAPI, notificationsAPI, localTimeToUTC } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

// WebSocket URL (same as API but for socket.io)
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001';

// Hardcoded admin email
const ADMIN_EMAIL = 'tyler@fullscopeestimating.com';

// Preset task names (used for quick task entry)
const PRESET_TASK_NAMES = [
  'Copying scope',
  'Confirming COC received',
  'Confirming supplement received',
  'Confirming depreciation released',
  'Confirming supplement reviewed',
  'Writing supplement',
  'Inbound call'
];

// Check if a task is a preset task (non-editable)
const isPresetTask = (task) => {
  if (!task || !task.includes(' - ')) return false;
  return PRESET_TASK_NAMES.some(preset => task.startsWith(preset + ' - '));
};

// Get the Sunday-to-Saturday week bounds for a given date (matches backend)
const getWeekBounds = (date = new Date()) => {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : new Date(date);
  const day = d.getDay(); // 0 = Sunday

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - day);
  weekStart.setHours(12, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(12, 0, 0, 0);

  const formatDate = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  // Format display like backend
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();

  let display;
  if (startMonth === endMonth) {
    display = `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    display = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }

  return {
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    display
  };
};

// Generate consistent avatar gradient from name
const getAvatarGradient = (name) => {
  const gradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a8edea, #fed6e3)',
    'linear-gradient(135deg, #ff9a9e, #fecfef)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #ffecd2, #fcb69f)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #11998e, #38ef7d)',
    'linear-gradient(135deg, #fc4a1a, #f7b733)',
    'linear-gradient(135deg, #00b4db, #0083b0)',
    'linear-gradient(135deg, #834d9b, #d04ed6)',
    'linear-gradient(135deg, #1d976c, #93f9b9)',
  ];
  // Hash the name to get consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

function TimeClock() {
  const { user, logout } = useAuth();
  const [completedBlocks, setCompletedBlocks] = useState([]);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [currentTasks, setCurrentTasks] = useState(['']); // Array of task inputs for current block
  const [pendingPreset, setPendingPreset] = useState(null); // Preset task waiting for detail input
  const [presetDetail, setPresetDetail] = useState(''); // Detail input for preset task (e.g., "Jones")
  const [editingBlock, setEditingBlock] = useState(null); // For "going back in time"
  const [editingBlockOriginal, setEditingBlockOriginal] = useState(null); // Original block before editing (for cancel)
  const [editingTasks, setEditingTasks] = useState(['']); // Array of task inputs for editing block
  const [editingOriginalIndex, setEditingOriginalIndex] = useState(null); // Track original position
  const [swipingBlockId, setSwipingBlockId] = useState(null);
  const [showCancelShiftConfirm, setShowCancelShiftConfirm] = useState(false); // Confirm cancel shift dialog
  const [showDeleteBlockConfirm, setShowDeleteBlockConfirm] = useState(false); // Confirm delete block dialog
  const [deleteBlockTarget, setDeleteBlockTarget] = useState(null); // Block to delete after confirmation
  const [testBlocks, setTestBlocks] = useState(5);
  const [testBreaks, setTestBreaks] = useState(2);
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'history', or 'admin'
  const [adminShifts, setAdminShifts] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === 'admin';

  // Admin Panel State
  const [adminSubTab, setAdminSubTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersPagination, setAdminUsersPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [adminShiftsPagination, setAdminShiftsPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [adminShiftsFilters, setAdminShiftsFilters] = useState({ userId: '', startDate: '', endDate: '' });
  // Week-grouped shifts for All Shifts view
  const [shiftsWeeks, setShiftsWeeks] = useState([]);
  const [shiftsWeeksLoading, setShiftsWeeksLoading] = useState(false);
  const [shiftsWeeksOffset, setShiftsWeeksOffset] = useState(0);
  const [shiftsWeeksHasMore, setShiftsWeeksHasMore] = useState(true);
  const [shiftsEmployeeFilter, setShiftsEmployeeFilter] = useState('');
  const [shiftsStatusFilter, setShiftsStatusFilter] = useState('');
  const [shiftsSelectMode, setShiftsSelectMode] = useState(false);
  const [selectedShiftIds, setSelectedShiftIds] = useState(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchActionDropdown, setBatchActionDropdown] = useState(false);
  const [statusDropdownShiftId, setStatusDropdownShiftId] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [employeeEditingShift, setEmployeeEditingShift] = useState(null);
  const [viewingShift, setViewingShift] = useState(null);
  const [viewingShiftLoading, setViewingShiftLoading] = useState(false);
  const [expandedTaskBlocks, setExpandedTaskBlocks] = useState(new Set());
  const [creatingShift, setCreatingShift] = useState(false);
  const [newShiftData, setNewShiftData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '08:00',
    clockOutTime: '17:00',
    timeBlocks: [{ id: Date.now(), startTime: '08:00', endTime: '17:00', tasks: '', isBreak: false }]
  });
  const [savingShift, setSavingShift] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: '', password: '', name: '', role: 'user', status: 'active' });
  const [dbTables, setDbTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ rows: [], pagination: {}, schema: [], config: {} });
  const [tableLoading, setTableLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [adminToast, setAdminToast] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [shifts, setShifts] = useState([]);
  const [myPayWeeks, setMyPayWeeks] = useState([]); // Current user's shifts grouped by pay week
  const [myPayWeeksLoading, setMyPayWeeksLoading] = useState(false);
  const [myPayWeeksOffset, setMyPayWeeksOffset] = useState(0); // For infinite scroll pagination
  const [myPayWeeksHasMore, setMyPayWeeksHasMore] = useState(true);
  const [expandedMyWeeks, setExpandedMyWeeks] = useState(new Set()); // Track which weeks are expanded in history
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { shift, message }
  const [expandedShifts, setExpandedShifts] = useState(new Set()); // Track expanded shift IDs
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewShiftData, setPreviewShiftData] = useState(null);
  const [showGapModal, setShowGapModal] = useState(false);
  const [gapData, setGapData] = useState(null); // { startTime, endTime, pendingBlocks, gapIndex }
  const [gapTasks, setGapTasks] = useState(['']);
  const [gapIsBreak, setGapIsBreak] = useState(false); // Fill gap as break
  const [pendingGapPreset, setPendingGapPreset] = useState(null);
  const [gapPresetDetail, setGapPresetDetail] = useState('');
  const [blocksBeforeEdit, setBlocksBeforeEdit] = useState(null); // For restoring on gap cancel
  const [gapAnimatingIndex, setGapAnimatingIndex] = useState(null); // Index where gap animation is happening
  const [gapAttentionPulse, setGapAttentionPulse] = useState(false); // Pulse animation to draw attention to gap
  const [slidingOutBlockId, setSlidingOutBlockId] = useState(null); // Block animating out for editing
  const [deletingBlockId, setDeletingBlockId] = useState(null); // Block animating out for deletion
  const [deleteGapSource, setDeleteGapSource] = useState(null); // 'delete' to track gap from deletion vs edit
  const [newlyAddedBlockId, setNewlyAddedBlockId] = useState(null); // Track which block should animate in
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ newEmail: '', password: '' });
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  // Auto-save state
  const [pendingShiftId, setPendingShiftId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryShift, setRecoveryShift] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const shiftsScrollRef = useRef(null);
  const shiftsLoadingRef = useRef(false);
  const shiftsHasMoreRef = useRef(true);

  // Admin Panel Redesign State
  const [pendingShifts, setPendingShifts] = useState([]);
  const [approvedShifts, setApprovedShifts] = useState([]);
  const [pendingShiftsLoading, setPendingShiftsLoading] = useState(false);
  const [selectedPendingShifts, setSelectedPendingShifts] = useState(new Set());
  const [expandedPendingShifts, setExpandedPendingShifts] = useState(new Set());
  const [rejectModalShift, setRejectModalShift] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Weekly View State
  const [weeklyViewData, setWeeklyViewData] = useState(null);
  const [weeklyViewLoading, setWeeklyViewLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [weeklyViewMode, setWeeklyViewMode] = useState('calendar'); // 'list' or 'calendar'
  const [showWeeksSidebar, setShowWeeksSidebar] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [weekSlideDirection, setWeekSlideDirection] = useState(null); // 'left' or 'right' for animation
  const [weeklyViewCache, setWeeklyViewCache] = useState({}); // Cache weekly data by weekStart

  // Dashboard Leaderboard Week Navigation State
  const [dashboardWeekStart, setDashboardWeekStart] = useState(null);
  const [dashboardLeaderboard, setDashboardLeaderboard] = useState(null);
  const [dashboardSlideDirection, setDashboardSlideDirection] = useState(null);
  const [dashboardAvailableWeeks, setDashboardAvailableWeeks] = useState([]);

  // User Pay Weeks State
  const [viewingUserPayWeeks, setViewingUserPayWeeks] = useState(null);
  const [userPayWeeksData, setUserPayWeeksData] = useState(null);
  const [userPayWeeksLoading, setUserPayWeeksLoading] = useState(false);
  const [expandedPayWeeks, setExpandedPayWeeks] = useState(new Set());

  // Activity Modal State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityData, setActivityData] = useState({ activity: [], pagination: {} });
  const [activityLoading, setActivityLoading] = useState(false);

  // Admin clock-in toggle (hidden by default)
  const [showAdminClockIn, setShowAdminClockIn] = useState(false);

  // Admin viewing as employee toggle
  const [adminViewingAsEmployee, setAdminViewingAsEmployee] = useState(false);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const data = await shiftsAPI.getAll();
        setShifts(data);
      } catch (err) {
        console.error('Failed to load shifts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadShifts();
  }, []);

  // Load current user's shifts grouped by pay week (Arizona time) with infinite scroll
  const loadMyPayWeeks = async (reset = false) => {
    if (myPayWeeksLoading) return;

    setMyPayWeeksLoading(true);
    try {
      const currentOffset = reset ? 0 : myPayWeeksOffset;
      const weeksToLoad = currentOffset === 0 ? 3 : 2; // 3 initial, 2 per subsequent load

      const data = await shiftsAPI.getByWeek({
        limit: weeksToLoad,
        offset: currentOffset
      });

      const newWeeks = data.payWeeks || [];

      if (reset) {
        setMyPayWeeks(newWeeks);
        // Expand ALL weeks by default
        setExpandedMyWeeks(new Set(newWeeks.map(w => w.weekStart)));
      } else {
        setMyPayWeeks(prev => [...prev, ...newWeeks]);
        // Also expand newly loaded weeks
        setExpandedMyWeeks(prev => {
          const updated = new Set(prev);
          newWeeks.forEach(w => updated.add(w.weekStart));
          return updated;
        });
      }

      setMyPayWeeksOffset(currentOffset + newWeeks.length);
      setMyPayWeeksHasMore(newWeeks.length === weeksToLoad); // If we got fewer than requested, no more
    } catch (err) {
      console.error('Failed to load pay weeks:', err);
    } finally {
      setMyPayWeeksLoading(false);
    }
  };

  // Load pay weeks when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && myPayWeeks.length === 0) {
      loadMyPayWeeks(true);
    }
  }, [activeTab]);

  // Set default tab to admin for admin users
  useEffect(() => {
    if (isAdmin) {
      setActiveTab('admin');
    }
  }, [isAdmin]);

  // Check for pending shift on load (for recovery)
  useEffect(() => {
    const checkPendingShift = async () => {
      try {
        const pending = await shiftsAPI.getPending();
        if (pending && pending.id) {
          setRecoveryShift(pending);
          setShowRecoveryModal(true);
        }
      } catch (err) {
        console.error('Failed to check pending shift:', err);
      }
    };
    checkPendingShift();
  }, []);

  // Load notifications for non-admin users on mount
  useEffect(() => {
    if (user && !isAdmin) {
      loadNotifications();
      // Refresh notifications every 60 seconds
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  // Load admin data when admin tab is selected
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      if (adminSubTab === 'dashboard' && !dashboardData) {
        loadDashboard();
        loadDashboardLeaderboard();
      } else if (adminSubTab === 'users' && adminUsers.length === 0) {
        loadAdminUsers();
      } else if (adminSubTab === 'shifts') {
        if (shiftsWeeks.length === 0) loadShiftsByWeek(true);
        if (adminUsers.length === 0) loadAdminUsers(); // For Create Shift modal
      } else if (adminSubTab === 'pending' && pendingShifts.length === 0) {
        loadPendingShifts();
      } else if (adminSubTab === 'weekly' && !weeklyViewData) {
        loadWeeklyView();
      } else if (adminSubTab === 'activity' && !activityData.activity?.length) {
        loadActivity();
      }
    }
  }, [activeTab, adminSubTab, isAdmin]);

  // WebSocket connection for real-time badge updates
  useEffect(() => {
    if (isAdmin && user) {
      // Load initial count
      refreshPendingCount();

      // Connect to WebSocket
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        socket.emit('join-admin');
      });

      socket.on('pending-count', (count) => {
        console.log('Received pending count:', count);
        setPendingCount(count);
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAdmin, user]);

  // Auto-dismiss admin toast after 3 seconds for all messages
  useEffect(() => {
    if (adminToast) {
      const timer = setTimeout(() => {
        setAdminToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [adminToast]);

  // Infinite scroll for All Shifts view
  useEffect(() => {
    const sentinel = shiftsScrollRef.current;
    if (!sentinel || !shiftsWeeksHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Use refs to get current values, avoiding stale closure issues
        if (entries[0].isIntersecting && shiftsHasMoreRef.current && !shiftsLoadingRef.current) {
          loadShiftsByWeek(false);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [shiftsWeeksHasMore, shiftsWeeks.length]);

  // Reload shifts when employee filter changes
  useEffect(() => {
    if (adminSubTab === 'shifts') {
      setShiftsWeeks([]);
      setShiftsWeeksOffset(0);
      setShiftsWeeksHasMore(true);
      shiftsHasMoreRef.current = true;
      shiftsLoadingRef.current = false;
      loadShiftsByWeek(true);
    }
  }, [shiftsEmployeeFilter]);

  const loadDashboard = async () => {
    setAdminLoading(true);
    try {
      const data = await adminAPI.getDashboard();
      setDashboardData(data);
      setPendingCount(data.pendingApprovalCount || 0);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setAdminToast({ type: 'error', message: 'Failed to load dashboard' });
    } finally {
      setAdminLoading(false);
    }
  };

  // Fetch just the pending count (lightweight)
  const refreshPendingCount = async () => {
    try {
      const data = await adminAPI.getDashboard();
      setPendingCount(data.pendingApprovalCount || 0);
    } catch (err) {
      // Silently fail - this is just a background refresh
    }
  };

  // Load dashboard leaderboard for a specific week
  const loadDashboardLeaderboard = async (weekStart = null) => {
    try {
      // Calculate current week bounds if not specified
      if (!weekStart) {
        const bounds = getWeekBounds();
        weekStart = bounds.weekStart;
      }

      // Load available weeks if not already loaded
      let weeks = dashboardAvailableWeeks;
      if (weeks.length === 0) {
        const weeksData = await adminAPI.getAvailableWeeks();
        weeks = weeksData.weeks || [];
        setDashboardAvailableWeeks(weeks);
      }

      // Get weekly view data for the leaderboard
      const data = await adminAPI.getWeeklyView(weekStart);
      setDashboardWeekStart(data.weekStart);
      setDashboardLeaderboard({
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        weekDisplay: data.weekDisplay,
        employees: data.employees || []
      });
    } catch (err) {
      console.error('Failed to load dashboard leaderboard:', err);
    }
  };

  const loadAdminUsers = async (page = 1) => {
    setAdminUsersLoading(true);
    try {
      const data = await adminAPI.getUsers({ page, limit: 25 });
      setAdminUsers(data.users);
      setAdminUsersPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load users:', err);
      setAdminToast({ type: 'error', message: 'Failed to load users' });
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const loadAdminShifts = async (page = 1) => {
    setAdminLoading(true);
    try {
      const params = { page, limit: 25, ...adminShiftsFilters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const data = await adminAPI.getShifts(params);
      setAdminShifts(data.shifts.map(s => ({
        ...s,
        userName: s.user_name,
        userEmail: s.user_email
      })));
      setAdminShiftsPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load shifts:', err);
      setAdminToast({ type: 'error', message: 'Failed to load shifts' });
    } finally {
      setAdminLoading(false);
    }
  };

  // Load shifts grouped by week for infinite scroll
  const loadShiftsByWeek = async (reset = false) => {
    if (shiftsLoadingRef.current) return;
    shiftsLoadingRef.current = true;
    setShiftsWeeksLoading(true);
    try {
      const offset = reset ? 0 : shiftsWeeksOffset;
      const params = { weeks: reset ? 2 : 1, offset };
      if (shiftsEmployeeFilter) params.userId = shiftsEmployeeFilter;

      const data = await adminAPI.getShiftsByWeek(params);

      if (reset) {
        setShiftsWeeks(data.weeks || []);
        setShiftsWeeksOffset(data.nextOffset || 0);
      } else {
        setShiftsWeeks(prev => [...prev, ...(data.weeks || [])]);
        setShiftsWeeksOffset(data.nextOffset ?? (shiftsWeeksOffset + 1));
      }
      shiftsHasMoreRef.current = data.hasMore;
      setShiftsWeeksHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load shifts by week:', err);
      setAdminToast({ type: 'error', message: 'Failed to load shifts' });
    } finally {
      shiftsLoadingRef.current = false;
      setShiftsWeeksLoading(false);
    }
  };

  // Load pending and approved shifts
  const loadPendingShifts = async () => {
    setPendingShiftsLoading(true);
    try {
      const [pendingData, approvedData] = await Promise.all([
        adminAPI.getPendingShifts(),
        adminAPI.getShifts({ status: 'approved', limit: 3 })
      ]);
      setPendingShifts(pendingData.shifts || []);
      setApprovedShifts(approvedData.shifts || []);
    } catch (err) {
      console.error('Failed to load shifts:', err);
      setAdminToast({ type: 'error', message: 'Failed to load shifts' });
    } finally {
      setPendingShiftsLoading(false);
    }
  };

  // Load weekly view data (with caching)
  const loadWeeklyView = async (weekStart = null, forceRefresh = false) => {
    // Check cache first (unless force refresh)
    const cacheKey = weekStart || 'current';
    if (!forceRefresh && weeklyViewCache[cacheKey]) {
      // Use cached data - instant transition!
      const cachedData = weeklyViewCache[cacheKey];
      setWeeklyViewData(cachedData);
      setCurrentWeekStart(cachedData.weekStart);
      return;
    }

    setWeeklyViewLoading(true);
    try {
      // Load weekly view data and available weeks in parallel
      const [data, weeksData] = await Promise.all([
        adminAPI.getWeeklyView(weekStart),
        availableWeeks.length === 0 ? adminAPI.getAvailableWeeks() : Promise.resolve({ weeks: availableWeeks })
      ]);
      setWeeklyViewData(data);
      setCurrentWeekStart(data.weekStart);
      // Cache the data
      setWeeklyViewCache(prev => ({ ...prev, [data.weekStart]: data }));
      if (weeksData.weeks) {
        setAvailableWeeks(weeksData.weeks);
      }
    } catch (err) {
      console.error('Failed to load weekly view:', err);
      setAdminToast({ type: 'error', message: 'Failed to load weekly view' });
    } finally {
      setWeeklyViewLoading(false);
    }
  };

  // Load user pay weeks
  const loadUserPayWeeks = async (userId) => {
    // Show loading view immediately
    setViewingUserPayWeeks(userId);
    setUserPayWeeksLoading(true);
    setUserPayWeeksData(null);
    try {
      const data = await adminAPI.getUserPayWeeks(userId);
      setUserPayWeeksData(data);
      // Auto-expand all pay weeks by default
      if (data.payWeeks && data.payWeeks.length > 0) {
        setExpandedPayWeeks(new Set(data.payWeeks.map(w => w.weekStart)));
      }
    } catch (err) {
      console.error('Failed to load user pay weeks:', err);
      setAdminToast({ type: 'error', message: 'Failed to load pay weeks' });
      setViewingUserPayWeeks(null); // Go back on error
    } finally {
      setUserPayWeeksLoading(false);
    }
  };

  // Load paginated activity
  const loadActivity = async (page = 1) => {
    setActivityLoading(true);
    try {
      const data = await adminAPI.getActivity({ page, limit: 20 });
      setActivityData(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
      setAdminToast({ type: 'error', message: 'Failed to load activity' });
    } finally {
      setActivityLoading(false);
    }
  };

  // Approve a shift
  const handleApproveShift = async (shiftId) => {
    try {
      await adminAPI.approveShift(shiftId);
      setAdminToast({ type: 'success', message: 'Shift approved' });
      loadPendingShifts();
      loadDashboard(); // Refresh pending count
      // Refresh All Shifts view if it has data
      if (shiftsWeeks.length > 0) {
        loadShiftsByWeek(true);
      }
      // Close shift detail view if viewing the approved shift
      if (viewingShift?.id === shiftId) {
        setViewingShift(null);
      }
    } catch (err) {
      console.error('Failed to approve shift:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to approve shift' });
    }
  };

  // Revert an approved shift back to pending
  const handleRevertToPending = async (shiftId) => {
    try {
      await adminAPI.revertToPending(shiftId);
      setAdminToast({ type: 'success', message: 'Shift reverted to pending approval' });
      loadPendingShifts();
      loadDashboard();
      if (shiftsWeeks.length > 0) {
        loadShiftsByWeek(true);
      }
      if (viewingShift?.id === shiftId) {
        setViewingShift(null);
      }
    } catch (err) {
      console.error('Failed to revert shift:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to revert shift' });
    }
  };

  // Reject a shift
  const handleRejectShift = async (shiftId, reason) => {
    try {
      await adminAPI.rejectShift(shiftId, reason);
      setAdminToast({ type: 'success', message: 'Shift rejected' });
      setRejectModalShift(null);
      setRejectReason('');
      loadPendingShifts();
      loadDashboard();
      // Refresh All Shifts view if it has data
      if (shiftsWeeks.length > 0) {
        loadShiftsByWeek(true);
      }
      // Close shift detail view if viewing the rejected shift
      if (viewingShift?.id === shiftId) {
        setViewingShift(null);
      }
    } catch (err) {
      console.error('Failed to reject shift:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to reject shift' });
    }
  };

  // Batch approve shifts
  const handleBatchApprove = async () => {
    if (selectedPendingShifts.size === 0) return;
    try {
      const result = await adminAPI.batchApproveShifts(Array.from(selectedPendingShifts));
      setAdminToast({ type: 'success', message: `Approved ${result.approved.length} shifts` });
      setSelectedPendingShifts(new Set());
      loadPendingShifts();
      loadDashboard();
    } catch (err) {
      console.error('Failed to batch approve:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to batch approve' });
    }
  };

  // Quick status change from dropdown
  const handleQuickStatusChange = async (shiftId, newStatus, currentStatus) => {
    setStatusDropdownShiftId(null);
    try {
      if (newStatus === 'paid') {
        await adminAPI.markShiftPaid(shiftId);
        setAdminToast({ type: 'success', message: 'Shift marked as paid' });
      } else if (newStatus === 'approved' && currentStatus === 'paid') {
        // Revert paid to approved - use updateShift
        await adminAPI.updateShift(shiftId, { status: 'approved' });
        setAdminToast({ type: 'success', message: 'Shift reverted to approved' });
      } else if (newStatus === 'approved') {
        await adminAPI.approveShift(shiftId);
        setAdminToast({ type: 'success', message: 'Shift approved' });
      }
      loadShiftsByWeek(true);
    } catch (err) {
      console.error('Failed to change status:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to change status' });
    }
  };

  // Quick delete from status dropdown
  const handleQuickDelete = (shiftId) => {
    setStatusDropdownShiftId(null);
    setDeleteConfirm({ type: 'shift', id: shiftId });
  };

  // Batch mark paid for All Shifts view
  const handleBatchMarkPaid = async () => {
    if (selectedShiftIds.size === 0) return;
    try {
      const result = await adminAPI.batchMarkPaid(Array.from(selectedShiftIds));
      setAdminToast({ type: 'success', message: `Marked ${result.updated?.length || selectedShiftIds.size} shifts as paid` });
      setSelectedShiftIds(new Set());
      setShiftsSelectMode(false);
      setBatchActionDropdown(false);
      loadShiftsByWeek(true);
    } catch (err) {
      console.error('Failed to batch mark paid:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to mark shifts as paid' });
    }
  };

  // Batch delete shifts
  const handleBatchDeleteShifts = async () => {
    if (selectedShiftIds.size === 0) return;
    try {
      for (const shiftId of selectedShiftIds) {
        await adminAPI.deleteShift(shiftId);
      }
      setAdminToast({ type: 'success', message: `Deleted ${selectedShiftIds.size} shifts` });
      setSelectedShiftIds(new Set());
      setShiftsSelectMode(false);
      setShowBatchDeleteConfirm(false);
      setBatchActionDropdown(false);
      loadShiftsByWeek(true);
    } catch (err) {
      console.error('Failed to batch delete:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to delete shifts' });
    }
  };

  // Toggle shift selection
  const toggleShiftSelection = (shiftId) => {
    setSelectedShiftIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shiftId)) {
        newSet.delete(shiftId);
      } else {
        newSet.add(shiftId);
      }
      return newSet;
    });
  };

  // Select all visible shifts
  const selectAllVisibleShifts = () => {
    const allIds = new Set();
    shiftsWeeks.forEach(week => {
      const filteredShifts = shiftsStatusFilter
        ? (week.shifts || []).filter(s => s.status === shiftsStatusFilter)
        : (week.shifts || []);
      filteredShifts.forEach(s => allIds.add(s.id));
    });
    setSelectedShiftIds(allIds);
  };

  // Load notifications for employees
  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getNotifications({ limit: 10, includeRead: 'true' });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Mark notification as read
  const handleMarkNotificationRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const loadDbTables = async () => {
    setTableLoading(true);
    try {
      const data = await adminAPI.getTables();
      setDbTables(data.tables);
    } catch (err) {
      console.error('Failed to load tables:', err);
      setAdminToast({ type: 'error', message: 'Failed to load database tables' });
    } finally {
      setTableLoading(false);
    }
  };

  const loadTableData = async (tableName, page = 1) => {
    setTableLoading(true);
    try {
      const data = await adminAPI.getTableData(tableName, { page, limit: 25 });
      setTableData(data);
      setSelectedTable(tableName);
    } catch (err) {
      console.error('Failed to load table data:', err);
      setAdminToast({ type: 'error', message: 'Failed to load table data' });
    } finally {
      setTableLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await adminAPI.updateUser(userId, updates);
      setAdminToast({ type: 'success', message: 'User updated successfully' });
      setEditingUser(null);
      loadAdminUsers(adminUsersPagination.page);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to update user' });
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserData.email || !newUserData.password || !newUserData.name) {
        setAdminToast({ type: 'error', message: 'Email, password, and name are required' });
        return;
      }
      if (newUserData.password.length < 6) {
        setAdminToast({ type: 'error', message: 'Password must be at least 6 characters' });
        return;
      }
      await adminAPI.createUser(newUserData);
      setAdminToast({ type: 'success', message: 'User created successfully' });
      setCreatingUser(false);
      setNewUserData({ email: '', password: '', name: '', role: 'user', status: 'active' });
      loadAdminUsers(1);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to create user' });
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await adminAPI.deactivateUser(userId);
      setAdminToast({ type: 'success', message: 'User deactivated' });
      setDeleteConfirm(null);
      setDeleteConfirmText('');
      loadAdminUsers(adminUsersPagination.page);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to deactivate user' });
    }
  };

  const handleCreateShift = async () => {
    if (!newShiftData.userId) {
      setAdminToast({ type: 'error', message: 'Please select a user' });
      return;
    }
    if (!newShiftData.date || !newShiftData.clockInTime) {
      setAdminToast({ type: 'error', message: 'Date and clock in time are required' });
      return;
    }
    if (newShiftData.timeBlocks.length === 0) {
      setAdminToast({ type: 'error', message: 'Please add at least one time block' });
      return;
    }

    setSavingShift(true);
    try {
      // Calculate total hours from time blocks
      let totalMinutes = 0;
      for (const block of newShiftData.timeBlocks) {
        if (block.startTime && block.endTime && !block.isBreak) {
          const [startH, startM] = block.startTime.split(':').map(Number);
          const [endH, endM] = block.endTime.split(':').map(Number);
          let mins = (endH * 60 + endM) - (startH * 60 + startM);
          if (mins < 0) mins += 24 * 60; // overnight
          totalMinutes += mins;
        }
      }
      // Round to nearest 0.25 (15 minutes)
      const totalHours = formatHours(totalMinutes / 60);

      await adminAPI.createShift({
        userId: parseInt(newShiftData.userId),
        date: newShiftData.date,
        clockInTime: localTimeToUTC(newShiftData.clockInTime, newShiftData.date),
        clockOutTime: localTimeToUTC(newShiftData.clockOutTime, newShiftData.date),
        totalHours: parseFloat(totalHours),
        timeBlocks: newShiftData.timeBlocks.map(b => ({
          startTime: localTimeToUTC(b.startTime, newShiftData.date),
          endTime: localTimeToUTC(b.endTime, newShiftData.date),
          tasks: b.tasks,
          isBreak: b.isBreak
        }))
      });

      setAdminToast({ type: 'success', message: 'Shift created successfully' });
      setCreatingShift(false);
      setNewShiftData({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        clockInTime: '08:00',
        clockOutTime: '17:00',
        timeBlocks: [{ id: Date.now(), startTime: '08:00', endTime: '17:00', tasks: '', isBreak: false }]
      });
      loadAdminShifts(1);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to create shift' });
    } finally {
      setSavingShift(false);
    }
  };

  const addNewShiftBlock = () => {
    const lastBlock = newShiftData.timeBlocks[newShiftData.timeBlocks.length - 1];
    const newStartTime = lastBlock?.endTime || '08:00';
    setNewShiftData({
      ...newShiftData,
      timeBlocks: [
        ...newShiftData.timeBlocks,
        { id: Date.now(), startTime: newStartTime, endTime: '', tasks: '', isBreak: false }
      ]
    });
  };

  const updateNewShiftBlock = (blockId, field, value) => {
    setNewShiftData({
      ...newShiftData,
      timeBlocks: newShiftData.timeBlocks.map(b =>
        b.id === blockId ? { ...b, [field]: value } : b
      )
    });
  };

  const removeNewShiftBlock = (blockId) => {
    if (newShiftData.timeBlocks.length <= 1) return;
    setNewShiftData({
      ...newShiftData,
      timeBlocks: newShiftData.timeBlocks.filter(b => b.id !== blockId)
    });
  };

  const viewShiftDetails = async (shiftId) => {
    try {
      setViewingShiftLoading(true);
      const shift = await adminAPI.getShift(shiftId);
      setViewingShift(shift);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to load shift details' });
    } finally {
      setViewingShiftLoading(false);
    }
  };

  const handleUpdateShift = async (shiftId, updates) => {
    try {
      await adminAPI.updateShift(shiftId, updates);
      setAdminToast({ type: 'success', message: 'Shift updated successfully' });
      setEditingShift(null);
      loadAdminShifts(adminShiftsPagination.page);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to update shift' });
    }
  };

  // Employee updating their own shift (pending_approval or rejected)
  const handleEmployeeUpdateShift = async () => {
    if (!employeeEditingShift) return;
    try {
      await shiftsAPI.update(employeeEditingShift.id, {
        date: employeeEditingShift.date,
        clockInTime: employeeEditingShift.clockInTime,
        clockOutTime: employeeEditingShift.clockOutTime,
        totalHours: employeeEditingShift.totalHours,
        timeBlocks: employeeEditingShift.timeBlocks || []
      });
      setEmployeeEditingShift(null);
      // Reload shifts and pay weeks
      const updatedShifts = await shiftsAPI.getAll();
      setShifts(updatedShifts);
      // Refresh pay weeks if on history tab
      if (activeTab === 'history') {
        setMyPayWeeksOffset(0);
        loadMyPayWeeks(true);
      }
      alert('Shift updated and resubmitted for approval');
    } catch (err) {
      alert(err.message || 'Failed to update shift');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await adminAPI.deleteShift(shiftId);
      setAdminToast({ type: 'success', message: 'Shift deleted' });
      setDeleteConfirm(null);
      setDeleteConfirmText('');
      loadAdminShifts(adminShiftsPagination.page);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to delete shift' });
    }
  };

  const handleUpdateRow = async (tableName, rowId, updates) => {
    try {
      await adminAPI.updateTableRow(tableName, rowId, updates);
      setAdminToast({ type: 'success', message: 'Row updated successfully' });
      setEditingRow(null);
      loadTableData(tableName, tableData.pagination.page);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to update row' });
    }
  };

  const handleDeleteRow = async (tableName, rowId) => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await adminAPI.deleteTableRow(tableName, rowId);
      setAdminToast({ type: 'success', message: 'Row deleted' });
      setDeleteConfirm(null);
      setDeleteConfirmText('');
      loadTableData(tableName, tableData.pagination.page);
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to delete row' });
    }
  };

  const handleExport = async (type) => {
    try {
      await adminAPI.downloadExport({ type, ...adminShiftsFilters });
      setAdminToast({ type: 'success', message: 'Export downloaded' });
    } catch (err) {
      setAdminToast({ type: 'error', message: 'Export failed' });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // Get actual current time (no offset)
  const getActualTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get start time for "Now" - uses previous block's end time if available
  const getStartTime = () => {
    // If there are completed blocks, continue from last one's end time
    if (completedBlocks.length > 0) {
      const lastBlock = completedBlocks[completedBlocks.length - 1];
      if (lastBlock.endTime) {
        return lastBlock.endTime;
      }
    }
    // Otherwise use actual current time
    return getActualTime();
  };

  const addMinutesToTime = (time, minutesToAdd) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const calculateBlockHours = (startTime, endTime) => {
    if (!startTime || !endTime) return null;

    // Normalize time strings (handle HH:MM:SS and HH:MM formats)
    const normalizeTime = (t) => {
      if (typeof t !== 'string') return t;
      // Take only HH:MM part
      return t.split(':').slice(0, 2).join(':');
    };

    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);

    const startDate = new Date(`2000-01-01T${start}:00`);
    let endDate = new Date(`2000-01-01T${end}:00`);

    // Handle midnight crossing (e.g., 22:00 to 00:00)
    if (endDate <= startDate) {
      endDate = new Date(`2000-01-02T${end}:00`);
    }

    const diffMs = endDate - startDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    // Round to nearest 0.25 (15 minutes)
    const roundedHours = Math.round(diffHours * 4) / 4;
    return roundedHours > 0 ? roundedHours.toFixed(2) : '0.00';
  };

  // Format hours to always show 15-minute increments (0.00, 0.25, 0.50, 0.75)
  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0.00';
    const num = parseFloat(hours);
    // Round to nearest 0.25
    const rounded = Math.round(num * 4) / 4;
    return rounded.toFixed(2);
  };

  const handleClockIn = () => {
    // Don't create shift on server yet - wait until first block is saved
    // Just create local block for user to fill in
    const newBlock = {
      id: Date.now(),
      startTime: '', // User will select their start time
      endTime: '',
      tasks: ''
    };
    setCurrentBlock(newBlock);
    setCurrentTasks(['']);
  };

  // Cancel shift and delete all time blocks
  const handleCancelShift = async () => {
    try {
      if (pendingShiftId) {
        await shiftsAPI.discard(pendingShiftId);
      }
      // Clear all local state
      setCurrentBlock(null);
      setCompletedBlocks([]);
      setCurrentTasks(['']);
      setPendingShiftId(null);
      setEditingBlock(null);
      setEditingBlockOriginal(null);
      setEditingTasks(['']);
      setPendingPreset(null);
      setPresetDetail('');
      setAutoSaveStatus('idle');
      setShowCancelShiftConfirm(false);
      setToast({ type: 'info', message: 'Shift cancelled' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to cancel shift:', err);
      alert('Failed to cancel shift: ' + err.message);
      setShowCancelShiftConfirm(false);
    }
  };

  // Join tasks array into a string, filtering empty entries
  const joinTasks = (tasksArray) => {
    return tasksArray.filter(t => t.trim()).join(' • ');
  };

  const handleAdvanceBlock = async () => {
    if (!currentBlock || !currentBlock.startTime || !currentBlock.endTime) {
      if (!currentBlock?.startTime) {
        setToast({ type: 'error', message: 'Please select a start time' });
        setTimeout(() => setToast(null), 3000);
      }
      return;
    }

    // Validate: start and end time cannot be the same
    if (currentBlock.startTime === currentBlock.endTime) {
      setToast({ type: 'error', message: 'Start and end time cannot be the same' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Validate: block cannot be longer than 2 hours
    const blockHours = calculateBlockHours(currentBlock.startTime, currentBlock.endTime);
    if (blockHours > 2) {
      setToast({ type: 'error', message: 'Time block cannot be longer than 2 hours' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Join tasks before completing
    const completedBlock = {
      ...currentBlock,
      tasks: joinTasks(currentTasks)
    };

    // Trigger swipe animation
    setSwipingBlockId(currentBlock.id);

    // Optimistic update - move to completed as swipe-out finishes
    setTimeout(() => {
      // Track which block should animate in
      setNewlyAddedBlockId(completedBlock.id);
      setTimeout(() => setNewlyAddedBlockId(null), 300);

      // Move current block to completed immediately (optimistic)
      setCompletedBlocks(prev => [...prev, completedBlock]);

      // Create new current block with previous end time as start
      const newBlock = {
        id: Date.now(),
        startTime: currentBlock.endTime,
        endTime: '',
        tasks: ''
      };
      setCurrentBlock(newBlock);
      setCurrentTasks(['']);
      setSwipingBlockId(null);
      setEditingBlock(null);
      setEditingBlockOriginal(null);
    }, 150); // Start slightly before swipe-out finishes for overlap

    // Save to server in background (non-blocking)
    (async () => {
      try {
        setAutoSaveStatus('saving');

        // Create shift on server if this is the first block
        let shiftId = pendingShiftId;
        if (!shiftId) {
          const shift = await shiftsAPI.clockIn(currentDate, localTimeToUTC(completedBlock.startTime, currentDate));
          shiftId = shift.id;
          setPendingShiftId(shiftId);
        }

        // Save block to server
        const savedBlock = await shiftsAPI.addBlock(shiftId, {
          startTime: localTimeToUTC(completedBlock.startTime, currentDate),
          endTime: localTimeToUTC(completedBlock.endTime, currentDate),
          tasks: completedBlock.tasks,
          isBreak: completedBlock.isBreak || false
        });

        // Update local block with server ID
        setCompletedBlocks(prev => prev.map(b =>
          b.id === completedBlock.id ? { ...b, serverId: savedBlock.id } : b
        ));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to save block:', err);
        // Revert optimistic update on failure
        setCompletedBlocks(prev => prev.filter(b => b.id !== completedBlock.id));
        // Restore the current block
        setCurrentBlock(completedBlock);
        setCurrentTasks(completedBlock.tasks ? completedBlock.tasks.split(' • ') : ['']);
        setToast({ type: 'error', message: 'Failed to save block. Please try again.' });
        setTimeout(() => setToast(null), 4000);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    })();
  };

  const handleBreak = () => {
    if (!currentBlock) return;

    // Clear any existing toast
    setToast(null);

    // Break starts where last completed block ended, or at current block start time
    let breakStartTime;
    if (completedBlocks.length > 0) {
      breakStartTime = completedBlocks[completedBlocks.length - 1].endTime;
    } else {
      breakStartTime = currentBlock.startTime;
    }

    if (!breakStartTime) return; // Need a start time

    const breakEndTime = addMinutesToTime(breakStartTime, 15);

    // Store current block content to restore after break
    const savedTasks = [...currentTasks];
    const savedBlockContent = { ...currentBlock };

    // Calculate how long the current block was (if it has start/end times)
    let blockDuration = 0;
    if (savedBlockContent.startTime && savedBlockContent.endTime) {
      const startMins = timeToMinutes(savedBlockContent.startTime);
      const endMins = timeToMinutes(savedBlockContent.endTime);
      blockDuration = endMins - startMins;
    }

    // Create break block
    const breakBlock = {
      id: Date.now(),
      startTime: breakStartTime,
      endTime: breakEndTime,
      tasks: '15 min Break',
      isBreak: true
    };

    // First, show the break block in current block area, then animate it
    setCurrentBlock(breakBlock);
    setCurrentTasks(['15 min Break']);

    // Small delay to ensure the break block renders before animation starts
    requestAnimationFrame(() => {
      // Trigger swipe animation on the break block
      setSwipingBlockId(breakBlock.id);

      // Optimistic update - move break to completed
      setTimeout(() => {
        // Track which block should animate in
        setNewlyAddedBlockId(breakBlock.id);
        setTimeout(() => setNewlyAddedBlockId(null), 300);

        // Only add the break block (NOT the work block)
        setCompletedBlocks(prev => [...prev, breakBlock]);

        // Restore current block content with shifted times
        // New start time is after the break
        const newStartTime = breakEndTime;
        // If there was a duration, preserve it; otherwise leave end time empty
        const newEndTime = blockDuration > 0 ? addMinutesToTime(newStartTime, blockDuration) : '';

        setCurrentBlock({
          ...savedBlockContent,
          id: Date.now() + 1,
          startTime: newStartTime,
          endTime: newEndTime
        });
        setCurrentTasks(savedTasks);
        setSwipingBlockId(null);
      }, 150);
    });

    // Save break to server in background (non-blocking)
    (async () => {
      try {
        setAutoSaveStatus('saving');
        let shiftId = pendingShiftId;

        // Create shift on server if this is the first block
        if (!shiftId) {
          const shift = await shiftsAPI.clockIn(currentDate, localTimeToUTC(breakStartTime, currentDate));
          shiftId = shift.id;
          setPendingShiftId(shiftId);
        }

        // Only save break block (work block stays in current block for user to submit later)
        const savedBreak = await shiftsAPI.addBlock(shiftId, {
          startTime: localTimeToUTC(breakBlock.startTime, currentDate),
          endTime: localTimeToUTC(breakBlock.endTime, currentDate),
          tasks: breakBlock.tasks,
          isBreak: true
        });
        setCompletedBlocks(prev => prev.map(b =>
          b.id === breakBlock.id ? { ...b, serverId: savedBreak.id } : b
        ));

        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to save break:', err);
        // Revert optimistic update on failure
        setCompletedBlocks(prev => prev.filter(b => b.id !== breakBlock.id));
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    })();
  };

  // Helper to check if end time is valid for a given start time
  const isEndTimeValidForStart = (startTime, endTime) => {
    if (!startTime || !endTime) return true; // No validation needed if either is empty
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60; // Handle overnight
    const diff = endMins - startMins;
    return diff >= 15 && diff <= 120; // Valid if 15 mins to 2 hours
  };

  // Check if there are gaps between completed blocks
  const hasGaps = () => {
    // If there's a gap widget placeholder, there's an unfilled gap
    if (completedBlocks.some(b => b.isGapWidgetPlaceholder)) {
      return true;
    }
    if (completedBlocks.length < 2) return false;
    for (let i = 0; i < completedBlocks.length - 1; i++) {
      const currentEnd = completedBlocks[i].endTime;
      const nextStart = completedBlocks[i + 1].startTime;
      if (currentEnd !== nextStart) {
        return true;
      }
    }
    return false;
  };

  // Handle keyboard shortcuts for hour dropdowns
  // If user presses a digit, auto-select matching hour if unambiguous
  const handleHourKeyDown = (e, availableHours, onSelect) => {
    const key = e.key;
    if (!/^[0-9]$/.test(key)) return; // Only handle digit keys

    // Always prevent default to stop browser's native type-ahead
    e.preventDefault();
    e.stopPropagation();

    const digit = key;

    // Find hours that match this digit
    const exactMatch = availableHours.find(h => String(h) === digit);
    const startsWithMatch = availableHours.filter(h => String(h).startsWith(digit));

    let selectedValue = null;
    if (exactMatch) {
      // Exact single-digit match (e.g., pressing "4" selects 4)
      selectedValue = exactMatch;
    } else if (startsWithMatch.length === 1) {
      // No exact match but only one option starts with this digit (e.g., pressing "1" when only 10 is available)
      selectedValue = startsWithMatch[0];
    }
    // If multiple 2-digit options start with the digit (e.g., 10, 11, 12), do nothing

    if (selectedValue !== null) {
      onSelect(selectedValue);
      // Blur to close the dropdown
      e.target.blur();
    }
  };

  const updateCurrentBlock = (field, value) => {
    if (field === 'startTime' && currentBlock?.endTime) {
      // If changing start time, check if end time is still valid
      if (!isEndTimeValidForStart(value, currentBlock.endTime)) {
        // Clear end time if it's now invalid
        setCurrentBlock({ ...currentBlock, startTime: value, endTime: '' });
        return;
      }
    }
    setCurrentBlock({ ...currentBlock, [field]: value });
  };

  const updateEditingBlock = (field, value) => {
    if (field === 'startTime' && editingBlock?.endTime) {
      // If changing start time, check if end time is still valid
      if (!isEndTimeValidForStart(value, editingBlock.endTime)) {
        // Clear end time if it's now invalid
        setEditingBlock({ ...editingBlock, startTime: value, endTime: '' });
        return;
      }
    }
    setEditingBlock({ ...editingBlock, [field]: value });
  };

  // Update gap data with validation (same 2-hour max rule)
  // Times cannot be cleared - they must stay within the gap boundaries
  const updateGapData = (field, value) => {
    if (!gapData) return;

    // Don't allow clearing times - they must always have a value
    if (!value) return;

    if (field === 'startTime' && gapData.endTime) {
      // If changing start time, check if end time is still valid
      if (!isEndTimeValidForStart(value, gapData.endTime)) {
        // Don't allow - would make end time invalid
        return;
      }
    }
    if (field === 'endTime' && gapData.startTime) {
      // If changing end time, validate against start time
      if (!isEndTimeValidForStart(gapData.startTime, value)) {
        // Don't allow invalid end time
        return;
      }
    }
    setGapData({ ...gapData, [field]: value });
  };

  const handleEditBlock = (block) => {
    // Track original position before removing
    const originalIndex = completedBlocks.findIndex(b => b.id === block.id);
    setEditingOriginalIndex(originalIndex);

    // Store original block state for cancel (deep copy)
    setEditingBlockOriginal({ ...block });

    // Start slide-out animation
    setSlidingOutBlockId(block.id);

    // After animation completes, set up editing state
    setTimeout(() => {
      setSlidingOutBlockId(null);
      // Save current block state and edit the selected block
      setEditingBlock(block);
      // Split existing tasks string into array for editing (skip for breaks)
      const tasksArray = block.isBreak ? [''] : (block.tasks ? block.tasks.split(' • ') : ['']);
      setEditingTasks(tasksArray.length > 0 ? tasksArray : ['']);
      // Replace with placeholder instead of removing (keeps position and numbering stable)
      setCompletedBlocks(prev => prev.map(b =>
        b.id === block.id ? { ...b, isEditingPlaceholder: true } : b
      ));
    }, 250); // Match animation duration
  };

  // Helper to compare times accounting for overnight shifts
  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Process blocks after edit - handle overlaps and gaps
  const processBlocksAfterEdit = (blocks, savedBlock, insertIndex) => {
    let updatedBlocks = [...blocks];
    updatedBlocks.splice(insertIndex, 0, savedBlock);

    const editedEndMinutes = timeToMinutes(savedBlock.endTime);

    // Check if there's a next block
    if (insertIndex + 1 < updatedBlocks.length) {
      const nextBlock = updatedBlocks[insertIndex + 1];
      const nextStartMinutes = timeToMinutes(nextBlock.startTime);

      // Handle overlaps
      if (editedEndMinutes > nextStartMinutes) {
        // Complete overlap - remove blocks
        let i = insertIndex + 1;
        while (i < updatedBlocks.length) {
          const block = updatedBlocks[i];
          const blockStartMinutes = timeToMinutes(block.startTime);
          const blockEndMinutes = timeToMinutes(block.endTime);

          if (editedEndMinutes >= blockEndMinutes) {
            updatedBlocks.splice(i, 1);
          } else if (editedEndMinutes > blockStartMinutes) {
            updatedBlocks[i] = { ...block, startTime: savedBlock.endTime };
            i++;
          } else {
            break;
          }
        }
        return { blocks: updatedBlocks, gap: null };
      }

      // Handle gap - edited end time is BEFORE next block's start
      if (editedEndMinutes < nextStartMinutes) {
        return {
          blocks: updatedBlocks,
          gap: {
            startTime: savedBlock.endTime,
            endTime: nextBlock.startTime,
            gapBoundaryStart: savedBlock.endTime,
            gapBoundaryEnd: nextBlock.startTime,
            gapIndex: insertIndex + 1
          }
        };
      }
    }

    return { blocks: updatedBlocks, gap: null };
  };

  const handleSaveEdit = () => {
    if (!editingBlock) return;

    // Remove placeholder and get clean blocks array
    const blocksWithoutPlaceholder = completedBlocks.filter(b => !b.isEditingPlaceholder);

    // Save original blocks in case we need to restore on gap cancel
    // Include the editing block at its original position
    const originalBlocks = [...blocksWithoutPlaceholder];
    originalBlocks.splice(editingOriginalIndex, 0, editingBlock);
    setBlocksBeforeEdit(originalBlocks);

    // Join tasks before saving (keep original for breaks)
    const savedBlock = {
      ...editingBlock,
      tasks: editingBlock.isBreak ? editingBlock.tasks : joinTasks(editingTasks)
    };

    // Swipe the edited block back to completed
    setSwipingBlockId(editingBlock.id);

    setTimeout(() => {
      const insertIndex = Math.min(editingOriginalIndex, blocksWithoutPlaceholder.length);
      const result = processBlocksAfterEdit(blocksWithoutPlaceholder, savedBlock, insertIndex);

      if (result.gap) {
        // Track which block should animate in (the edited block returning)
        setNewlyAddedBlockId(savedBlock.id);
        setTimeout(() => setNewlyAddedBlockId(null), 300);

        // Create a gap widget placeholder and insert it at the gap position
        const gapPlaceholder = {
          id: `gap-${Date.now()}`,
          isGapWidgetPlaceholder: true,
          gapStartTime: result.gap.startTime,
          gapEndTime: result.gap.endTime
        };

        // Insert the gap placeholder at the gap index
        const blocksWithGap = [...result.blocks];
        blocksWithGap.splice(result.gap.gapIndex, 0, gapPlaceholder);

        setCompletedBlocks(blocksWithGap);
        setDeleteGapSource('edit');

        // Prepare gap data for the + button
        setGapData({
          ...result.gap,
          pendingBlocks: result.blocks, // Blocks without the placeholder
          placeholderId: gapPlaceholder.id
        });
        setGapTasks(['']);
        setGapIsBreak(false);
      } else {
        // Track which block should animate in (the edited block returning)
        setNewlyAddedBlockId(savedBlock.id);
        setTimeout(() => setNewlyAddedBlockId(null), 300);

        setCompletedBlocks(result.blocks);

        // Check if this edit filled an existing gap
        checkAndClearGapIfFilled(result.blocks);

        // Only clear blocksBeforeEdit if no gap remains
        if (!gapData) {
          setBlocksBeforeEdit(null);
        }

        // If the edited block is the last block and there's a current block,
        // update the current block's start time to match the edited block's end time
        const lastBlock = result.blocks[result.blocks.length - 1];
        if (currentBlock && lastBlock && lastBlock.id === savedBlock.id && savedBlock.endTime) {
          setCurrentBlock(prev => ({ ...prev, startTime: savedBlock.endTime }));
        }
      }

      setEditingBlock(null);
      setEditingBlockOriginal(null);
      setEditingTasks(['']);
      setEditingOriginalIndex(null);
      setSwipingBlockId(null);
    }, 400);
  };

  // Handle filling a gap
  const handleFillGap = () => {
    if (!gapData) return;

    // Safety validation - ensure times are valid (15 min to 2 hours)
    if (!gapData.startTime || !gapData.endTime) return;
    if (!isEndTimeValidForStart(gapData.startTime, gapData.endTime)) {
      // Block is invalid (>2hrs or <15min) - don't allow
      return;
    }

    // Calculate break duration for task label
    const breakDuration = gapIsBreak ? calculateBlockHours(gapData.startTime, gapData.endTime) : null;
    const breakTaskLabel = breakDuration ? `${Math.round(parseFloat(breakDuration) * 60)} min Break` : 'Break';

    const gapBlock = {
      id: Date.now(),
      startTime: gapData.startTime,
      endTime: gapData.endTime,
      tasks: gapIsBreak ? breakTaskLabel : joinTasks(gapTasks),
      isBreak: gapIsBreak
    };

    // Insert the gap block
    let updatedBlocks = [...gapData.pendingBlocks];
    updatedBlocks.splice(gapData.gapIndex, 0, gapBlock);

    // Check if this creates another gap or overlap
    const gapEndMinutes = timeToMinutes(gapBlock.endTime);
    const nextIndex = gapData.gapIndex + 1;

    if (nextIndex < updatedBlocks.length) {
      const nextBlock = updatedBlocks[nextIndex];
      const nextStartMinutes = timeToMinutes(nextBlock.startTime);

      // Still a gap?
      if (gapEndMinutes < nextStartMinutes) {
        // Track which block should animate in
        setNewlyAddedBlockId(gapBlock.id);
        setTimeout(() => setNewlyAddedBlockId(null), 300);

        // Update blocks and close modal, but keep gap data for the widget
        setCompletedBlocks(updatedBlocks);
        setShowGapModal(false);
        setGapTasks(['']);
        setGapIsBreak(false);

        // Update gap data with new boundaries (for the + button widget)
        setGapData({
          startTime: gapBlock.endTime,
          endTime: nextBlock.startTime,
          gapBoundaryStart: gapBlock.endTime,
          gapBoundaryEnd: nextBlock.startTime,
          pendingBlocks: updatedBlocks,
          gapIndex: nextIndex
        });
        setGapAnimatingIndex(nextIndex);
        return;
      }

      // Overlap? Adjust next block
      if (gapEndMinutes > nextStartMinutes) {
        updatedBlocks[nextIndex] = { ...nextBlock, startTime: gapBlock.endTime };
      }
    }

    // Track which block should animate in
    setNewlyAddedBlockId(gapBlock.id);
    setTimeout(() => setNewlyAddedBlockId(null), 300); // Clear after animation

    setCompletedBlocks(updatedBlocks);
    setShowGapModal(false);
    setGapData(null);
    setGapTasks(['']);
        setGapIsBreak(false);
    setBlocksBeforeEdit(null);
    setGapAnimatingIndex(null);
    setDeleteGapSource(null);
  };

  // Close gap modal without filling - gap remains visible with + button
  const handleCloseGapModal = () => {
    setShowGapModal(false);

    // Check if gap placeholder still exists in completedBlocks
    const hasGapPlaceholder = completedBlocks.some(b => b.isGapWidgetPlaceholder);
    const gapStillValid = hasGapPlaceholder && gapData?.gapBoundaryStart && gapData?.gapBoundaryEnd;

    if (gapStillValid && gapData) {
      // Reset times to original boundaries so the gap display stays correct
      setGapData({
        ...gapData,
        startTime: gapData.gapBoundaryStart,
        endTime: gapData.gapBoundaryEnd
      });
      setGapTasks(['']);
      setGapIsBreak(false);
    } else {
      // Gap is no longer valid, clear everything
      setGapData(null);
      setGapTasks(['']);
      setGapIsBreak(false);
      setGapAnimatingIndex(null);
      setBlocksBeforeEdit(null);
      setDeleteGapSource(null);
    }
  };

  // Undo and restore blocks to state before the edit/delete
  const handleUndoGapAction = () => {
    if (blocksBeforeEdit) {
      setCompletedBlocks(blocksBeforeEdit);
    }
    setShowGapModal(false);
    setGapData(null);
    setGapTasks(['']);
        setGapIsBreak(false);
    setBlocksBeforeEdit(null);
    setGapAnimatingIndex(null);
    setDeleteGapSource(null);
  };

  // Check if gap is filled after edits to surrounding blocks
  const checkAndClearGapIfFilled = (blocks) => {
    if (!gapData || !gapAnimatingIndex) return;

    // Gap is invalid if index is out of bounds
    if (gapAnimatingIndex <= 0 || gapAnimatingIndex >= blocks.length) {
      setGapAnimatingIndex(null);
      setGapData(null);
      setBlocksBeforeEdit(null);
      setDeleteGapSource(null);
      return;
    }

    const prevBlock = blocks[gapAnimatingIndex - 1];
    const nextBlock = blocks[gapAnimatingIndex];

    if (prevBlock && nextBlock) {
      const prevEndMinutes = timeToMinutes(prevBlock.endTime);
      const nextStartMinutes = timeToMinutes(nextBlock.startTime);

      // Gap is filled if prev.endTime >= next.startTime
      if (prevEndMinutes >= nextStartMinutes) {
        // Animate gap closing
        setGapAnimatingIndex(null);
        setGapData(null);
        setBlocksBeforeEdit(null);
        setDeleteGapSource(null);
      }
    } else {
      // Missing blocks means gap is invalid
      setGapAnimatingIndex(null);
      setGapData(null);
      setBlocksBeforeEdit(null);
      setDeleteGapSource(null);
    }
  };

  // Handler for + button in gap
  const handleGapPlusClick = () => {
    if (gapData) {
      setShowGapModal(true);
    }
  };

  const handleCancelEdit = () => {
    if (!editingBlock || !editingBlockOriginal) {
      setEditingBlock(null);
      setEditingBlockOriginal(null);
      setEditingTasks(['']);
      setEditingOriginalIndex(null);
      return;
    }

    // Trigger swipe-out animation on editing block
    setSwipingBlockId(editingBlock.id);

    // After animation, restore the original block with swipe-in
    setTimeout(() => {
      // Replace placeholder with original block and trigger swipe-in animation
      const restoredBlock = { ...editingBlockOriginal };
      setCompletedBlocks(completedBlocks.map(b =>
        b.isEditingPlaceholder ? restoredBlock : b
      ));
      setNewlyAddedBlockId(restoredBlock.id);

      setEditingBlock(null);
      setEditingBlockOriginal(null);
      setEditingTasks(['']);
      setEditingOriginalIndex(null);
      setSwipingBlockId(null);

      // Clear the newly added animation after it completes
      setTimeout(() => setNewlyAddedBlockId(null), 300);
    }, 150);
  };

  const removeCompletedBlock = (id) => {
    const blockIndex = completedBlocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;

    const prevBlock = blockIndex > 0 ? completedBlocks[blockIndex - 1] : null;
    const nextBlock = blockIndex < completedBlocks.length - 1 ? completedBlocks[blockIndex + 1] : null;

    // Check if deletion creates a gap
    let createsGap = false;
    let gapStart = null;
    let gapEnd = null;
    let gapIndex = blockIndex;

    if (prevBlock && nextBlock) {
      // Block is in the middle - check if prev.endTime !== next.startTime
      const prevEndMinutes = timeToMinutes(prevBlock.endTime);
      const nextStartMinutes = timeToMinutes(nextBlock.startTime);
      if (prevEndMinutes < nextStartMinutes) {
        createsGap = true;
        gapStart = prevBlock.endTime;
        gapEnd = nextBlock.startTime;
      }
    }

    // Start delete animation
    setDeletingBlockId(id);

    // After animation, handle the deletion
    setTimeout(() => {
      setDeletingBlockId(null);

      if (createsGap) {
        // Store blocks before deletion for cancel restore
        setBlocksBeforeEdit([...completedBlocks]);
        setDeleteGapSource('delete');

        // Replace deleted block with a gap widget placeholder - no position changes for other blocks
        const blocksWithGapPlaceholder = completedBlocks.map(b =>
          b.id === id ? {
            ...b,
            isGapWidgetPlaceholder: true,
            gapStartTime: gapStart,
            gapEndTime: gapEnd
          } : b
        );
        setCompletedBlocks(blocksWithGapPlaceholder);

        // Set up gap data immediately (no separate gapAnimatingIndex needed)
        setGapData({
          startTime: gapStart,
          endTime: gapEnd,
          gapBoundaryStart: gapStart,
          gapBoundaryEnd: gapEnd,
          pendingBlocks: blocksWithGapPlaceholder.filter(b => !b.isGapWidgetPlaceholder),
          gapIndex: gapIndex,
          placeholderId: id  // Track which block is the placeholder
        });
        setGapTasks(['']);
        setGapIsBreak(false);
        // Don't set gapAnimatingIndex - we don't want margin animations
      } else {
        // Check if there's a gap widget placeholder in completedBlocks
        const gapPlaceholder = completedBlocks.find(b => b.isGapWidgetPlaceholder);
        const blocksAfterDelete = completedBlocks.filter(b => b.id !== id);

        if (gapPlaceholder) {
          // Check if we deleted the last block after the gap placeholder
          const placeholderIndex = blocksAfterDelete.findIndex(b => b.isGapWidgetPlaceholder);
          const hasBlocksAfterPlaceholder = placeholderIndex >= 0 && placeholderIndex < blocksAfterDelete.length - 1;

          if (!hasBlocksAfterPlaceholder) {
            // No more blocks after the gap - dismiss gap widget and clean up
            const blocksWithoutPlaceholder = blocksAfterDelete.filter(b => !b.isGapWidgetPlaceholder);
            setCompletedBlocks(blocksWithoutPlaceholder);

            // Update current block start time to end time of last remaining block
            if (blocksWithoutPlaceholder.length > 0) {
              const lastBlock = blocksWithoutPlaceholder[blocksWithoutPlaceholder.length - 1];
              setCurrentBlock(prev => ({ ...prev, startTime: lastBlock.endTime }));
            }

            // Clear all gap-related state
            setGapData(null);
            setGapTasks(['']);
            setGapIsBreak(false);
            setGapAnimatingIndex(null);
            setBlocksBeforeEdit(null);
            setDeleteGapSource(null);
            return;
          }
        }

        // No gap placeholder or still have blocks after it - just remove the block
        setCompletedBlocks(blocksAfterDelete);

        // Update current block start time based on remaining blocks
        const realBlocksForStart = blocksAfterDelete.filter(b => !b.isGapWidgetPlaceholder);
        if (realBlocksForStart.length > 0) {
          const lastRealBlock = realBlocksForStart[realBlocksForStart.length - 1];
          setCurrentBlock(prev => ({ ...prev, startTime: lastRealBlock.endTime }));
        } else {
          // No blocks remain - current block start time should be editable (reset to current time or empty)
          const now = new Date();
          const currentTime = formatTime(now);
          setCurrentBlock(prev => ({ ...prev, startTime: currentTime }));
        }

        // Check if existing gap is now invalid (user deleted blocks that defined the gap)
        if (gapData) {
          // If the deleted block was at or after the gap index, the gap end no longer exists
          // Or if there are no more blocks after the gap start, clear the gap
          const realBlocks = blocksAfterDelete.filter(b => !b.isGapWidgetPlaceholder);
          const gapStillValid = gapData.gapIndex < realBlocks.length &&
            realBlocks[gapData.gapIndex - 1] &&
            realBlocks[gapData.gapIndex];

          if (!gapStillValid) {
            setGapData(null);
            setGapTasks(['']);
            setGapIsBreak(false);
            setGapAnimatingIndex(null);
            setBlocksBeforeEdit(null);
            setDeleteGapSource(null);
          }
        }
      }
    }, 250); // Match slide-out animation duration
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword(passwordData.current, passwordData.new);
      setPasswordSuccess(true);
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordError('');
    setPasswordSuccess(false);
  };

  const handleChangeEmail = async () => {
    setEmailError('');

    if (!emailData.newEmail || !emailData.password) {
      setEmailError('Email and password are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.newEmail)) {
      setEmailError('Invalid email format');
      return;
    }

    setChangingEmail(true);
    try {
      const result = await authAPI.changeEmail(emailData.newEmail, emailData.password);
      // Update token in localStorage
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      setEmailSuccess(true);
      setEmailData({ newEmail: '', password: '' });
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(false);
        // Reload to update user info
        window.location.reload();
      }, 2000);
    } catch (err) {
      setEmailError(err.message || 'Failed to change email');
    } finally {
      setChangingEmail(false);
    }
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailData({ newEmail: '', password: '' });
    setEmailError('');
    setEmailSuccess(false);
  };

  const handleAdminResetPassword = async () => {
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      setAdminToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setResettingPassword(true);
    try {
      await adminAPI.resetUserPassword(resetPasswordUser.id, resetPasswordValue);
      setAdminToast({ type: 'success', message: `Password reset for ${resetPasswordUser.name}` });
      setResetPasswordUser(null);
      setResetPasswordValue('');
    } catch (err) {
      setAdminToast({ type: 'error', message: err.message || 'Failed to reset password' });
    } finally {
      setResettingPassword(false);
    }
  };

  const closeResetPasswordModal = () => {
    setResetPasswordUser(null);
    setResetPasswordValue('');
  };

  const clientTasks = [
    'Fixed responsive layout issues on mobile',
    'Implemented form validation for user inputs',
    'Added loading spinners and skeleton screens',
    'Debugged API integration issues',
    'Optimized React component rendering',
    'Styled buttons and input components',
    'Created reusable modal component',
    'Fixed CSS grid alignment on dashboard',
    'Implemented state management for cart',
    'Added error handling for fetch requests',
    'Built date picker component',
    'Fixed cross-browser compatibility issues',
    'Implemented infinite scroll pagination',
    'Added toast notifications system',
    'Refactored authentication flow'
  ];

  const generateTestShift = () => {
    const blocks = [];
    let currentHour = 8;
    let currentMinute = 0;
    let breakCount = 0;
    const totalBlocks = testBlocks + testBreaks;
    const breakInterval = Math.floor(totalBlocks / (testBreaks + 1));

    for (let i = 0; i < totalBlocks; i++) {
      const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const isBreak = breakCount < testBreaks && (i + 1) % breakInterval === 0;
      const duration = isBreak ? 15 : (45 + Math.floor(Math.random() * 45));

      currentMinute += duration;
      while (currentMinute >= 60) {
        currentHour++;
        currentMinute -= 60;
      }

      const endTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      if (isBreak) {
        blocks.push({
          id: Date.now() + i,
          startTime,
          endTime,
          tasks: '15 min Break',
          isBreak: true
        });
        breakCount++;
      } else {
        blocks.push({
          id: Date.now() + i,
          startTime,
          endTime,
          tasks: clientTasks[Math.floor(Math.random() * clientTasks.length)]
        });
      }
    }

    // All but last go to completed, last becomes current
    if (blocks.length > 0) {
      setCompletedBlocks(blocks.slice(0, -1));
      const lastBlock = blocks[blocks.length - 1];
      setCurrentBlock({
        ...lastBlock,
        endTime: '', // Make it editable
      });
      // Set the tasks array from the last block
      setCurrentTasks(lastBlock.tasks ? [lastBlock.tasks] : ['']);
    }
    setEditingBlock(null);
    setEditingBlockOriginal(null);
    setEditingTasks(['']);
  };

  const clearAll = () => {
    setCompletedBlocks([]);
    setCurrentBlock(null);
    setCurrentTasks(['']);
    setEditingBlock(null);
    setEditingBlockOriginal(null);
    setEditingTasks(['']);
    setPendingShiftId(null);
    setAutoSaveStatus('idle');
  };

  const calculateTotalHours = () => {
    let total = 0;
    // Filter out placeholder blocks to avoid double-counting during editing
    [...completedBlocks, currentBlock].filter(Boolean).filter(block => !block.isEditingPlaceholder).forEach(block => {
      const hrs = calculateBlockHours(block.startTime, block.endTime);
      if (hrs) total += parseFloat(hrs);
    });
    return formatHours(total);
  };

  // Preview shift before saving - shows confirmation modal
  const previewShift = () => {
    const allBlocks = [...completedBlocks];
    // Include current block only if fully filled out (start time, end time, AND tasks)
    // This ignores placeholder blocks that only have a start time from "Next Block"
    const currentJoinedTasks = joinTasks(currentTasks);
    if (currentBlock && currentBlock.startTime && currentBlock.endTime && currentJoinedTasks) {
      allBlocks.push({ ...currentBlock, tasks: currentJoinedTasks });
    }

    const validBlocks = allBlocks.filter(block =>
      block.startTime && block.endTime && block.tasks && !block.isEditingPlaceholder
    );

    if (validBlocks.length === 0) {
      alert('Please add at least one complete time block (start time, end time, and tasks)');
      return;
    }

    // Don't sort - preserve the order user entered them (handles overnight shifts correctly)
    const clockInTime = validBlocks[0].startTime;
    const clockOutTime = validBlocks[validBlocks.length - 1].endTime || validBlocks[validBlocks.length - 1].startTime;
    const totalHours = calculateTotalHours();

    const shiftData = {
      date: currentDate,
      clockInTime,
      clockOutTime,
      totalHours,
      timeBlocks: validBlocks
    };

    setPreviewShiftData(shiftData);
    setShowPreviewModal(true);
  };

  // Actually save the shift after confirmation (Clock Out)
  const confirmSave = async () => {
    if (!previewShiftData) return;

    setSaving(true);
    try {
      let completedShift;

      if (pendingShiftId) {
        // Save any unsaved current block before clock out
        // The current block is included in previewShiftData.timeBlocks but may not have been saved yet
        const currentJoinedTasks = joinTasks(currentTasks);
        if (currentBlock && currentBlock.startTime && currentBlock.endTime && currentJoinedTasks) {
          // Check if this block was already saved (exists in completedBlocks)
          const alreadySaved = completedBlocks.some(b => b.id === currentBlock.id);
          if (!alreadySaved) {
            await shiftsAPI.addBlock(pendingShiftId, {
              startTime: localTimeToUTC(currentBlock.startTime, previewShiftData.date),
              endTime: localTimeToUTC(currentBlock.endTime, previewShiftData.date),
              tasks: currentJoinedTasks,
              isBreak: currentBlock.isBreak || false
            });
          }
        }

        // Complete the pending shift (clock out) - convert to UTC
        // Send both clockInTime (from first block) and clockOutTime (from last block)
        completedShift = await shiftsAPI.clockOut(
          pendingShiftId,
          localTimeToUTC(previewShiftData.clockInTime, previewShiftData.date),
          localTimeToUTC(previewShiftData.clockOutTime, previewShiftData.date),
          previewShiftData.totalHours
        );
      } else {
        // Fallback: create new shift (shouldn't happen with new flow)
        completedShift = await shiftsAPI.create(previewShiftData);
      }

      setShifts([completedShift, ...shifts]);

      // Show toast with preview
      setToast({
        message: 'Shift saved successfully!',
        shift: previewShiftData
      });
      setTimeout(() => setToast(null), 5000);

      setShowPreviewModal(false);
      setPreviewShiftData(null);
      clearAll();
    } catch (err) {
      alert('Failed to save shift: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelPreview = () => {
    setShowPreviewModal(false);
    setPreviewShiftData(null);
  };

  // Recovery modal handlers
  const handleResumeRecovery = () => {
    if (!recoveryShift) return;

    // Set the pending shift ID
    setPendingShiftId(recoveryShift.id);
    setCurrentDate(recoveryShift.date);

    // Load saved blocks into completed blocks
    const savedBlocks = recoveryShift.timeBlocks || [];
    setCompletedBlocks(savedBlocks.map(block => ({
      ...block,
      serverId: block.id
    })));

    // Create a new current block starting from last block's end time
    if (savedBlocks.length > 0) {
      const lastBlock = savedBlocks[savedBlocks.length - 1];
      setCurrentBlock({
        id: Date.now(),
        startTime: lastBlock.endTime || lastBlock.startTime,
        endTime: '',
        tasks: ''
      });
    } else {
      setCurrentBlock({
        id: Date.now(),
        startTime: recoveryShift.clockInTime || '', // User must select time if not set
        endTime: '',
        tasks: ''
      });
    }
    setCurrentTasks(['']);
    setShowRecoveryModal(false);
    setRecoveryShift(null);
  };

  const handleDiscardRecovery = () => {
    // Show confirmation before discarding
    setShowDiscardConfirm(true);
  };

  const confirmDiscardRecovery = async () => {
    if (!recoveryShift) return;

    try {
      await shiftsAPI.discard(recoveryShift.id);
      setShowRecoveryModal(false);
      setShowDiscardConfirm(false);
      setRecoveryShift(null);
    } catch (err) {
      console.error('Failed to discard shift:', err);
      alert('Failed to discard shift: ' + err.message);
    }
  };

  const cancelDiscardRecovery = () => {
    setShowDiscardConfirm(false);
  };

  // Clock out the recovered shift as-is (user forgot to clock out)
  const handleClockOutRecovery = async () => {
    if (!recoveryShift || !recoveryShift.timeBlocks || recoveryShift.timeBlocks.length === 0) {
      alert('Cannot clock out - no time blocks saved');
      return;
    }

    try {
      // Calculate total hours from saved blocks
      let totalHours = 0;
      recoveryShift.timeBlocks.forEach(block => {
        const hrs = calculateBlockHours(block.startTime, block.endTime);
        if (hrs) totalHours += parseFloat(hrs);
      });

      // Get clock in/out times from first/last blocks
      const firstBlock = recoveryShift.timeBlocks[0];
      const lastBlock = recoveryShift.timeBlocks[recoveryShift.timeBlocks.length - 1];
      const clockInTime = firstBlock.startTime;
      const clockOutTime = lastBlock.endTime;

      // Complete the shift (times already in UTC from server)
      const completedShift = await shiftsAPI.clockOut(
        recoveryShift.id,
        clockInTime,
        clockOutTime,
        formatHours(totalHours)
      );

      // Add to shifts list
      setShifts([completedShift, ...shifts]);

      // Show toast
      setToast({
        message: 'Shift clocked out successfully!',
        shift: completedShift
      });
      setTimeout(() => setToast(null), 5000);

      setShowRecoveryModal(false);
      setRecoveryShift(null);
    } catch (err) {
      console.error('Failed to clock out:', err);
      alert('Failed to clock out: ' + err.message);
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';

    let hour, minute;

    // Handle Date objects
    if (time instanceof Date) {
      hour = time.getHours();
      minute = time.getMinutes();
    }
    // Handle ISO timestamp strings (e.g., "2026-01-27T15:45:00.000Z")
    else if (typeof time === 'string' && (time.includes('T') || (time.includes(' ') && time.includes('-')))) {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        hour = date.getHours();
        minute = date.getMinutes();
      }
    }
    // Handle object with hours/minutes (some DB drivers return this)
    else if (typeof time === 'object' && time !== null && !Array.isArray(time)) {
      if ('hours' in time || 'minutes' in time) {
        hour = time.hours || 0;
        minute = time.minutes || 0;
      }
    }
    // Handle "HH:MM" or "HH:MM:SS" format strings
    else if (typeof time === 'string') {
      const parts = time.split(':');
      if (parts.length >= 2) {
        hour = parseInt(parts[0]);
        minute = parseInt(parts[1]);
      }
    }

    // Validate we got valid numbers
    if (hour === undefined || minute === undefined || isNaN(hour) || isNaN(minute)) {
      console.log('Unexpected time format:', time, typeof time);
      return '--:--';
    }

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Invalid Date';
    try {
      let date;
      // Handle Date objects, ISO strings, and YYYY-MM-DD strings
      if (dateStr instanceof Date) {
        date = dateStr;
      } else if (typeof dateStr === 'string') {
        // If it's just YYYY-MM-DD, add time to avoid timezone issues
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          date = new Date(dateStr + 'T12:00:00');
        } else {
          date = new Date(dateStr);
        }
      } else {
        return 'Invalid Date';
      }
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const blockCount = completedBlocks.length + (currentBlock ? 1 : 0);

  const toggleShiftExpanded = (shiftId) => {
    setExpandedShifts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shiftId)) {
        newSet.delete(shiftId);
      } else {
        newSet.add(shiftId);
      }
      return newSet;
    });
  };

  return (
    <div className="app">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type || ''}`}>
          <div className="toast-header">
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)}>&times;</button>
          </div>
          {toast.shift && (
            <div className="toast-preview">
              <div className="toast-date">{formatDate(toast.shift.date)}</div>
              <div className="toast-times">
                {formatTime(toast.shift.clockInTime)} - {formatTime(toast.shift.clockOutTime)}
              </div>
              <div className="toast-hours">{toast.shift.totalHours} hours</div>
              <div className="toast-blocks">
                {toast.shift.timeBlocks.filter(b => !b.isBreak).slice(0, 3).map((b, i) => (
                  <div key={i} className="toast-block-item">{b.tasks}</div>
                ))}
                {toast.shift.timeBlocks.filter(b => !b.isBreak).length > 3 && (
                  <div className="toast-more">+{toast.shift.timeBlocks.filter(b => !b.isBreak).length - 3} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showPreviewModal && previewShiftData && (
        <div className="modal-overlay" onClick={cancelPreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Your Shift</h2>
              <button className="modal-close" onClick={cancelPreview}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="preview-summary">
                <div className="preview-date">{formatDate(previewShiftData.date)}</div>
                <div className="preview-times">
                  <span className="preview-label">Clock In/Out:</span>
                  <span>{formatTime(previewShiftData.clockInTime)} - {formatTime(previewShiftData.clockOutTime)}</span>
                </div>
                <div className="preview-total">
                  <span className="preview-label">Total Hours:</span>
                  <strong>{previewShiftData.totalHours} hrs</strong>
                </div>
              </div>
              <div className="preview-blocks">
                <h3>Time Blocks</h3>
                {previewShiftData.timeBlocks.map((block, index) => {
                  // Count only work blocks for numbering
                  const workBlockNumber = previewShiftData.timeBlocks
                    .slice(0, index + 1)
                    .filter(b => !b.isBreak).length;
                  return (
                  <div key={index} className={`preview-block ${block.isBreak ? 'break-block' : ''}`}>
                    <div className="preview-block-header">
                      <span className="preview-block-num">
                        {block.isBreak ? 'Break' : `Block ${workBlockNumber}`}
                      </span>
                      <span className="preview-block-time">
                        {formatTime(block.startTime)} - {formatTime(block.endTime)}
                      </span>
                      <span className="preview-block-hours">
                        {calculateBlockHours(block.startTime, block.endTime)}h
                      </span>
                    </div>
                    <div className="preview-block-tasks">
                      {block.tasks.split(' • ').map((task, i) => (
                        <div key={i} className="preview-task-item">{task}</div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={cancelPreview}>
                Go Back & Edit
              </button>
              <button className="btn-confirm-modal" onClick={confirmSave} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gap Fill Modal */}
      {showGapModal && gapData && (
        <div className="modal-overlay">
          <div className="preview-modal gap-modal gap-modal-full">
            <div className="modal-header">
              <h2>Fill Time Gap</h2>
              <button className="modal-close" onClick={handleCloseGapModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="gap-warning">
                {deleteGapSource === 'delete'
                  ? 'Deleting this block created a gap. Fill in what you worked on during this time, or edit surrounding blocks to close the gap.'
                  : 'Your edit created a gap. Fill in what you worked on during this time, or edit surrounding blocks to close the gap.'}
              </div>
              <div className="gap-times">
                <div className="time-field">
                  <label>Start</label>
                  <div className="time-picker-group">
                    {(() => {
                      const parseTime = (timeStr) => {
                        if (!timeStr) return { hour: '', minute: '', period: 'AM' };
                        const [h, m] = timeStr.split(':').map(Number);
                        return {
                          hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
                          minute: String(m).padStart(2, '0'),
                          period: h >= 12 ? 'PM' : 'AM'
                        };
                      };
                      const buildTime = (hour, minute, period) => {
                        if (!hour || minute === '') return '';
                        let h = parseInt(hour);
                        if (period === 'AM' && h === 12) h = 0;
                        else if (period === 'PM' && h !== 12) h += 12;
                        return `${String(h).padStart(2, '0')}:${minute}`;
                      };

                      // Get gap boundaries in minutes
                      const boundaryStart = gapData.gapBoundaryStart || gapData.startTime;
                      const boundaryEnd = gapData.gapBoundaryEnd || gapData.endTime;
                      const [bsH, bsM] = boundaryStart.split(':').map(Number);
                      const [beH, beM] = boundaryEnd.split(':').map(Number);
                      const minMins = bsH * 60 + bsM;
                      let maxMins = beH * 60 + beM - 15; // Leave room for at least 15 min block
                      if (maxMins < minMins) maxMins += 24 * 60; // Handle overnight

                      // Determine valid period based on gap boundaries
                      const boundaryPeriod = bsH >= 12 ? 'PM' : 'AM';
                      const endBoundaryPeriod = beH >= 12 ? 'PM' : 'AM';
                      const canTogglePeriod = boundaryPeriod !== endBoundaryPeriod;

                      const isValidStartTime = (totalMins) => {
                        let adjMins = totalMins;
                        if (adjMins < minMins - 12 * 60) adjMins += 24 * 60;
                        return adjMins >= minMins && adjMins <= maxMins;
                      };

                      // Calculate valid hours
                      const validHours = [];
                      for (let displayH = 1; displayH <= 12; displayH++) {
                        for (const period of [boundaryPeriod, endBoundaryPeriod]) {
                          let h24 = displayH;
                          if (period === 'AM' && displayH === 12) h24 = 0;
                          else if (period === 'PM' && displayH !== 12) h24 += 12;
                          for (const m of [0, 15, 30, 45]) {
                            if (isValidStartTime(h24 * 60 + m)) {
                              if (!validHours.includes(displayH)) validHours.push(displayH);
                              break;
                            }
                          }
                        }
                      }

                      const getPeriodForHour = (displayH) => {
                        for (const period of [boundaryPeriod, endBoundaryPeriod]) {
                          let h24 = displayH;
                          if (period === 'AM' && displayH === 12) h24 = 0;
                          else if (period === 'PM' && displayH !== 12) h24 += 12;
                          for (const m of [0, 15, 30, 45]) {
                            if (isValidStartTime(h24 * 60 + m)) return period;
                          }
                        }
                        return boundaryPeriod;
                      };

                      const getMinutesForHour = (displayH, period) => {
                        let h24 = displayH;
                        if (period === 'AM' && displayH === 12) h24 = 0;
                        else if (period === 'PM' && displayH !== 12) h24 += 12;
                        const validMins = [];
                        for (const m of ['00', '15', '30', '45']) {
                          if (isValidStartTime(h24 * 60 + parseInt(m))) validMins.push(m);
                        }
                        return validMins.length > 0 ? validMins : ['00','15','30','45'];
                      };

                      const parsed = parseTime(gapData.startTime);
                      const selectedHour = parsed.hour && validHours.includes(parsed.hour) ? parsed.hour : '';
                      const correctPeriod = selectedHour ? getPeriodForHour(selectedHour) : boundaryPeriod;
                      const validMinutes = selectedHour ? getMinutesForHour(selectedHour, correctPeriod) : ['00','15','30','45'];
                      const selectedMinute = parsed.minute && validMinutes.includes(parsed.minute) ? parsed.minute : '';

                      const selectGapStartHour = (hour) => {
                        const period = getPeriodForHour(parseInt(hour));
                        const mins = getMinutesForHour(parseInt(hour), period);
                        const minute = mins.includes(parsed.minute) ? parsed.minute : mins[0] || '00';
                        updateGapData('startTime', buildTime(hour, minute, period));
                      };

                      return (
                        <>
                          <select
                            value={selectedHour}
                            onChange={(e) => {
                              const newHour = e.target.value;
                              if (!newHour) { updateGapData('startTime', ''); return; }
                              selectGapStartHour(newHour);
                            }}
                            onKeyDown={(e) => handleHourKeyDown(e, validHours, selectGapStartHour)}
                            className="time-select hour-select"
                          >
                            <option value="">--</option>
                            {validHours.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span className="time-separator">:</span>
                          <select
                            value={selectedMinute}
                            onChange={(e) => updateGapData('startTime', buildTime(selectedHour || validHours[0], e.target.value, correctPeriod))}
                            className="time-select minute-select"
                          >
                            <option value="">--</option>
                            {validMinutes.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <div className="period-toggle">
                            <button
                              type="button"
                              className={`period-btn ${correctPeriod === 'AM' ? 'active' : ''}`}
                              disabled={!canTogglePeriod}
                            >AM</button>
                            <button
                              type="button"
                              className={`period-btn ${correctPeriod === 'PM' ? 'active' : ''}`}
                              disabled={!canTogglePeriod}
                            >PM</button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="time-field">
                  <label>End</label>
                  <div className="time-picker-group">
                    {(() => {
                      const parseTime = (timeStr) => {
                        if (!timeStr) return { hour: '', minute: '', period: 'AM' };
                        const [h, m] = timeStr.split(':').map(Number);
                        return {
                          hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
                          minute: String(m).padStart(2, '0'),
                          period: h >= 12 ? 'PM' : 'AM'
                        };
                      };
                      const buildTime = (hour, minute, period) => {
                        if (!hour || minute === '') return '';
                        let h = parseInt(hour);
                        if (period === 'AM' && h === 12) h = 0;
                        else if (period === 'PM' && h !== 12) h += 12;
                        return `${String(h).padStart(2, '0')}:${minute}`;
                      };

                      // Get constraints: start time + 15 min to gap boundary end (max 2 hours from start)
                      const boundaryEnd = gapData.gapBoundaryEnd || gapData.endTime;
                      const [beH, beM] = boundaryEnd.split(':').map(Number);
                      const boundaryEndMins = beH * 60 + beM;

                      if (!gapData.startTime) {
                        const boundaryPeriod = beH >= 12 ? 'PM' : 'AM';
                        return (
                          <>
                            <select className="time-select hour-select" disabled><option>--</option></select>
                            <span className="time-separator">:</span>
                            <select className="time-select minute-select" disabled><option>--</option></select>
                            <div className="period-toggle">
                              <button type="button" className={`period-btn ${boundaryPeriod === 'AM' ? 'active' : ''}`} disabled>AM</button>
                              <button type="button" className={`period-btn ${boundaryPeriod === 'PM' ? 'active' : ''}`} disabled>PM</button>
                            </div>
                          </>
                        );
                      }

                      const [startH, startM] = gapData.startTime.split(':').map(Number);
                      const startMins = startH * 60 + startM;
                      const minEndMins = startMins + 15; // At least 15 min after start
                      const maxEndMins = Math.min(startMins + 120, boundaryEndMins); // Max 2 hours or boundary

                      const startPeriod = startH >= 12 ? 'PM' : 'AM';
                      const endBoundaryPeriod = beH >= 12 ? 'PM' : 'AM';
                      const canTogglePeriod = startPeriod !== endBoundaryPeriod;

                      const isValidEndTime = (totalMins) => {
                        let adjMins = totalMins;
                        if (adjMins < startMins) adjMins += 24 * 60;
                        let adjMax = maxEndMins;
                        if (adjMax < startMins) adjMax += 24 * 60;
                        return adjMins >= minEndMins && adjMins <= adjMax;
                      };

                      // Calculate valid hours
                      const validHours = [];
                      for (let displayH = 1; displayH <= 12; displayH++) {
                        for (const period of [startPeriod, endBoundaryPeriod]) {
                          let h24 = displayH;
                          if (period === 'AM' && displayH === 12) h24 = 0;
                          else if (period === 'PM' && displayH !== 12) h24 += 12;
                          for (const m of [0, 15, 30, 45]) {
                            if (isValidEndTime(h24 * 60 + m)) {
                              if (!validHours.includes(displayH)) validHours.push(displayH);
                              break;
                            }
                          }
                        }
                      }

                      const getPeriodForHour = (displayH) => {
                        for (const period of [startPeriod, endBoundaryPeriod]) {
                          let h24 = displayH;
                          if (period === 'AM' && displayH === 12) h24 = 0;
                          else if (period === 'PM' && displayH !== 12) h24 += 12;
                          for (const m of [0, 15, 30, 45]) {
                            if (isValidEndTime(h24 * 60 + m)) return period;
                          }
                        }
                        return startPeriod;
                      };

                      const getMinutesForHour = (displayH, period) => {
                        let h24 = displayH;
                        if (period === 'AM' && displayH === 12) h24 = 0;
                        else if (period === 'PM' && displayH !== 12) h24 += 12;
                        const validMins = [];
                        for (const m of ['00', '15', '30', '45']) {
                          if (isValidEndTime(h24 * 60 + parseInt(m))) validMins.push(m);
                        }
                        return validMins.length > 0 ? validMins : ['00','15','30','45'];
                      };

                      const parsed = parseTime(gapData.endTime);
                      const selectedHour = parsed.hour && validHours.includes(parsed.hour) ? parsed.hour : '';
                      const correctPeriod = selectedHour ? getPeriodForHour(selectedHour) : startPeriod;
                      const validMinutes = selectedHour ? getMinutesForHour(selectedHour, correctPeriod) : ['00','15','30','45'];
                      const selectedMinute = parsed.minute && validMinutes.includes(parsed.minute) ? parsed.minute : '';

                      const selectGapEndHour = (hour) => {
                        const period = getPeriodForHour(parseInt(hour));
                        const mins = getMinutesForHour(parseInt(hour), period);
                        const minute = mins.includes(parsed.minute) ? parsed.minute : mins[0] || '00';
                        updateGapData('endTime', buildTime(hour, minute, period));
                      };

                      return (
                        <>
                          <select
                            value={selectedHour}
                            onChange={(e) => {
                              const newHour = e.target.value;
                              if (!newHour) { updateGapData('endTime', ''); return; }
                              selectGapEndHour(newHour);
                            }}
                            onKeyDown={(e) => handleHourKeyDown(e, validHours, selectGapEndHour)}
                            className="time-select hour-select"
                          >
                            <option value="">--</option>
                            {validHours.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span className="time-separator">:</span>
                          <select
                            value={selectedMinute}
                            onChange={(e) => updateGapData('endTime', buildTime(selectedHour || validHours[0], e.target.value, correctPeriod))}
                            className="time-select minute-select"
                          >
                            <option value="">--</option>
                            {validMinutes.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <div className="period-toggle">
                            <button
                              type="button"
                              className={`period-btn ${correctPeriod === 'AM' ? 'active' : ''}`}
                              disabled={!canTogglePeriod}
                            >AM</button>
                            <button
                              type="button"
                              className={`period-btn ${correctPeriod === 'PM' ? 'active' : ''}`}
                              disabled={!canTogglePeriod}
                            >PM</button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="gap-duration">
                Duration: <strong>{calculateBlockHours(gapData.startTime, gapData.endTime)} hrs</strong>
              </div>

              {/* Break Checkbox */}
              <div className="gap-break-option">
                <label className="break-checkbox-label">
                  <input
                    type="checkbox"
                    checked={gapIsBreak}
                    onChange={(e) => {
                      setGapIsBreak(e.target.checked);
                      if (e.target.checked) {
                        setPendingGapPreset(null);
                        setGapPresetDetail('');
                      }
                    }}
                  />
                  <span>Break</span>
                </label>
              </div>

              {/* Preset Tasks */}
              <div className={`task-field ${gapIsBreak ? 'disabled-section' : ''}`}>
                <label>Quick Tasks</label>
                <div className="preset-tasks-grid">
                  {PRESET_TASK_NAMES.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={`btn-preset-task ${pendingGapPreset === preset ? 'selected' : ''}`}
                      onClick={() => {
                        setPendingGapPreset(preset);
                        setGapPresetDetail('');
                      }}
                      disabled={gapIsBreak}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Detail Input */}
              {pendingGapPreset && (
                <div className="preset-detail-section">
                  <label>{pendingGapPreset} - enter details:</label>
                  <div className="preset-detail-row">
                    <input
                      type="text"
                      value={gapPresetDetail}
                      onChange={(e) => setGapPresetDetail(e.target.value)}
                      placeholder="e.g., Jones, Smith, etc."
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-add-preset"
                      onClick={() => {
                        if (gapPresetDetail.trim()) {
                          const fullTask = `${pendingGapPreset} - ${gapPresetDetail.trim()}`;
                          setGapTasks(prev => {
                            const filtered = prev.filter(t => t.trim());
                            return [...filtered, fullTask];
                          });
                          setPendingGapPreset(null);
                          setGapPresetDetail('');
                        }
                      }}
                      disabled={!gapPresetDetail.trim()}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-preset"
                      onClick={() => {
                        setPendingGapPreset(null);
                        setGapPresetDetail('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Task Input */}
              <div className={`task-field ${gapIsBreak ? 'disabled-section' : ''}`}>
                <label>Or enter custom task:</label>
                {gapTasks.map((task, index) => {
                  const taskIsPreset = isPresetTask(task);
                  return (
                    <div key={index} className="task-input-row">
                      {taskIsPreset ? (
                        <div className="preset-task-display">
                          <span className="preset-task-text">{task}</span>
                          <button
                            type="button"
                            className="btn-remove-task"
                            onClick={() => setGapTasks(gapTasks.filter((_, i) => i !== index))}
                            disabled={gapIsBreak}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={task}
                            onChange={(e) => {
                              const newTasks = [...gapTasks];
                              newTasks[index] = e.target.value;
                              setGapTasks(newTasks);
                            }}
                            placeholder={index === 0 ? "Enter task..." : "Another task..."}
                            disabled={gapIsBreak}
                          />
                          {gapTasks.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-task"
                              onClick={() => setGapTasks(gapTasks.filter((_, i) => i !== index))}
                              disabled={gapIsBreak}
                            >
                              −
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="btn-add-task"
                  onClick={() => setGapTasks([...gapTasks, ''])}
                  disabled={gapIsBreak}
                >
                  + Add Task
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={handleCloseGapModal}>
                Close
              </button>
              <button
                className="btn-confirm-modal"
                onClick={() => {
                  handleFillGap();
                  setPendingGapPreset(null);
                  setGapPresetDetail('');
                }}
                disabled={
                  (!gapIsBreak && !gapTasks.some(t => t.trim())) ||
                  !gapData?.startTime ||
                  !gapData?.endTime ||
                  !isEndTimeValidForStart(gapData?.startTime, gapData?.endTime)
                }
              >
                Fill Gap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="preview-modal password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={closePasswordModal}>&times;</button>
            </div>
            <div className="modal-body">
              {passwordSuccess ? (
                <div className="password-success">
                  Password changed successfully!
                </div>
              ) : (
                <>
                  {passwordError && (
                    <div className="password-error">{passwordError}</div>
                  )}
                  <div className="password-field">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="password-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="password-field">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </>
              )}
            </div>
            {!passwordSuccess && (
              <div className="modal-footer">
                <button className="btn-cancel-modal" onClick={closePasswordModal}>
                  Cancel
                </button>
                <button
                  className="btn-confirm-modal"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={closeEmailModal}>
          <div className="preview-modal password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Email</h2>
              <button className="modal-close" onClick={closeEmailModal}>&times;</button>
            </div>
            <div className="modal-body">
              {emailSuccess ? (
                <div className="password-success">
                  Email changed successfully!
                </div>
              ) : (
                <>
                  {emailError && (
                    <div className="password-error">{emailError}</div>
                  )}
                  <div className="password-field">
                    <label>New Email</label>
                    <input
                      type="email"
                      value={emailData.newEmail}
                      onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                      placeholder="Enter new email address"
                    />
                  </div>
                  <div className="password-field">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={emailData.password}
                      onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                      placeholder="Enter your password to confirm"
                    />
                  </div>
                </>
              )}
            </div>
            {!emailSuccess && (
              <div className="modal-footer">
                <button className="btn-cancel-modal" onClick={closeEmailModal}>
                  Cancel
                </button>
                <button
                  className="btn-confirm-modal"
                  onClick={handleChangeEmail}
                  disabled={changingEmail}
                >
                  {changingEmail ? 'Changing...' : 'Change Email'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetPasswordUser && (
        <div className="modal-overlay" onClick={closeResetPasswordModal}>
          <div className="preview-modal password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="modal-close" onClick={closeResetPasswordModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#666' }}>
                Reset password for <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.email})
              </p>
              <div className="password-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={closeResetPasswordModal}>
                Cancel
              </button>
              <button
                className="btn-confirm-modal"
                onClick={handleAdminResetPassword}
                disabled={resettingPassword}
              >
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      {showRecoveryModal && recoveryShift && (
        <div className="modal-overlay">
          <div className="preview-modal recovery-modal">
            <div className="modal-header">
              <h2>Resume Previous Shift?</h2>
            </div>
            <div className="modal-body">
              {showDiscardConfirm ? (
                <div className="discard-confirm">
                  <p className="discard-warning">Are you sure you want to discard this shift?</p>
                  <p className="discard-subtext">This will permanently delete all {recoveryShift.timeBlocks?.length || 0} saved block(s).</p>
                </div>
              ) : (
                <>
                  <div className="recovery-info">
                    <p>You have an unfinished shift from <strong>{formatDate(recoveryShift.date)}</strong></p>
                    <p className="recovery-blocks-count">
                      {recoveryShift.timeBlocks?.length || 0} time block(s) saved
                    </p>
                  </div>
                  {recoveryShift.timeBlocks && recoveryShift.timeBlocks.length > 0 && (
                    <div className="preview-blocks">
                      <h3>Saved Blocks</h3>
                      {recoveryShift.timeBlocks.map((block, index) => (
                        <div key={index} className={`preview-block ${block.isBreak ? 'break-block' : ''}`}>
                          <div className="preview-block-header">
                            <span className="preview-block-time">
                              {formatTime(block.startTime)} - {formatTime(block.endTime)}
                            </span>
                          </div>
                          <div className="preview-block-tasks">{block.tasks}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer recovery-footer">
              {showDiscardConfirm ? (
                <>
                  <button className="btn-cancel-modal" onClick={cancelDiscardRecovery}>
                    Go Back
                  </button>
                  <button className="btn-danger" onClick={confirmDiscardRecovery}>
                    Yes, Discard
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-cancel-modal" onClick={handleDiscardRecovery}>
                    Discard & Start Fresh
                  </button>
                  {recoveryShift.timeBlocks && recoveryShift.timeBlocks.length > 0 && (
                    <button className="btn-secondary" onClick={handleClockOutRecovery}>
                      Clock Out Now
                    </button>
                  )}
                  <button className="btn-confirm-modal" onClick={handleResumeRecovery}>
                    Resume Shift
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Shift Confirmation Modal */}
      {showCancelShiftConfirm && (
        <div className="modal-overlay">
          <div className="preview-modal cancel-shift-modal">
            <div className="modal-header">
              <h2>Cancel Shift?</h2>
            </div>
            <div className="modal-body">
              <p className="cancel-warning">Are you sure you want to cancel this shift?</p>
              <p className="cancel-subtext">
                This will permanently delete {completedBlocks.length} completed block(s)
                {currentBlock ? ' and your current block in progress' : ''}.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel-modal"
                onClick={() => setShowCancelShiftConfirm(false)}
              >
                Go Back
              </button>
              <button className="btn-danger" onClick={handleCancelShift}>
                Yes, Cancel Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Block Confirmation Modal */}
      {showDeleteBlockConfirm && deleteBlockTarget && (
        <div className="modal-overlay">
          <div className="preview-modal delete-block-modal">
            <div className="modal-header">
              <h2>Delete Block?</h2>
            </div>
            <div className="modal-body">
              <p className="cancel-warning">Are you sure you want to delete this block?</p>
              <p className="cancel-subtext">
                {deleteBlockTarget.isBreak ? 'Break' : 'Block'}: {formatTime(deleteBlockTarget.startTime)} - {formatTime(deleteBlockTarget.endTime)}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel-modal"
                onClick={() => {
                  setShowDeleteBlockConfirm(false);
                  setDeleteBlockTarget(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  removeCompletedBlock(deleteBlockTarget.id);
                  setShowDeleteBlockConfirm(false);
                  setDeleteBlockTarget(null);
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      {autoSaveStatus !== 'idle' && (
        <div className={`auto-save-indicator ${autoSaveStatus}`}>
          {autoSaveStatus === 'saving' && 'Saving...'}
          {autoSaveStatus === 'saved' && 'Saved'}
          {autoSaveStatus === 'error' && 'Save failed'}
        </div>
      )}

      <header className="header">
        <div className="header-top">
          <div
            className="header-logo"
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setViewingShift(null);
              setViewingUserPayWeeks(null);
              setUserPayWeeksData(null);
              setEditingShift(null);
              setCreatingShift(false);
              setEditingUser(null);
              setCreatingUser(false);
              setStatusDropdownShiftId(null);
              setShiftsSelectMode(false);
              setSelectedShiftIds(new Set());
              setDeleteConfirm(null);
              if (isAdmin) {
                setActiveTab('admin');
                setAdminSubTab('dashboard');
                loadDashboard();
              } else {
                setActiveTab('clock');
              }
            }}
          >
            <span className="logo-company">FULL SCOPE ESTIMATING</span>
            <span className="logo-app">Time Clock</span>
          </div>
          <div className="header-right">
            {/* Test Controls - Commented out for production
            <div className="test-controls">
              <div className="test-row">
                <select value={testBlocks} onChange={(e) => setTestBlocks(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} blocks</option>
                  ))}
                </select>
                <select value={testBreaks} onChange={(e) => setTestBreaks(Number(e.target.value))}>
                  {[0, 1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n} breaks</option>
                  ))}
                </select>
                <button type="button" className="btn-test" onClick={generateTestShift}>
                  Generate
                </button>
                {(completedBlocks.length > 0 || currentBlock) && (
                  <button type="button" className="btn-clear" onClick={clearAll}>
                    Clear
                  </button>
                )}
              </div>
              <div className="test-row">
                <button
                  type="button"
                  className="btn-random-task"
                  onClick={() => {
                    if (currentBlock) {
                      const randomTask = clientTasks[Math.floor(Math.random() * clientTasks.length)];
                      const emptyIndex = currentTasks.findIndex(t => !t.trim());
                      if (emptyIndex >= 0) {
                        const newTasks = [...currentTasks];
                        newTasks[emptyIndex] = randomTask;
                        setCurrentTasks(newTasks);
                      } else {
                        setCurrentTasks([...currentTasks, randomTask]);
                      }
                    }
                  }}
                  disabled={!currentBlock}
                >
                  Random Task
                </button>
              </div>
            </div>
            */}
            <div className="user-info">
              {/* Notification Bell for Employees */}
              {!isAdmin && (
                <div className="notification-container" ref={notificationRef}>
                  <button
                    className="notification-btn"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    🔔
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <button className="mark-all-read" onClick={handleMarkAllNotificationsRead}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="notification-list">
                        {notifications.length === 0 ? (
                          <p className="empty-text">No notifications</p>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif.id}
                              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                              onClick={() => handleMarkNotificationRead(notif.id)}
                            >
                              <p className="notification-message">{notif.message}</p>
                              <span className="notification-time">{new Date(notif.created_at).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="user-dropdown-container" ref={dropdownRef}>
                <button
                  className="user-name-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="header-avatar" style={{ background: getAvatarGradient(user.name) }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.name}
                  <span className="dropdown-arrow">{showUserDropdown ? '▲' : '▼'}</span>
                </button>
                {showUserDropdown && (
                  <div className="user-dropdown">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setShowPasswordModal(true);
                        setShowUserDropdown(false);
                      }}
                    >
                      Change Password
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setShowEmailModal(true);
                        setShowUserDropdown(false);
                      }}
                    >
                      Change Email
                    </button>
                    {isAdmin && (
                      <button
                        className="dropdown-item toggle-view-item"
                        onClick={() => {
                          setAdminViewingAsEmployee(!adminViewingAsEmployee);
                          setShowUserDropdown(false);
                          if (!adminViewingAsEmployee) {
                            setActiveTab('today');
                          } else {
                            setActiveTab('admin');
                          }
                        }}
                      >
                        {adminViewingAsEmployee ? '← Back to Admin View' : 'View as Employee'}
                      </button>
                    )}
                    <button className="dropdown-item logout-item" onClick={logout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Show for non-admin users OR admins viewing as employee */}
      {(!isAdmin || adminViewingAsEmployee) && (
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Today's Shift
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Shift History
          </button>
        </div>
      )}

      {activeTab === 'today' ? (
        <main className="main-grid">
          {/* Column 1 - Active Input Block(s) */}
          <section className="input-column">
            <div className="section-header">
              <h2>Current Block</h2>
              <div className="date-picker">
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="input-blocks-area">
              {/* Editing Block (shows when going back in time) */}
              {editingBlock && (
                <div className={`time-block editing-block ${editingBlock.isBreak ? 'break-block' : ''} ${swipingBlockId === editingBlock.id ? 'swiping-out' : ''}`}>
                  <div className="block-header">
                    <span className="block-number">Editing Block</span>
                    <div className="edit-controls">
                      <button type="button" className="btn-cancel-edit" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                      <button type="button" className="btn-save-edit" onClick={handleSaveEdit}>
                        Save
                      </button>
                    </div>
                  </div>
                  <div className="block-times">
                    <div className="time-field">
                      <label>Start</label>
                      <div className="time-picker-group">
                        {(() => {
                          const parseTime = (timeStr) => {
                            if (!timeStr) return { hour: '', minute: '', period: 'AM' };
                            const [h, m] = timeStr.split(':').map(Number);
                            return {
                              hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
                              minute: String(m).padStart(2, '0'),
                              period: h >= 12 ? 'PM' : 'AM'
                            };
                          };
                          const buildTime = (hour, minute, period) => {
                            if (!hour || minute === '') return '';
                            let h = parseInt(hour);
                            if (period === 'AM' && h === 12) h = 0;
                            else if (period === 'PM' && h !== 12) h += 12;
                            return `${String(h).padStart(2, '0')}:${minute}`;
                          };

                          // Smart start time validation - constrained by prev/next blocks
                          const getStartTimeConfig = () => {
                            const fallback = {
                              hours: [1,2,3,4,5,6,7,8,9,10,11,12],
                              getPeriodForHour: () => {
                                const p = parseTime(editingBlock.startTime);
                                return p.period || 'AM';
                              },
                              getMinutesForHour: () => ['00','15','30','45'],
                              canTogglePeriod: () => true
                            };

                            // Get constraints from surrounding blocks
                            let minStartMins = null;
                            let maxStartMins = null;

                            // Previous block's end time is our minimum
                            if (editingOriginalIndex !== null && editingOriginalIndex > 0) {
                              const prevBlock = completedBlocks[editingOriginalIndex - 1];
                              if (prevBlock && !prevBlock.isEditingPlaceholder && prevBlock.endTime) {
                                const [ph, pm] = prevBlock.endTime.split(':').map(Number);
                                minStartMins = ph * 60 + pm;
                              }
                            }

                            // Next block's start time minus 15 min is our maximum
                            if (editingOriginalIndex !== null && editingOriginalIndex + 1 < completedBlocks.length) {
                              const nextBlock = completedBlocks[editingOriginalIndex + 1];
                              if (nextBlock && !nextBlock.isEditingPlaceholder && nextBlock.startTime) {
                                const [nh, nm] = nextBlock.startTime.split(':').map(Number);
                                maxStartMins = nh * 60 + nm - 15;
                              }
                            }

                            if (minStartMins === null && maxStartMins === null) return fallback;

                            const isValidStartTime = (totalMins) => {
                              let adjMins = totalMins;
                              if (minStartMins !== null) {
                                if (adjMins < minStartMins - 12 * 60) adjMins += 24 * 60;
                                if (adjMins < minStartMins) return false;
                              }
                              if (maxStartMins !== null) {
                                let adjMax = maxStartMins;
                                if (minStartMins !== null && maxStartMins < minStartMins) adjMax += 24 * 60;
                                if (adjMins > adjMax) return false;
                              }
                              return true;
                            };

                            const validHours = [];
                            for (let displayH = 1; displayH <= 12; displayH++) {
                              for (const period of ['AM', 'PM']) {
                                let h24 = displayH;
                                if (period === 'AM' && displayH === 12) h24 = 0;
                                else if (period === 'PM' && displayH !== 12) h24 += 12;
                                for (const m of [0, 15, 30, 45]) {
                                  if (isValidStartTime(h24 * 60 + m)) {
                                    if (!validHours.includes(displayH)) validHours.push(displayH);
                                    break;
                                  }
                                }
                              }
                            }

                            const getPeriodForHour = (displayH) => {
                              for (const period of ['AM', 'PM']) {
                                let h24 = displayH;
                                if (period === 'AM' && displayH === 12) h24 = 0;
                                else if (period === 'PM' && displayH !== 12) h24 += 12;
                                for (const m of [0, 15, 30, 45]) {
                                  if (isValidStartTime(h24 * 60 + m)) return period;
                                }
                              }
                              return 'AM';
                            };

                            const getMinutesForHour = (displayH, period) => {
                              let h24 = displayH;
                              if (period === 'AM' && displayH === 12) h24 = 0;
                              else if (period === 'PM' && displayH !== 12) h24 += 12;
                              const validMins = [];
                              for (const m of ['00', '15', '30', '45']) {
                                if (isValidStartTime(h24 * 60 + parseInt(m))) validMins.push(m);
                              }
                              return validMins.length > 0 ? validMins : ['00','15','30','45'];
                            };

                            const canTogglePeriod = (displayH) => {
                              let validInAM = false, validInPM = false;
                              for (const m of [0, 15, 30, 45]) {
                                let h24AM = displayH === 12 ? 0 : displayH;
                                let h24PM = displayH === 12 ? 12 : displayH + 12;
                                if (isValidStartTime(h24AM * 60 + m)) validInAM = true;
                                if (isValidStartTime(h24PM * 60 + m)) validInPM = true;
                              }
                              return validInAM && validInPM;
                            };

                            return {
                              hours: validHours.length > 0 ? validHours : [1,2,3,4,5,6,7,8,9,10,11,12],
                              getPeriodForHour,
                              getMinutesForHour,
                              canTogglePeriod
                            };
                          };

                          const startConfig = getStartTimeConfig();
                          const parsed = parseTime(editingBlock.startTime);
                          const selectedHour = parsed.hour && startConfig.hours.includes(parsed.hour) ? parsed.hour : '';
                          const correctPeriod = selectedHour ? startConfig.getPeriodForHour(selectedHour) : (parsed.period || 'AM');
                          const validMinutes = selectedHour ? startConfig.getMinutesForHour(selectedHour, correctPeriod) : ['00','15','30','45'];
                          const selectedMinute = parsed.minute && validMinutes.includes(parsed.minute) ? parsed.minute : '';
                          const showPeriodToggle = selectedHour && startConfig.canTogglePeriod(selectedHour);

                          const selectHour = (hour) => {
                            const period = startConfig.getPeriodForHour(parseInt(hour));
                            const mins = startConfig.getMinutesForHour(parseInt(hour), period);
                            const minute = mins.includes(parsed.minute) ? parsed.minute : mins[0] || '00';
                            updateEditingBlock('startTime', buildTime(hour, minute, period));
                          };

                          return (
                            <>
                              <select
                                value={selectedHour}
                                onChange={(e) => {
                                  const newHour = e.target.value;
                                  if (!newHour) {
                                    updateEditingBlock('startTime', '');
                                    return;
                                  }
                                  selectHour(newHour);
                                }}
                                onKeyDown={(e) => handleHourKeyDown(e, startConfig.hours, selectHour)}
                                className="time-select hour-select"
                              >
                                <option value="">--</option>
                                {startConfig.hours.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span className="time-separator">:</span>
                              <select
                                value={selectedMinute}
                                onChange={(e) => {
                                  updateEditingBlock('startTime', buildTime(selectedHour || startConfig.hours[0], e.target.value, correctPeriod));
                                }}
                                className="time-select minute-select"
                              >
                                <option value="">--</option>
                                {validMinutes.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <div className="period-toggle">
                                <button
                                  type="button"
                                  className={`period-btn ${correctPeriod === 'AM' ? 'active' : ''}`}
                                  disabled={!showPeriodToggle}
                                  onClick={() => {
                                    if (selectedHour && showPeriodToggle) {
                                      const mins = startConfig.getMinutesForHour(selectedHour, 'AM');
                                      const minute = mins.includes(selectedMinute) ? selectedMinute : mins[0] || '00';
                                      updateEditingBlock('startTime', buildTime(selectedHour, minute, 'AM'));
                                    }
                                  }}
                                >AM</button>
                                <button
                                  type="button"
                                  className={`period-btn ${correctPeriod === 'PM' ? 'active' : ''}`}
                                  disabled={!showPeriodToggle}
                                  onClick={() => {
                                    if (selectedHour && showPeriodToggle) {
                                      const mins = startConfig.getMinutesForHour(selectedHour, 'PM');
                                      const minute = mins.includes(selectedMinute) ? selectedMinute : mins[0] || '00';
                                      updateEditingBlock('startTime', buildTime(selectedHour, minute, 'PM'));
                                    }
                                  }}
                                >PM</button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="time-field">
                      <label>End</label>
                      <div className="time-picker-group">
                        {(() => {
                          const getStartPeriod = () => {
                            if (!editingBlock.startTime) return 'AM';
                            const [h] = editingBlock.startTime.split(':').map(Number);
                            return h >= 12 ? 'PM' : 'AM';
                          };
                          const parseTime = (timeStr) => {
                            if (!timeStr) return { hour: '', minute: '', period: getStartPeriod() };
                            const [h, m] = timeStr.split(':').map(Number);
                            return {
                              hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
                              minute: String(m).padStart(2, '0'),
                              period: h >= 12 ? 'PM' : 'AM'
                            };
                          };
                          const buildTime = (hour, minute, period) => {
                            if (!hour || minute === '') return '';
                            let h = parseInt(hour);
                            if (period === 'AM' && h === 12) h = 0;
                            else if (period === 'PM' && h !== 12) h += 12;
                            return `${String(h).padStart(2, '0')}:${minute}`;
                          };

                          // Smart end time validation
                          const getEndTimeConfig = () => {
                            const fallback = {
                              hours: [1,2,3,4,5,6,7,8,9,10,11,12],
                              getPeriodForHour: () => getStartPeriod(),
                              getMinutesForHour: () => ['00','15','30','45'],
                              canTogglePeriod: () => false
                            };
                            if (!editingBlock.startTime) return fallback;

                            const startParsed = parseTime(editingBlock.startTime);
                            const startH = startParsed.hour;
                            const startM = parseInt(startParsed.minute || '0');
                            const startP = startParsed.period;
                            if (!startH) return fallback;

                            // Convert start to total minutes
                            let start24 = startH;
                            if (startP === 'AM' && startH === 12) start24 = 0;
                            else if (startP === 'PM' && startH !== 12) start24 += 12;
                            const startTotalMins = start24 * 60 + startM;

                            // Check for next block constraint (can't overlap)
                            let maxEndMins = null;
                            if (editingOriginalIndex !== null && editingOriginalIndex + 1 < completedBlocks.length) {
                              const nextBlock = completedBlocks[editingOriginalIndex + 1];
                              if (nextBlock && !nextBlock.isEditingPlaceholder && nextBlock.startTime) {
                                const [nh, nm] = nextBlock.startTime.split(':').map(Number);
                                maxEndMins = nh * 60 + nm;
                                // Handle overnight: if next block starts before current start, it's next day
                                if (maxEndMins <= startTotalMins) maxEndMins += 24 * 60;
                              }
                            }

                            // Helper to check if end time is valid (within 2hr and not overlapping next block)
                            const isValidEndTime = (endTotalMins) => {
                              let adjEndMins = endTotalMins;
                              if (adjEndMins <= startTotalMins) adjEndMins += 24 * 60;
                              const diff = adjEndMins - startTotalMins;
                              if (diff < 15 || diff > 120) return false;
                              if (maxEndMins !== null && adjEndMins > maxEndMins) return false;
                              return true;
                            };

                            // Calculate valid end hours (wrap around 12)
                            const h1 = startH;
                            const h2 = h1 === 12 ? 1 : h1 + 1;
                            const h3 = h2 === 12 ? 1 : h2 + 1;
                            // Filter hours that have at least one valid minute
                            const potentialHours = startM === 45 ? [h2, h3] : [h1, h2, h3];

                            // Get the correct period for a given end hour
                            const getPeriodForHour = (endH) => {
                              for (const p of [startP, startP === 'AM' ? 'PM' : 'AM']) {
                                let end24 = endH;
                                if (p === 'AM' && endH === 12) end24 = 0;
                                else if (p === 'PM' && endH !== 12) end24 += 12;
                                for (const m of [0, 15, 30, 45]) {
                                  const endTotalMins = end24 * 60 + m;
                                  if (isValidEndTime(endTotalMins)) return p;
                                }
                              }
                              return startP;
                            };

                            // Get valid minutes for a given end hour
                            const getMinutesForHour = (endH) => {
                              const endP = getPeriodForHour(endH);
                              let end24 = endH;
                              if (endP === 'AM' && endH === 12) end24 = 0;
                              else if (endP === 'PM' && endH !== 12) end24 += 12;
                              const validMins = [];
                              for (const m of ['00', '15', '30', '45']) {
                                const endTotalMins = end24 * 60 + parseInt(m);
                                if (isValidEndTime(endTotalMins)) validMins.push(m);
                              }
                              return validMins;
                            };

                            // Filter hours to only those with valid minutes
                            const hours = potentialHours.filter(h => getMinutesForHour(h).length > 0);

                            // Check if period toggle should be enabled (only if hour could cross noon/midnight)
                            const canTogglePeriod = (endH) => {
                              let validInStart = false, validInOpp = false;
                              const oppP = startP === 'AM' ? 'PM' : 'AM';
                              for (const m of [0, 15, 30, 45]) {
                                // Check start period
                                let end24s = endH;
                                if (startP === 'AM' && endH === 12) end24s = 0;
                                else if (startP === 'PM' && endH !== 12) end24s += 12;
                                if (isValidEndTime(end24s * 60 + m)) validInStart = true;
                                // Check opposite period
                                let end24o = endH;
                                if (oppP === 'AM' && endH === 12) end24o = 0;
                                else if (oppP === 'PM' && endH !== 12) end24o += 12;
                                if (isValidEndTime(end24o * 60 + m)) validInOpp = true;
                              }
                              return validInStart && validInOpp;
                            };

                            return { hours, getPeriodForHour, getMinutesForHour, canTogglePeriod };
                          };

                          const endConfig = getEndTimeConfig();
                          const parsed = parseTime(editingBlock.endTime);
                          // Only use selected values if they're in valid lists
                          const selectedHour = parsed.hour && endConfig.hours.includes(parsed.hour) ? parsed.hour : '';
                          const tempValidMinutes = selectedHour ? endConfig.getMinutesForHour(selectedHour) : [];
                          const selectedMinute = parsed.minute && tempValidMinutes.includes(parsed.minute) ? parsed.minute : '';
                          const correctPeriod = selectedHour ? endConfig.getPeriodForHour(selectedHour) : getStartPeriod();
                          const validMinutes = selectedHour ? endConfig.getMinutesForHour(selectedHour) : ['00','15','30','45'];
                          const showPeriodToggle = selectedHour && endConfig.canTogglePeriod(selectedHour);

                          const selectEndHour = (hour) => {
                            const period = endConfig.getPeriodForHour(parseInt(hour));
                            const mins = endConfig.getMinutesForHour(parseInt(hour));
                            const minute = mins.includes(parsed.minute) ? parsed.minute : mins[0] || '00';
                            updateEditingBlock('endTime', buildTime(hour, minute, period));
                          };

                          return (
                            <>
                              <select
                                value={selectedHour}
                                onChange={(e) => {
                                  const newHour = e.target.value;
                                  if (!newHour) {
                                    updateEditingBlock('endTime', '');
                                    return;
                                  }
                                  selectEndHour(newHour);
                                }}
                                onKeyDown={(e) => handleHourKeyDown(e, endConfig.hours, selectEndHour)}
                                className="time-select hour-select"
                              >
                                <option value="">--</option>
                                {endConfig.hours.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span className="time-separator">:</span>
                              <select
                                value={selectedMinute}
                                onChange={(e) => {
                                  updateEditingBlock('endTime', buildTime(selectedHour || endConfig.hours[0], e.target.value, correctPeriod));
                                }}
                                className="time-select minute-select"
                              >
                                <option value="">--</option>
                                {validMinutes.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <div className="period-toggle">
                                <button
                                  type="button"
                                  className={`period-btn ${correctPeriod === 'AM' ? 'active' : ''}`}
                                  disabled={!showPeriodToggle}
                                  onClick={() => {
                                    if (selectedHour && showPeriodToggle) {
                                      updateEditingBlock('endTime', buildTime(selectedHour, selectedMinute || '00', 'AM'));
                                    }
                                  }}
                                >AM</button>
                                <button
                                  type="button"
                                  className={`period-btn ${correctPeriod === 'PM' ? 'active' : ''}`}
                                  disabled={!showPeriodToggle}
                                  onClick={() => {
                                    if (selectedHour && showPeriodToggle) {
                                      updateEditingBlock('endTime', buildTime(selectedHour, selectedMinute || '00', 'PM'));
                                    }
                                  }}
                                >PM</button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  {/* Hide task input for breaks */}
                  {!editingBlock.isBreak && (
                    <div className="task-field">
                      <label>Tasks</label>
                      {editingTasks.map((task, index) => {
                        const isPreset = isPresetTask(task);
                        return (
                          <div key={index} className={`task-input-row ${isPreset ? 'preset-task-row' : ''}`}>
                            {isPreset ? (
                              <div className="preset-task-display">{task}</div>
                            ) : (
                              <input
                                type="text"
                                value={task}
                                onChange={(e) => {
                                  const newTasks = [...editingTasks];
                                  newTasks[index] = e.target.value;
                                  setEditingTasks(newTasks);
                                }}
                                placeholder={index === 0 ? "What did you work on?" : "Another task..."}
                              />
                            )}
                            {(editingTasks.length > 1 || isPreset) && (
                              <button
                                type="button"
                                className="btn-remove-task"
                                onClick={() => {
                                  const newTasks = editingTasks.filter((_, i) => i !== index);
                                  setEditingTasks(newTasks.length === 0 ? [''] : newTasks);
                                }}
                              >
                                −
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="btn-add-task"
                        onClick={() => setEditingTasks([...editingTasks, ''])}
                      >
                        + Add Task
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Current Block (main input) */}
              {currentBlock ? (
                <div className={`time-block current-block ${currentBlock.isBreak ? 'break-block' : ''} ${swipingBlockId === currentBlock.id ? 'swiping-out' : ''}`}>
                  <div className="block-header">
                    <span className="block-number">
                      Block {blockCount}
                      <span className="info-tooltip-wrapper" style={{ marginLeft: '6px' }}>
                        <span className="info-icon-trigger" style={{ fontSize: '0.75rem' }}>ⓘ</span>
                        <span className="info-tooltip">Each block is limited to 2 hours max. Complete this block to start a new one.</span>
                      </span>
                    </span>
                    {calculateBlockHours(currentBlock.startTime, currentBlock.endTime) && (
                      <span className="block-hours">
                        {calculateBlockHours(currentBlock.startTime, currentBlock.endTime)} hrs
                      </span>
                    )}
                    {currentBlock.endTime && (
                      <button
                        type="button"
                        className="btn-clear-block"
                        onClick={() => {
                          // If there are completed blocks, start time is locked - only clear end time
                          // If no completed blocks, clear both
                          if (completedBlocks.length > 0) {
                            setCurrentBlock({ ...currentBlock, endTime: '' });
                          } else {
                            setCurrentBlock({ ...currentBlock, startTime: '', endTime: '' });
                          }
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="block-times">
                    <div className="time-field">
                      <label>Start</label>
                      <div className="time-picker-group">
                        {(() => {
                          const parseTime = (timeStr) => {
                            if (!timeStr) return { hour: '', minute: '', period: 'AM' };
                            const [h, m] = timeStr.split(':').map(Number);
                            return {
                              hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
                              minute: String(m).padStart(2, '0'),
                              period: h >= 12 ? 'PM' : 'AM'
                            };
                          };
                          const buildTime = (hour, minute, period) => {
                            if (!hour || minute === '') return '';
                            let h = parseInt(hour);
                            if (period === 'AM' && h === 12) h = 0;
                            else if (period === 'PM' && h !== 12) h += 12;
                            return `${String(h).padStart(2, '0')}:${minute}`;
                          };
                          const parsed = parseTime(currentBlock.startTime);
                          const isLocked = completedBlocks.length > 0;
                          const allHours = [1,2,3,4,5,6,7,8,9,10,11,12];
                          const selectStartHour = (hour) => {
                            if (!isLocked) {
                              updateCurrentBlock('startTime', buildTime(hour, parsed.minute || '00', parsed.period));
                            }
                          };
                          return (
                            <>
                              <select
                                value={parsed.hour}
                                onChange={(e) => selectStartHour(e.target.value)}
                                onKeyDown={(e) => !isLocked && handleHourKeyDown(e, allHours, selectStartHour)}
                                disabled={isLocked}
                                className={`time-select hour-select ${isLocked ? 'locked-input' : ''}`}
                              >
                                <option value="">--</option>
                                {allHours.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span className="time-separator">:</span>
                              <select
                                value={parsed.minute}
                                onChange={(e) => !isLocked && updateCurrentBlock('startTime', buildTime(parsed.hour || 12, e.target.value, parsed.period))}
                                disabled={isLocked}
                                className={`time-select minute-select ${isLocked ? 'locked-input' : ''}`}
                              >
                                <option value="">--</option>
                                <option value="00">00</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                              </select>
                              <div className="period-toggle">
                                <button
                                  type="button"
                                  className={`period-btn ${parsed.period === 'AM' ? 'active' : ''}`}
                                  onClick={() => !isLocked && parsed.hour && updateCurrentBlock('startTime', buildTime(parsed.hour, parsed.minute || '00', 'AM'))}
                                  disabled={isLocked}
                                >AM</button>
                                <button
                                  type="button"
                                  className={`period-btn ${parsed.period === 'PM' ? 'active' : ''}`}
                                  onClick={() => !isLocked && parsed.hour && updateCurrentBlock('startTime', buildTime(parsed.hour, parsed.minute || '00', 'PM'))}
                                  disabled={isLocked}
                                >PM</button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="time-field">
                      <label>End</label>
                      <div className="time-picker-group">
                        {(() => {
                          // Get start time's period to use as default
                          const getStartPeriod = () => {
                            if (!currentBlock.startTime) return 'AM';
                            const [h] = currentBlock.startTime.split(':').map(Number);
                            return h >= 12 ? 'PM' : 'AM';
                          };
                          const parseTime = (timeStr) => {
                            if (!timeStr) return { hour: '', minute: '', period: getStartPeriod() };
                            const [h, m] = timeStr.split(':').map(Number);
                            return {
                              hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
                              minute: String(m).padStart(2, '0'),
                              period: h >= 12 ? 'PM' : 'AM'
                            };
                          };
                          const buildTime = (hour, minute, period) => {
                            if (!hour || minute === '') return '';
                            let h = parseInt(hour);
                            if (period === 'AM' && h === 12) h = 0;
                            else if (period === 'PM' && h !== 12) h += 12;
                            return `${String(h).padStart(2, '0')}:${minute}`;
                          };

                          // Smart end time validation
                          const getEndTimeConfig = () => {
                            const fallback = {
                              hours: [1,2,3,4,5,6,7,8,9,10,11,12],
                              getPeriodForHour: () => getStartPeriod(),
                              getMinutesForHour: () => ['00','15','30','45'],
                              canTogglePeriod: () => false
                            };
                            if (!currentBlock.startTime) return fallback;

                            const startParsed = parseTime(currentBlock.startTime);
                            const startH = startParsed.hour;
                            const startM = parseInt(startParsed.minute || '0');
                            const startP = startParsed.period;
                            if (!startH) return fallback;

                            // Convert start to total minutes
                            let start24 = startH;
                            if (startP === 'AM' && startH === 12) start24 = 0;
                            else if (startP === 'PM' && startH !== 12) start24 += 12;
                            const startTotalMins = start24 * 60 + startM;

                            // Calculate valid end hours (wrap around 12)
                            const h1 = startH;
                            const h2 = h1 === 12 ? 1 : h1 + 1;
                            const h3 = h2 === 12 ? 1 : h2 + 1;
                            // If startM is 45, h1 has no valid minutes (min 15 mins required)
                            const hours = startM === 45 ? [h2, h3] : [h1, h2, h3];

                            // Get the correct period for a given end hour
                            const getPeriodForHour = (endH) => {
                              for (const p of [startP, startP === 'AM' ? 'PM' : 'AM']) {
                                let end24 = endH;
                                if (p === 'AM' && endH === 12) end24 = 0;
                                else if (p === 'PM' && endH !== 12) end24 += 12;
                                for (const m of [0, 15, 30, 45]) {
                                  let endTotalMins = end24 * 60 + m;
                                  if (endTotalMins <= startTotalMins) endTotalMins += 24 * 60;
                                  const diff = endTotalMins - startTotalMins;
                                  if (diff >= 15 && diff <= 120) return p;
                                }
                              }
                              return startP;
                            };

                            // Get valid minutes for a given end hour
                            const getMinutesForHour = (endH) => {
                              const endP = getPeriodForHour(endH);
                              let end24 = endH;
                              if (endP === 'AM' && endH === 12) end24 = 0;
                              else if (endP === 'PM' && endH !== 12) end24 += 12;
                              const validMins = [];
                              for (const m of ['00', '15', '30', '45']) {
                                let endTotalMins = end24 * 60 + parseInt(m);
                                if (endTotalMins <= startTotalMins) endTotalMins += 24 * 60;
                                const diff = endTotalMins - startTotalMins;
                                if (diff >= 15 && diff <= 120) validMins.push(m);
                              }
                              return validMins;
                            };

                            // Check if period toggle should be enabled (only if hour could cross noon/midnight)
                            const canTogglePeriod = (endH) => {
                              let validInStart = false, validInOpp = false;
                              const oppP = startP === 'AM' ? 'PM' : 'AM';
                              for (const m of [0, 15, 30, 45]) {
                                // Check start period
                                let end24s = endH;
                                if (startP === 'AM' && endH === 12) end24s = 0;
                                else if (startP === 'PM' && endH !== 12) end24s += 12;
                                let endMinsS = end24s * 60 + m;
                                if (endMinsS <= startTotalMins) endMinsS += 24 * 60;
                                if ((endMinsS - startTotalMins) >= 15 && (endMinsS - startTotalMins) <= 120) validInStart = true;
                                // Check opposite period
                                let end24o = endH;
                                if (oppP === 'AM' && endH === 12) end24o = 0;
                                else if (oppP === 'PM' && endH !== 12) end24o += 12;
                                let endMinsO = end24o * 60 + m;
                                if (endMinsO <= startTotalMins) endMinsO += 24 * 60;
                                if ((endMinsO - startTotalMins) >= 15 && (endMinsO - startTotalMins) <= 120) validInOpp = true;
                              }
                              return validInStart && validInOpp;
                            };

                            return { hours, getPeriodForHour, getMinutesForHour, canTogglePeriod };
                          };

                          const endConfig = getEndTimeConfig();
                          const parsed = parseTime(currentBlock.endTime);
                          // Only use selected values if they're in valid lists
                          const selectedHour = parsed.hour && endConfig.hours.includes(parsed.hour) ? parsed.hour : '';
                          const tempValidMinutes = selectedHour ? endConfig.getMinutesForHour(selectedHour) : [];
                          const selectedMinute = parsed.minute && tempValidMinutes.includes(parsed.minute) ? parsed.minute : '';
                          const correctPeriod = selectedHour ? endConfig.getPeriodForHour(selectedHour) : getStartPeriod();
                          const validMinutes = selectedHour ? endConfig.getMinutesForHour(selectedHour) : ['00','15','30','45'];
                          const showPeriodToggle = selectedHour && endConfig.canTogglePeriod(selectedHour);

                          const selectEndHour = (hour) => {
                            const period = endConfig.getPeriodForHour(parseInt(hour));
                            const mins = endConfig.getMinutesForHour(parseInt(hour));
                            const minute = mins.includes(parsed.minute) ? parsed.minute : mins[0] || '00';
                            updateCurrentBlock('endTime', buildTime(hour, minute, period));
                          };

                          return (
                            <>
                              <select
                                value={selectedHour}
                                onChange={(e) => {
                                  const newHour = e.target.value;
                                  if (!newHour) {
                                    updateCurrentBlock('endTime', '');
                                    return;
                                  }
                                  selectEndHour(newHour);
                                }}
                                onKeyDown={(e) => handleHourKeyDown(e, endConfig.hours, selectEndHour)}
                                className="time-select hour-select"
                              >
                                <option value="">--</option>
                                {endConfig.hours.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span className="time-separator">:</span>
                              <select
                                value={selectedMinute}
                                onChange={(e) => {
                                  updateCurrentBlock('endTime', buildTime(selectedHour || endConfig.hours[0], e.target.value, correctPeriod));
                                }}
                                className="time-select minute-select"
                              >
                                <option value="">--</option>
                                {validMinutes.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <div className="period-toggle">
                                <button
                                  type="button"
                                  className={`period-btn ${correctPeriod === 'AM' ? 'active' : ''}`}
                                  disabled={!showPeriodToggle}
                                  onClick={() => {
                                    if (selectedHour && showPeriodToggle) {
                                      updateCurrentBlock('endTime', buildTime(selectedHour, selectedMinute || '00', 'AM'));
                                    }
                                  }}
                                >AM</button>
                                <button
                                  type="button"
                                  className={`period-btn ${correctPeriod === 'PM' ? 'active' : ''}`}
                                  disabled={!showPeriodToggle}
                                  onClick={() => {
                                    if (selectedHour && showPeriodToggle) {
                                      updateCurrentBlock('endTime', buildTime(selectedHour, selectedMinute || '00', 'PM'));
                                    }
                                  }}
                                >PM</button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="task-field">
                    <label>Tasks</label>
                    {currentTasks.map((task, index) => {
                      const isPreset = isPresetTask(task);
                      return (
                        <div key={index} className={`task-input-row ${isPreset ? 'preset-task-row' : ''}`}>
                          {isPreset ? (
                            <div className="preset-task-display">{task}</div>
                          ) : (
                            <input
                              type="text"
                              value={task}
                              onChange={(e) => {
                                const newTasks = [...currentTasks];
                                newTasks[index] = e.target.value;
                                setCurrentTasks(newTasks);
                              }}
                              placeholder={index === 0 ? "What did you work on?" : "Another task..."}
                            />
                          )}
                          {(currentTasks.length > 1 || isPreset) && (
                            <button
                              type="button"
                              className="btn-remove-task"
                              onClick={() => {
                                const newTasks = currentTasks.filter((_, i) => i !== index);
                                setCurrentTasks(newTasks.length === 0 ? [''] : newTasks);
                              }}
                            >
                              −
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <div className="task-actions-row">
                      <button
                        type="button"
                        className="btn-add-task"
                        onClick={() => setCurrentTasks([...currentTasks, ''])}
                      >
                        + Add Task
                      </button>
                      <div className="preset-tasks">
                        {pendingPreset ? (
                          <div className="preset-detail-input">
                            <span className="preset-label">{pendingPreset} -</span>
                            <input
                              type="text"
                              value={presetDetail}
                              onChange={(e) => setPresetDetail(e.target.value)}
                              placeholder="Project Name"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && presetDetail.trim()) {
                                  const fullTask = `${pendingPreset} - ${presetDetail.trim()}`;
                                  const emptyIdx = currentTasks.findIndex(t => !t.trim());
                                  if (emptyIdx >= 0) {
                                    const newTasks = [...currentTasks];
                                    newTasks[emptyIdx] = fullTask;
                                    setCurrentTasks(newTasks);
                                  } else {
                                    setCurrentTasks([...currentTasks, fullTask]);
                                  }
                                  setPendingPreset(null);
                                  setPresetDetail('');
                                } else if (e.key === 'Escape') {
                                  setPendingPreset(null);
                                  setPresetDetail('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn-preset-confirm"
                              onClick={() => {
                                if (presetDetail.trim()) {
                                  const fullTask = `${pendingPreset} - ${presetDetail.trim()}`;
                                  const emptyIdx = currentTasks.findIndex(t => !t.trim());
                                  if (emptyIdx >= 0) {
                                    const newTasks = [...currentTasks];
                                    newTasks[emptyIdx] = fullTask;
                                    setCurrentTasks(newTasks);
                                  } else {
                                    setCurrentTasks([...currentTasks, fullTask]);
                                  }
                                  setPendingPreset(null);
                                  setPresetDetail('');
                                }
                              }}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="btn-preset-cancel"
                              onClick={() => {
                                setPendingPreset(null);
                                setPresetDetail('');
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          PRESET_TASK_NAMES.map(preset => (
                            <button
                              key={preset}
                              type="button"
                              className="btn-preset-task"
                              onClick={() => {
                                setPendingPreset(preset);
                                setPresetDetail('');
                              }}
                            >
                              {preset}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="block-actions">
                    {!currentBlock.isBreak && (
                      <button type="button" className="btn-break" onClick={handleBreak}>
                        + Break
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-advance"
                      onClick={handleAdvanceBlock}
                      disabled={
                        !currentBlock.endTime ||
                        !currentTasks.some(t => t.trim()) ||
                        currentBlock.startTime === currentBlock.endTime ||
                        (calculateBlockHours(currentBlock.startTime, currentBlock.endTime) > 3)
                      }
                    >
                      Next Block →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Ready to start tracking</p>
                  <button type="button" className="btn-clock-in" onClick={handleClockIn}>
                    Clock In
                  </button>
                </div>
              )}
            </div>

            <div className="shift-summary">
              <div className="total-hours">
                <span>Total Hours:</span>
                <strong>{calculateTotalHours()}</strong>
              </div>
              <div className="shift-summary-actions">
                {(currentBlock || completedBlocks.length > 0) && (
                  <button
                    type="button"
                    className="btn-cancel-shift"
                    onClick={() => {
                      // Skip confirmation if no blocks saved yet
                      if (completedBlocks.length === 0) {
                        handleCancelShift();
                      } else {
                        setShowCancelShiftConfirm(true);
                      }
                    }}
                  >
                    Cancel Shift
                  </button>
                )}
                <button
                  type="button"
                  className={`btn-save ${hasGaps() ? 'has-gaps' : ''}`}
                  onClick={() => {
                    if (hasGaps()) {
                      setToast({ type: 'error', message: 'Please fill in the gaps between your time blocks before clocking out.' });
                      setTimeout(() => setToast(null), 4000);
                      // Trigger attention animation on gap widget
                      setGapAttentionPulse(true);
                      setTimeout(() => setGapAttentionPulse(false), 600);
                      return;
                    }
                    previewShift();
                  }}
                  disabled={(completedBlocks.length === 0 && !currentBlock) || saving}
                >
                  {saving ? 'Saving...' : 'Clock Out'}
                </button>
              </div>
            </div>
          </section>

          {/* Column 2 - Completed Blocks */}
          <section className="completed-column">
            <h2>Completed Blocks</h2>
            {completedBlocks.length === 0 ? (
              <div className="empty-completed">
                <p>Blocks will appear here as you complete them</p>
              </div>
            ) : (
              <div className={`completed-list ${completedBlocks.length >= 10 ? 'compact-mode' : ''}`}>
                {completedBlocks.map((block, index) => {
                  // Count only work blocks for numbering (include placeholders to keep numbers stable)
                  const workBlockNumber = completedBlocks
                    .slice(0, index + 1)
                    .filter(b => !b.isBreak).length;

                  // Slide-out animation classes
                  const isSlidingOut = slidingOutBlockId === block.id;
                  const isDeleting = deletingBlockId === block.id;
                  const isNewlyAdded = newlyAddedBlockId === block.id;

                  // Show placeholder for blocks being edited - same structure as real block for consistent height
                  if (block.isEditingPlaceholder) {
                    const taskCount = block.tasks ? block.tasks.split(' • ').length : 1;
                    return (
                      <div key={block.id} className={`completed-block editing-placeholder ${block.isBreak ? 'break-block' : ''}`}>
                        <div className="completed-block-row">
                          <span className="completed-number placeholder-fade">
                            {block.isBreak ? 'Break' : `#${workBlockNumber}`}
                          </span>
                          <span className="completed-time placeholder-fade">
                            {formatTime(block.startTime)} - {formatTime(block.endTime)}
                          </span>
                          <span className="completed-hours placeholder-fade">
                            {calculateBlockHours(block.startTime, block.endTime)}hr
                          </span>
                          <span className="placeholder-editing-badge">Editing...</span>
                        </div>
                        <div className={`completed-task ${taskCount > 1 ? 'multi-task' : ''}`}>
                          {block.tasks.split(' • ').map((task, i) => (
                            <div key={i} className="task-line placeholder-fade">{task}</div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // Gap widget placeholder - replaces deleted block in place, no movement
                  if (block.isGapWidgetPlaceholder) {
                    return (
                      <div key={block.id} className={`gap-widget-inline ${gapAttentionPulse ? 'attention-pulse' : ''}`}>
                        <button
                          type="button"
                          className="gap-fill-button"
                          onClick={handleGapPlusClick}
                          title={`Fill gap: ${formatTime(block.gapStartTime)} - ${formatTime(block.gapEndTime)}`}
                        >
                          <span className="gap-fill-plus">+</span>
                          <span className="gap-fill-time">{formatTime(block.gapStartTime)} - {formatTime(block.gapEndTime)}</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                  <React.Fragment key={block.id}>
                    <div
                      className={`completed-block ${block.isBreak ? 'break-block' : ''} ${isSlidingOut ? 'sliding-out' : ''} ${isDeleting ? 'deleting' : ''} ${isNewlyAdded ? 'swipe-in' : ''}`}
                    >
                      <div className="completed-block-row">
                        <span className="completed-number">
                          {block.isBreak ? 'Break' : `#${workBlockNumber}`}
                        </span>
                        <span className="completed-time">
                          {formatTime(block.startTime)} - {formatTime(block.endTime)}
                        </span>
                        <div className="completed-actions">
                          <button
                            type="button"
                            className={`btn-icon btn-edit-icon ${block.isBreak ? 'btn-extend-break' : ''}`}
                            onClick={() => handleEditBlock(block)}
                            disabled={editingBlock !== null || slidingOutBlockId !== null || deletingBlockId !== null}
                            title={block.isBreak ? 'Extend Break' : 'Edit'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-delete-icon"
                            onClick={() => {
                              setDeleteBlockTarget(block);
                              setShowDeleteBlockConfirm(true);
                            }}
                            disabled={slidingOutBlockId !== null || deletingBlockId !== null}
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                        <span className="completed-hours">
                          {calculateBlockHours(block.startTime, block.endTime)}hr
                        </span>
                      </div>
                      <div className={`completed-task ${block.tasks.split(' • ').length > 1 ? 'multi-task' : ''}`}>
                        {block.tasks.split(' • ').map((task, i) => (
                          <div key={i} className="task-line">{task}</div>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      ) : activeTab === 'history' ? (
        /* Shift History Tab - Grouped by Pay Week (Arizona Time) */
        <main className="history-tab">
          <section className="shift-history-full">
            <h2>
              Shift History
              <span className="info-tooltip-wrapper">
                <span className="info-icon-trigger">ⓘ</span>
                <span className="info-tooltip">Pay weeks are grouped by Arizona time (UTC-7) for consistency across all employees</span>
              </span>
            </h2>
            {myPayWeeksLoading ? (
              <p className="loading-text">Loading shifts...</p>
            ) : myPayWeeks.length === 0 ? (
              <p className="empty-text">No shifts recorded yet</p>
            ) : (
              <div className="history-weeks-list">
                {myPayWeeks.map((week) => {
                  const isWeekExpanded = expandedMyWeeks.has(week.weekStart);
                  return (
                    <div key={week.weekStart} className="history-week-group">
                      <div
                        className="week-header"
                        onClick={() => {
                          const newExpanded = new Set(expandedMyWeeks);
                          if (isWeekExpanded) {
                            newExpanded.delete(week.weekStart);
                          } else {
                            newExpanded.add(week.weekStart);
                          }
                          setExpandedMyWeeks(newExpanded);
                        }}
                      >
                        <span className="expand-icon">{isWeekExpanded ? '▼' : '▶'}</span>
                        <span className="week-display">{week.weekDisplay}</span>
                        <span className="week-hours">{week.totalHours} hrs</span>
                        <span className="week-shift-count">{week.shifts.length} shift{week.shifts.length !== 1 ? 's' : ''}</span>
                      </div>
                      {isWeekExpanded && (
                        <div className="week-shifts">
                          {week.shifts.map((shift) => {
                            const shiftId = shift._id || shift.id;
                            const isShiftExpanded = expandedShifts.has(shiftId);
                            const isInProgress = shift.status === 'in_progress' || shift.status === 'pending';
                            const statusDisplay = {
                              'in_progress': { label: 'In Progress', class: 'in-progress' },
                              'pending': { label: 'In Progress', class: 'in-progress' },
                              'pending_approval': { label: 'Pending', class: 'pending-approval' },
                              'rejected': { label: 'Rejected', class: 'rejected' },
                              'approved': { label: 'Approved', class: 'approved' },
                              'paid': { label: 'Paid', class: 'paid' },
                              'completed': { label: 'Completed', class: 'approved' }
                            }[shift.status] || { label: shift.status, class: shift.status };
                            return (
                              <div key={shiftId} className={`history-item ${isShiftExpanded ? 'expanded' : ''} ${isInProgress ? 'pending-shift' : ''}`}>
                                <div className="history-header">
                                  <div
                                    className="history-header-left"
                                    onClick={() => toggleShiftExpanded(shiftId)}
                                  >
                                    <span className="expand-icon">{isShiftExpanded ? '▼' : '▶'}</span>
                                    <span className={`status-badge ${statusDisplay.class}`}>{statusDisplay.label}</span>
                                    <span className="history-date">{formatDate(shift.date)}</span>
                                    <span className="history-times-inline">
                                      {formatTime(shift.clockInTime)} - {isInProgress ? 'Active' : formatTime(shift.clockOutTime)}
                                    </span>
                                  </div>
                                  <div className="history-header-right">
                                    {(shift.status === 'pending_approval' || shift.status === 'rejected') && (
                                      <button
                                        type="button"
                                        className="btn-edit-shift"
                                        title="Edit and resubmit"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEmployeeEditingShift({
                                            id: shiftId,
                                            date: shift.date,
                                            clockInTime: shift.clockInTime,
                                            clockOutTime: shift.clockOutTime,
                                            totalHours: shift.totalHours,
                                            timeBlocks: shift.timeBlocks || [],
                                            status: shift.status
                                          });
                                        }}
                                      >
                                        ✏️
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn-delete-shift"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Delete this shift?')) {
                                          shiftsAPI.delete(shiftId).then(() => {
                                            // Refresh pay weeks after deletion (reset to reload all)
                                            setMyPayWeeksOffset(0);
                                            loadMyPayWeeks(true);
                                          }).catch(err => alert('Failed to delete: ' + err.message));
                                        }
                                      }}
                                    >
                                      ×
                                    </button>
                                    <span className="history-hours">{isInProgress ? '--' : shift.totalHours} hrs</span>
                                  </div>
                                </div>
                                {isShiftExpanded && shift.timeBlocks && shift.timeBlocks.length > 0 && (
                                  <div className="history-tasks">
                                    {shift.timeBlocks.map((block, i) => (
                                      <div key={i} className={`history-task ${block.isBreak ? 'break-task' : ''}`}>
                                        <span className="task-time">
                                          {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                        </span>
                                        <span className="task-text">
                                          {block.tasks.split(' • ').map((task, j) => (
                                            <span key={j} className="task-line-inline">{task}</span>
                                          ))}
                                        </span>
                                        {calculateBlockHours(block.startTime, block.endTime) && (
                                          <span className="task-hours">{calculateBlockHours(block.startTime, block.endTime)}h</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Infinite Scroll Sentinel */}
                {myPayWeeksHasMore ? (
                  <div
                    className="infinite-scroll-sentinel"
                    ref={el => {
                      if (el && !myPayWeeksLoading) {
                        const observer = new IntersectionObserver(
                          (entries) => {
                            if (entries[0].isIntersecting && myPayWeeksHasMore && !myPayWeeksLoading) {
                              loadMyPayWeeks(false);
                            }
                          },
                          { threshold: 0.1 }
                        );
                        observer.observe(el);
                        return () => observer.disconnect();
                      }
                    }}
                    style={{ padding: '20px', textAlign: 'center' }}
                  >
                    {myPayWeeksLoading && (
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading more weeks...</span>
                    )}
                  </div>
                ) : myPayWeeks.length > 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    No more shifts to load
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      ) : (
        /* Admin Panel */
        <main className="admin-panel">
          {/* Admin Toast */}
          {adminToast && (
            <div className={`admin-toast ${adminToast.type}`}>
              {adminToast.message}
              <button onClick={() => setAdminToast(null)}>&times;</button>
            </div>
          )}

          {/* Activity Modal */}
          {showActivityModal && (
            <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
              <div className="preview-modal activity-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Activity Log</h2>
                  <button className="modal-close" onClick={() => setShowActivityModal(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  {activityLoading ? (
                    <p className="loading-text">Loading activity...</p>
                  ) : (
                    <div className="activity-list">
                      {activityData.activity?.map((activity, i) => {
                        const targetName = activity.target_name || 'Unknown';
                        const adminName = activity.admin_name || 'Admin';
                        const clockIn = activity.details?.clockIn ? formatTime(activity.details.clockIn) : null;
                        const clockOut = activity.details?.clockOut ? formatTime(activity.details.clockOut) : null;
                        const timeRange = clockIn && clockOut ? ` (${clockIn} - ${clockOut})` : '';

                        const formatAction = () => {
                          switch (activity.action) {
                            case 'shift_submitted':
                            case 'shift_created':
                              return activity.details?.selfService
                                ? <><strong>{targetName}</strong> submitted shift{timeRange}</>
                                : <><strong>{adminName}</strong> created shift for <strong>{targetName}</strong></>;
                            case 'shift_approved':
                              return <><strong>{adminName}</strong> approved <strong>{targetName}'s</strong> shift</>;
                            case 'shift_rejected':
                              return <><strong>{adminName}</strong> rejected <strong>{targetName}'s</strong> shift</>;
                            default:
                              return <><strong>{adminName}</strong> {activity.action.replace(/_/g, ' ')} <strong>{targetName}</strong></>;
                          }
                        };

                        return (
                          <div key={i} className="activity-item">
                            <span className="activity-description">{formatAction()}</span>
                            <span className="activity-time">{new Date(activity.created_at).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  {activityData.pagination?.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        disabled={activityData.pagination.page <= 1}
                        onClick={() => loadActivity(activityData.pagination.page - 1)}
                      >Prev</button>
                      <span>Page {activityData.pagination.page} of {activityData.pagination.totalPages}</span>
                      <button
                        disabled={activityData.pagination.page >= activityData.pagination.totalPages}
                        onClick={() => loadActivity(activityData.pagination.page + 1)}
                      >Next</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="modal-overlay" onClick={() => { setDeleteConfirm(null); setDeleteConfirmText(''); }}>
              <div className="preview-modal delete-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Confirm Delete</h2>
                  <button className="modal-close" onClick={() => { setDeleteConfirm(null); setDeleteConfirmText(''); }}>&times;</button>
                </div>
                <div className="modal-body">
                  <p className="delete-warning">This action cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="delete-confirm-input"
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel-modal" onClick={() => { setDeleteConfirm(null); setDeleteConfirmText(''); }}>Cancel</button>
                  <button
                    className="btn-delete-confirm"
                    disabled={deleteConfirmText !== 'DELETE'}
                    onClick={() => {
                      if (deleteConfirm.type === 'user') handleDeactivateUser(deleteConfirm.id);
                      else if (deleteConfirm.type === 'shift') handleDeleteShift(deleteConfirm.id);
                      else if (deleteConfirm.type === 'row') handleDeleteRow(deleteConfirm.table, deleteConfirm.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Batch Delete Confirmation Modal */}
          {showBatchDeleteConfirm && (
            <div className="modal-overlay" onClick={() => setShowBatchDeleteConfirm(false)}>
              <div className="preview-modal delete-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Delete {selectedShiftIds.size} Shifts</h2>
                  <button className="modal-close" onClick={() => setShowBatchDeleteConfirm(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <p className="delete-warning">
                    You are about to delete <strong>{selectedShiftIds.size}</strong> shifts. This action cannot be undone.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel-modal" onClick={() => setShowBatchDeleteConfirm(false)}>Cancel</button>
                  <button
                    className="btn-delete-confirm"
                    onClick={handleBatchDeleteShifts}
                  >
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div className="modal-overlay" onClick={() => setEditingUser(null)}>
              <div className="preview-modal edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit User</h2>
                  <button className="modal-close" onClick={() => setEditingUser(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-field">
                    <label>Name</label>
                    <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Email</label>
                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Role</label>
                    <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setResetPasswordUser(editingUser);
                      setEditingUser(null);
                    }}
                    style={{ background: '#e67e22', color: 'white' }}
                  >
                    Reset Password
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-cancel-modal" onClick={() => setEditingUser(null)}>Cancel</button>
                    <button className="btn-confirm-modal" onClick={() => handleUpdateUser(editingUser.id, editingUser)}>Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create User Modal */}
          {creatingUser && (
            <div className="modal-overlay" onClick={() => setCreatingUser(false)}>
              <div className="preview-modal edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Create User</h2>
                  <button className="modal-close" onClick={() => setCreatingUser(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-field">
                    <label>Name *</label>
                    <input type="text" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} placeholder="Full name" />
                  </div>
                  <div className="form-field">
                    <label>Email *</label>
                    <input type="email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} placeholder="email@example.com" />
                  </div>
                  <div className="form-field">
                    <label>Password *</label>
                    <input type="password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} placeholder="Min 6 characters" />
                  </div>
                  <div className="form-field">
                    <label>Role</label>
                    <select value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select value={newUserData.status} onChange={e => setNewUserData({...newUserData, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel-modal" onClick={() => { setCreatingUser(false); setNewUserData({ email: '', password: '', name: '', role: 'user', status: 'active' }); }}>Cancel</button>
                  <button className="btn-confirm-modal" onClick={handleCreateUser}>Create User</button>
                </div>
              </div>
            </div>
          )}

          {/* Create Shift Modal */}
          {creatingShift && (
            <div className="modal-overlay" onClick={() => setCreatingShift(false)}>
              <div className="preview-modal edit-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                <div className="modal-header">
                  <h2>Create Shift</h2>
                  <button className="modal-close" onClick={() => setCreatingShift(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-field">
                    <label>Employee *</label>
                    <select
                      value={newShiftData.userId}
                      onChange={e => setNewShiftData({...newShiftData, userId: e.target.value})}
                    >
                      <option value="">Select User</option>
                      {adminUsers.filter(u => u.status === 'active').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={newShiftData.date}
                      onChange={e => setNewShiftData({...newShiftData, date: e.target.value})}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-field">
                      <label>Clock In *</label>
                      <input
                        type="time"
                        value={newShiftData.clockInTime}
                        onChange={e => setNewShiftData({...newShiftData, clockInTime: e.target.value})}
                      />
                    </div>
                    <div className="form-field">
                      <label>Clock Out</label>
                      <input
                        type="time"
                        value={newShiftData.clockOutTime}
                        onChange={e => setNewShiftData({...newShiftData, clockOutTime: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#2c3e50' }}>Time Blocks</h4>
                      <button
                        type="button"
                        onClick={addNewShiftBlock}
                        style={{ background: '#9b59b6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        + Add Block
                      </button>
                    </div>

                    {newShiftData.timeBlocks.map((block, idx) => (
                      <div
                        key={block.id}
                        style={{
                          background: block.isBreak ? '#fef9e7' : '#f8f9fa',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '8px',
                          borderLeft: `3px solid ${block.isBreak ? '#f39c12' : '#9b59b6'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Block {idx + 1}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#666' }}>
                              <input
                                type="checkbox"
                                checked={block.isBreak}
                                onChange={e => updateNewShiftBlock(block.id, 'isBreak', e.target.checked)}
                              />
                              Break
                            </label>
                            {newShiftData.timeBlocks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeNewShiftBlock(block.id)}
                                style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="time"
                            value={block.startTime}
                            onChange={e => updateNewShiftBlock(block.id, 'startTime', e.target.value)}
                            placeholder="Start Time"
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                          />
                          <input
                            type="time"
                            value={block.endTime}
                            onChange={e => updateNewShiftBlock(block.id, 'endTime', e.target.value)}
                            placeholder="End Time"
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                          />
                        </div>
                        {!block.isBreak && (
                          <textarea
                            value={block.tasks}
                            onChange={e => updateNewShiftBlock(block.id, 'tasks', e.target.value)}
                            placeholder="Tasks performed during this time block..."
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical', minHeight: '60px', fontSize: '0.9rem' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel-modal" onClick={() => {
                    setCreatingShift(false);
                    setNewShiftData({
                      userId: '',
                      date: new Date().toISOString().split('T')[0],
                      clockInTime: '08:00',
                      clockOutTime: '17:00',
                      timeBlocks: [{ id: Date.now(), startTime: '08:00', endTime: '17:00', tasks: '', isBreak: false }]
                    });
                  }}>Cancel</button>
                  <button
                    className="btn-confirm-modal"
                    onClick={handleCreateShift}
                    disabled={savingShift}
                  >
                    {savingShift ? 'Creating...' : 'Create Shift'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Shift Modal */}
          {editingShift && (
            <div className="modal-overlay" onClick={() => setEditingShift(null)}>
              <div className="preview-modal edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Shift</h2>
                  <button className="modal-close" onClick={() => setEditingShift(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-field">
                    <label>Date</label>
                    <input type="date" value={editingShift.date?.split('T')[0] || editingShift.date} onChange={e => setEditingShift({...editingShift, date: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Clock In</label>
                    <input type="time" value={editingShift.clock_in_time?.substring(0,5) || ''} onChange={e => setEditingShift({...editingShift, clockInTime: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Clock Out</label>
                    <input type="time" value={editingShift.clock_out_time?.substring(0,5) || ''} onChange={e => setEditingShift({...editingShift, clockOutTime: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>Total Hours</label>
                    <input type="number" step="0.01" value={editingShift.total_hours || ''} onChange={e => setEditingShift({...editingShift, totalHours: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel-modal" onClick={() => setEditingShift(null)}>Cancel</button>
                  <button className="btn-confirm-modal" onClick={() => handleUpdateShift(editingShift.id, editingShift)}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Row Modal */}
          {editingRow && (
            <div className="modal-overlay" onClick={() => setEditingRow(null)}>
              <div className="preview-modal edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Row</h2>
                  <button className="modal-close" onClick={() => setEditingRow(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  {tableData.schema?.filter(col => !col.isProtected && !col.isRedacted).map(col => (
                    <div key={col.column_name} className="form-field">
                      <label>{col.column_name}</label>
                      <input
                        type={col.data_type.includes('int') ? 'number' : 'text'}
                        value={editingRow[col.column_name] ?? ''}
                        onChange={e => setEditingRow({...editingRow, [col.column_name]: e.target.value})}
                      />
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel-modal" onClick={() => setEditingRow(null)}>Cancel</button>
                  <button className="btn-confirm-modal" onClick={() => handleUpdateRow(selectedTable, editingRow.id, editingRow)}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Layout with Sidebar */}
          <div className="admin-layout">
            {/* Sidebar Navigation */}
            <aside className="admin-sidebar">
              <nav className="admin-nav">
                <button className={`admin-nav-item ${adminSubTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setViewingShift(null); setViewingUserPayWeeks(null); setUserPayWeeksData(null); setAdminSubTab('dashboard'); }}>
                  <span className="nav-icon">📊</span>
                  <span className="nav-label">Dashboard</span>
                </button>
                <button className={`admin-nav-item ${adminSubTab === 'pending' ? 'active' : ''}`} onClick={() => { setViewingShift(null); setViewingUserPayWeeks(null); setUserPayWeeksData(null); setAdminSubTab('pending'); loadPendingShifts(); }}>
                  <span className="nav-icon">⏳</span>
                  <span className="nav-label">Pending Approval</span>
                  {pendingCount > 0 && (
                    <span className="nav-badge">{pendingCount}</span>
                  )}
                </button>
                <button className={`admin-nav-item ${adminSubTab === 'weekly' ? 'active' : ''}`} onClick={() => { setViewingShift(null); setViewingUserPayWeeks(null); setUserPayWeeksData(null); setAdminSubTab('weekly'); loadWeeklyView(); }}>
                  <span className="nav-icon">📅</span>
                  <span className="nav-label">Weekly View</span>
                </button>
                <button className={`admin-nav-item ${adminSubTab === 'users' ? 'active' : ''}`} onClick={() => { setViewingShift(null); setViewingUserPayWeeks(null); setUserPayWeeksData(null); setAdminSubTab('users'); }}>
                  <span className="nav-icon">👥</span>
                  <span className="nav-label">Employees</span>
                </button>
                <button className={`admin-nav-item ${adminSubTab === 'shifts' ? 'active' : ''}`} onClick={() => { setViewingShift(null); setViewingUserPayWeeks(null); setUserPayWeeksData(null); setAdminSubTab('shifts'); }}>
                  <span className="nav-icon">🕐</span>
                  <span className="nav-label">All Shifts</span>
                </button>
              </nav>
            </aside>

            {/* Main Content Area */}
            <div className="admin-main">

          {/* Shift Details View - Top Level (accessible from anywhere) */}
          {viewingShift ? (
            <div className="admin-content shift-detail-page">
              <div className="breadcrumb-nav">
                <button className="breadcrumb-link" onClick={() => setViewingShift(null)}>
                  ← Back
                </button>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">Shift #{viewingShift.id}</span>
              </div>

              <div className="shift-detail-two-column">
              {/* Column 1: Shift Details */}
              <div className="shift-detail-card">
                <div className="shift-detail-card-header">
                  <h2>Shift Details</h2>
                  <div className="shift-detail-actions">
                    <button className="btn-icon" title="Edit" onClick={() => { setEditingShift({...viewingShift}); }}>✏️</button>
                    <button className="btn-icon danger" title="Delete" onClick={() => setDeleteConfirm({ type: 'shift', id: viewingShift.id })}>🗑️</button>
                  </div>
                </div>

                <div className="shift-details-list">
                  <div className="detail-row clickable" onClick={() => loadUserPayWeeks(viewingShift.user_id)}>
                    <span className="detail-label">Employee</span>
                    <span className="detail-value link">{viewingShift.user_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{viewingShift.user_email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{formatDate(viewingShift.date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Clock In</span>
                    <span className="detail-value">{formatTime(viewingShift.clock_in_time)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Clock Out</span>
                    <span className="detail-value">{formatTime(viewingShift.clock_out_time) || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Hours</span>
                    <span className="detail-value highlight">{viewingShift.total_hours || '0'} hrs</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Break Time</span>
                    <span className="detail-value">
                      {(() => {
                        const breakHours = (viewingShift.timeBlocks || [])
                          .filter(b => b.isBreak || b.is_break)
                          .reduce((sum, b) => {
                            const hrs = calculateBlockHours(b.startTime || b.start_time, b.endTime || b.end_time);
                            return sum + (parseFloat(hrs) || 0);
                          }, 0);
                        return breakHours > 0 ? `${breakHours.toFixed(2)} hrs` : '0 hrs';
                      })()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${viewingShift.status}`}>{viewingShift.status?.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Approve/Reject buttons for pending shifts */}
                {viewingShift.status === 'pending_approval' && (
                  <div className="shift-approval-actions">
                    <button className="btn-approve-large" onClick={() => {
                      handleApproveShift(viewingShift.id);
                    }}>
                      ✓ Approve Shift
                    </button>
                    <button className="btn-reject-large" onClick={() => {
                      setRejectModalShift(viewingShift);
                      setRejectReason('');
                    }}>
                      ✕ Reject Shift
                    </button>
                  </div>
                )}
                {viewingShift.status === 'approved' && (
                  <div className="shift-approval-actions">
                    <button className="btn-revert-large" onClick={() => {
                      handleRevertToPending(viewingShift.id);
                    }}>
                      ↩ Revert to Pending
                    </button>
                  </div>
                )}
              </div>

              {/* Column 2: Time Blocks */}
              <div className="time-blocks-card">
                <h3>Time Blocks ({viewingShift.timeBlocks?.length || 0})</h3>
                {viewingShift.timeBlocks && viewingShift.timeBlocks.length > 0 ? (
                  <div className="time-blocks-stack">
                    {viewingShift.timeBlocks.map((block, idx) => {
                      const blockKey = block.id || idx;
                      const isExpanded = expandedTaskBlocks.has(blockKey);
                      const taskItems = block.tasks
                        ? block.tasks.split(/\s*[•·]\s*/).filter(t => t.trim())
                        : [];
                      const totalLength = block.tasks?.length || 0;
                      const needsExpansion = totalLength > 500;

                      return (
                        <div key={blockKey} className={`time-block-row ${block.is_break ? 'break' : ''}`}>
                          <span className="block-time-col">{formatTime(block.start_time)} → {formatTime(block.end_time) || '...'}</span>
                          {block.is_break ? (
                            <span className="block-task-col break-text">Break</span>
                          ) : (
                            <div className="block-task-col">
                              {taskItems.length > 0 ? (
                                <>
                                  <ul className={`task-list ${needsExpansion && !isExpanded ? 'collapsed' : ''}`}>
                                    {taskItems.map((task, taskIdx) => (
                                      <li key={taskIdx}>
                                        <span className="task-content">{task}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {needsExpansion && (
                                    <button
                                      className="see-more-btn"
                                      onClick={() => {
                                        setExpandedTaskBlocks(prev => {
                                          const next = new Set(prev);
                                          if (next.has(blockKey)) {
                                            next.delete(blockKey);
                                          } else {
                                            next.add(blockKey);
                                          }
                                          return next;
                                        });
                                      }}
                                    >
                                      {isExpanded ? 'Show less' : 'Show more...'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span>-</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-time-blocks">No time blocks recorded for this shift</p>
                )}
              </div>
            </div>
            </div>
          ) : viewingUserPayWeeks ? (
            <div className="admin-content">
              <div className="user-pay-weeks-view">
                <button className="btn-back" onClick={() => { setViewingUserPayWeeks(null); setUserPayWeeksData(null); }}>
                  ← Back
                </button>
                {userPayWeeksLoading ? (
                  <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <p>Loading user details...</p>
                  </div>
                ) : userPayWeeksData ? (
                  <div className="user-details-layout">
                    {/* Left Column - User Info */}
                    <div className="user-info-column">
                      <div className="user-info-card">
                        <div className="user-avatar" style={{ background: getAvatarGradient(userPayWeeksData.user.name) }}>
                          {userPayWeeksData.user.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="user-name">{userPayWeeksData.user.name}</h2>
                        <p className="user-email">{userPayWeeksData.user.email}</p>
                        <div className="user-stats">
                          <div className="user-stat">
                            <span className="stat-number">
                              {formatHours(userPayWeeksData.payWeeks.reduce((sum, w) => sum + w.approvedHours, 0))}
                            </span>
                            <span className="stat-label">Total Hours</span>
                          </div>
                          <div className="user-stat">
                            <span className="stat-number">
                              {userPayWeeksData.payWeeks.reduce((sum, w) => sum + w.shifts.length, 0)}
                            </span>
                            <span className="stat-label">Total Shifts</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Shifts List */}
                    <div className="user-shifts-column">
                      <h3 className="shifts-column-header">Pay Weeks</h3>
                      <div className="pay-weeks-list">
                        {userPayWeeksData.payWeeks.map((week, idx) => {
                          const isExpanded = expandedPayWeeks.has(week.weekStart);
                          return (
                            <div key={week.weekStart} className="pay-week-card">
                              <div
                                className="pay-week-header"
                                onClick={() => {
                                  const newSet = new Set(expandedPayWeeks);
                                  if (isExpanded) {
                                    newSet.delete(week.weekStart);
                                  } else {
                                    newSet.add(week.weekStart);
                                  }
                                  setExpandedPayWeeks(newSet);
                                }}
                              >
                                <span className="week-dates">{week.weekDisplay}</span>
                                <span className="week-hours">{week.approvedHours} hrs approved</span>
                                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                              </div>
                              {isExpanded && (
                                <div className="pay-week-shifts">
                                  {week.shifts.map(shift => (
                                    <div
                                      key={shift.id}
                                      className="pay-week-shift-row clickable"
                                      onClick={() => viewShiftDetails(shift.id)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <span className="shift-date">{new Date(shift.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                      <span className="shift-times">{formatTime(shift.clockInTime)} - {formatTime(shift.clockOutTime)}</span>
                                      <span className="shift-hours">{shift.totalHours} hrs</span>
                                      <span className={`status-badge ${shift.status}`}>{shift.status.replace('_', ' ')}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
          <>
          {/* Dashboard Sub-Tab */}
          {adminSubTab === 'dashboard' && (
            <div className="admin-content">
              {adminLoading ? (
                <p className="loading-text">Loading dashboard...</p>
              ) : dashboardData ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{formatHours(dashboardData.hoursToday || 0)}</div>
                      <div className="stat-label">Hours Today</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{formatHours(dashboardData.hoursThisWeek || 0)}</div>
                      <div className="stat-label">Hours This Week</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{formatHours(dashboardData.hoursThisMonth || 0)}</div>
                      <div className="stat-label">Hours This Month</div>
                    </div>
                  </div>

                  <div className="dashboard-sections">
                    <div className="dashboard-section leaderboard-section">
                      {/* Week Navigation Header */}
                      <div className="leaderboard-week-nav">
                        {(() => {
                          // Check if we can go to previous week (has data)
                          const hasPrevWeek = dashboardWeekStart && dashboardAvailableWeeks.some(w => w.weekStart < dashboardWeekStart);
                          return hasPrevWeek ? (
                            <button
                              className="btn-leaderboard-arrow"
                              onClick={() => {
                                if (!dashboardWeekStart) return;
                                setDashboardSlideDirection('right');
                                const current = new Date(dashboardWeekStart + 'T12:00:00');
                                current.setDate(current.getDate() - 7);
                                const prevWeek = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                                loadDashboardLeaderboard(prevWeek);
                                setTimeout(() => setDashboardSlideDirection(null), 300);
                              }}
                              title="Previous week"
                            >
                              ◀
                            </button>
                          ) : <span className="btn-leaderboard-arrow-placeholder" />;
                        })()}
                        <h3 className="week-range">{dashboardLeaderboard?.weekDisplay || (() => {
                          const today = new Date();
                          const day = today.getDay();
                          const weekStart = new Date(today);
                          weekStart.setDate(today.getDate() - day);
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);
                          const formatD = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return `${formatD(weekStart)} - ${formatD(weekEnd)}`;
                        })()}</h3>
                        {(() => {
                          // Check if we can go to next week (not past current week)
                          const today = new Date();
                          const dayOfWeek = today.getDay();
                          const thisWeekSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek, 12, 0, 0);
                          const thisWeekStart = `${thisWeekSunday.getFullYear()}-${String(thisWeekSunday.getMonth() + 1).padStart(2, '0')}-${String(thisWeekSunday.getDate()).padStart(2, '0')}`;
                          const canGoNext = dashboardWeekStart && dashboardWeekStart < thisWeekStart;
                          return canGoNext ? (
                            <button
                              className="btn-leaderboard-arrow"
                              onClick={() => {
                                if (!dashboardWeekStart) return;
                                setDashboardSlideDirection('left');
                                const current = new Date(dashboardWeekStart + 'T12:00:00');
                                current.setDate(current.getDate() + 7);
                                const nextWeek = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                                loadDashboardLeaderboard(nextWeek <= thisWeekStart ? nextWeek : thisWeekStart);
                                setTimeout(() => setDashboardSlideDirection(null), 300);
                              }}
                              title="Next week"
                            >
                              ▶
                            </button>
                          ) : <span className="btn-leaderboard-arrow-placeholder" />;
                        })()}
                      </div>
                      {/* Leaderboard List with Slide Animation */}
                      <div className={`top-employees-list ${dashboardSlideDirection ? `slide-${dashboardSlideDirection}` : ''}`}>
                        {(dashboardLeaderboard?.employees || dashboardData.topEmployees)?.slice(0, 5).map((emp, i) => (
                          <div key={emp.userId || emp.id} className="top-employee" onClick={() => loadUserPayWeeks(emp.userId || emp.id)} style={{ cursor: 'pointer' }}>
                            <span className="rank">#{i + 1}</span>
                            <span className="name">{emp.userName || emp.name}</span>
                            <span className="hours">{formatHours(emp.totalHours || emp.hours || 0)} hrs</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="section-header-row">
                        <h3>Recent Activity</h3>
                        <span
                          className="view-more-link"
                          onClick={() => setAdminSubTab('activity')}
                        >
                          View More
                        </span>
                      </div>
                      <div className="activity-list">
                        {(() => {
                          // Consolidate shift activities for Recent Activity widget
                          // Uses shift_status from backend to determine if shift is approved
                          const activities = dashboardData.recentActivity || [];

                          // Filter: only show submissions (not approvals), dedupe by shift
                          const consolidated = [];
                          const seenShiftIds = new Set();

                          for (const activity of activities) {
                            // Skip approval/rejection entries - we use shift_status instead
                            if (activity.action === 'shift_approved' || activity.action === 'shift_rejected') continue;

                            // For shift submissions, check shift's current status
                            if ((activity.action === 'shift_submitted' || activity.action === 'shift_created') && activity.target_id) {
                              const shiftIdKey = String(activity.target_id);
                              if (seenShiftIds.has(shiftIdKey)) continue;
                              seenShiftIds.add(shiftIdKey);

                              // Use the actual shift status from the database
                              const isApproved = activity.shift_status === 'approved' || activity.shift_status === 'paid';
                              const isRejected = activity.shift_status === 'rejected';
                              consolidated.push({
                                ...activity,
                                isApproved,
                                isRejected,
                                approvalTime: activity.approval_timestamp,
                                rejectionTime: activity.rejection_timestamp
                              });
                            } else {
                              // Non-shift activities pass through unchanged
                              consolidated.push(activity);
                            }
                          }

                          // Format timestamp without seconds
                          const formatActivityTime = (raw) => {
                            if (!raw) return '';
                            const match = String(raw).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
                            if (match) {
                              const utc = Date.UTC(
                                parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]),
                                parseInt(match[4]), parseInt(match[5]), parseInt(match[6])
                              );
                              const d = new Date(utc);
                              return d.toLocaleString('en-US', {
                                month: 'numeric',
                                day: 'numeric',
                                year: '2-digit',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              });
                            }
                            return new Date(raw).toLocaleString();
                          };

                          return consolidated.slice(0, 10).map((activity, i) => {
                            const targetName = activity.target_name || 'Unknown';
                            const adminName = activity.admin_name || 'Admin';

                            // Determine activity status class
                            const getActivityClass = () => {
                              if (activity.isApproved) return 'activity-approved';
                              if (activity.isRejected) return 'activity-rejected';
                              if (activity.action === 'shift_submitted' || activity.action === 'shift_created') {
                                return 'activity-pending';
                              }
                              return '';
                            };

                            const formatAction = () => {
                              // Format clock times with date included
                              const shiftDate = activity.details?.date;
                              const clockIn = activity.details?.clockIn ? formatTime(activity.details.clockIn) : null;
                              const clockOut = activity.details?.clockOut ? formatTime(activity.details.clockOut) : null;

                              // Build time range with date: "(1/29/26 8:20 PM - 8:50 PM)"
                              let timeRange = '';
                              if (clockIn && clockOut && shiftDate) {
                                const dateStr = String(shiftDate);
                                const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                                const d = new Date(dateOnly + 'T12:00:00');
                                const formattedDate = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
                                timeRange = ` (${formattedDate} ${clockIn} - ${clockOut})`;
                              } else if (clockIn && clockOut) {
                                timeRange = ` (${clockIn} - ${clockOut})`;
                              }

                              switch (activity.action) {
                                case 'user_created':
                                  return <><strong>{adminName}</strong> added new employee <strong>{targetName}</strong></>;
                                case 'user_updated':
                                  return <><strong>{adminName}</strong> updated <strong>{targetName}</strong></>;
                                case 'user_deactivated':
                                  return <><strong>{adminName}</strong> deactivated <strong>{targetName}</strong></>;
                                case 'user_activated':
                                  return <><strong>{adminName}</strong> reactivated <strong>{targetName}</strong></>;
                                case 'user_password_reset':
                                  return <><strong>{adminName}</strong> reset password for <strong>{targetName}</strong></>;
                                case 'shift_submitted':
                                case 'shift_created':
                                  const isSubmit = activity.action === 'shift_submitted' || activity.details?.selfService;
                                  return (
                                    <>
                                      {isSubmit
                                        ? <><strong>{targetName}</strong> submitted shift{timeRange}</>
                                        : <><strong>{adminName}</strong> created shift for <strong>{targetName}</strong>{timeRange}</>
                                      }
                                      {activity.isApproved && (
                                        <span className="approval-timestamp">
                                          Approved {activity.approvalTime ? formatActivityTime(activity.approvalTime) : ''}
                                        </span>
                                      )}
                                      {activity.isRejected && (
                                        <span className="rejection-timestamp">
                                          Rejected {activity.rejectionTime ? formatActivityTime(activity.rejectionTime) : ''}
                                        </span>
                                      )}
                                    </>
                                  );
                                case 'shift_rejected':
                                  return <><strong>{adminName}</strong> rejected <strong>{targetName}'s</strong> shift</>;
                                case 'shift_updated':
                                  return <><strong>{adminName}</strong> edited <strong>{targetName}'s</strong> shift</>;
                                case 'shift_deleted':
                                  return <><strong>{adminName}</strong> deleted <strong>{targetName}'s</strong> shift</>;
                                case 'shift_marked_paid':
                                  return <><strong>{adminName}</strong> marked <strong>{targetName}'s</strong> shift as paid</>;
                                default:
                                  return <><strong>{adminName}</strong> {activity.action.replace(/_/g, ' ')} <strong>{targetName}</strong></>;
                              }
                            };

                            // Check if this activity links to a shift
                            const isShiftActivity = activity.target_type === 'shift' && activity.target_id && activity.action !== 'shift_deleted';

                            const handleActivityClick = () => {
                              if (isShiftActivity) {
                                viewShiftDetails(activity.target_id);
                              }
                            };

                            return (
                              <div
                                key={i}
                                className={`activity-item ${getActivityClass()} ${isShiftActivity ? 'clickable' : ''}`}
                                onClick={handleActivityClick}
                                style={isShiftActivity ? { cursor: 'pointer' } : {}}
                              >
                                <span className="activity-description">{formatAction()}</span>
                                <span className="activity-time">{formatActivityTime(activity.created_at)}</span>
                              </div>
                            );
                          });
                        })()}
                        {(!dashboardData.recentActivity || dashboardData.recentActivity.length === 0) && (
                          <p className="empty-text">No recent admin activity</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button className="btn-confirm-modal" onClick={loadDashboard}>Load Dashboard</button>
              )}
            </div>
          )}

          {/* Users Sub-Tab */}
          {adminSubTab === 'users' && (
            <div className="admin-content">
              <div className="admin-header-bar">
                <button className="btn-create" onClick={() => setCreatingUser(true)}>+ Create User</button>
              </div>
              {adminUsersLoading ? (
                <p className="loading-text">Loading users...</p>
              ) : (
                <>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map(u => (
                          <tr
                            key={u.id}
                            className={`clickable-row ${u.status === 'inactive' ? 'inactive-row' : ''}`}
                            onClick={() => loadUserPayWeeks(u.id)}
                          >
                            <td>{u.id}</td>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                            <td><span className={`status-badge ${u.status}`}>{u.status}</span></td>
                            <td>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="action-cell" onClick={e => e.stopPropagation()}>
                              <button className="btn-icon" onClick={() => setEditingUser({...u})} title="Edit user">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              {u.id !== user.id && (
                                <button className="btn-icon danger" onClick={() => setDeleteConfirm({ type: 'user', id: u.id })} title="Deactivate user">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {adminUsersPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button disabled={adminUsersPagination.page <= 1} onClick={() => loadAdminUsers(adminUsersPagination.page - 1)}>Prev</button>
                      <span>Page {adminUsersPagination.page} of {adminUsersPagination.totalPages}</span>
                      <button disabled={adminUsersPagination.page >= adminUsersPagination.totalPages} onClick={() => loadAdminUsers(adminUsersPagination.page + 1)}>Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Shifts Sub-Tab */}
          {adminSubTab === 'shifts' && (
              <div className="admin-content shifts-by-week">
                <div className="shifts-header-bar">
                  <h2>All Shifts</h2>
                  <button className="btn-create" onClick={() => { if (adminUsers.length === 0) loadAdminUsers(); setCreatingShift(true); }}>+ Create Shift</button>
                </div>

                {/* Filter Pills */}
                <div className="shifts-filters">
                  <div className="filter-group">
                    <span className="filter-label">Employee:</span>
                    <div className="filter-pills">
                      <button
                        className={`filter-pill ${shiftsEmployeeFilter === '' ? 'active' : ''}`}
                        onClick={() => setShiftsEmployeeFilter('')}
                      >
                        All
                      </button>
                      {/* Use adminUsers for employee filter list */}
                      {adminUsers.filter(u => u.role === 'user').map(emp => (
                        <button
                          key={emp.id}
                          className={`filter-pill ${shiftsEmployeeFilter === String(emp.id) ? 'active' : ''}`}
                          onClick={() => setShiftsEmployeeFilter(String(emp.id))}
                        >
                          {emp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-group">
                    <span className="filter-label">Status:</span>
                    <div className="filter-pills">
                      <button
                        className={`filter-pill ${shiftsStatusFilter === '' ? 'active' : ''}`}
                        onClick={() => setShiftsStatusFilter('')}
                      >
                        All
                      </button>
                      {['pending_approval', 'approved', 'paid', 'rejected'].map(status => (
                        <button
                          key={status}
                          className={`filter-pill status-${status} ${shiftsStatusFilter === status ? 'active' : ''}`}
                          onClick={() => setShiftsStatusFilter(status)}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {shiftsWeeksLoading && shiftsWeeks.length === 0 ? (
                  <p className="loading-text">Loading shifts...</p>
                ) : shiftsWeeks.length === 0 ? (
                  <div className="empty-state">
                    <p>No shifts found</p>
                  </div>
                ) : (
                  <div className="weeks-list">
                    {shiftsWeeks.map((week, weekIdx) => {
                      // Filter shifts by status if filter is set
                      const filteredShifts = shiftsStatusFilter
                        ? (week.shifts || []).filter(s => s.status === shiftsStatusFilter)
                        : (week.shifts || []);
                      if (filteredShifts.length === 0) return null;
                      return (
                      <div key={week.weekStart} className="week-section">
                        <div className="week-header centered">
                          <h3>{week.weekDisplay}</h3>
                          <button
                            className="btn-select-mode"
                            onClick={() => {
                              if (shiftsSelectMode) {
                                setShiftsSelectMode(false);
                                setSelectedShiftIds(new Set());
                                setBatchActionDropdown(false);
                              } else {
                                setShiftsSelectMode(true);
                              }
                            }}
                          >
                            {shiftsSelectMode ? 'Cancel' : 'Select'}
                          </button>
                        </div>
                        {/* Batch action bar when in select mode */}
                        {shiftsSelectMode && selectedShiftIds.size > 0 && (
                          <div className="batch-action-bar">
                            <span className="selected-count">{selectedShiftIds.size} selected</span>
                            <button className="btn-batch-paid" onClick={handleBatchMarkPaid}>
                              Mark as Paid
                            </button>
                            <div className="batch-dropdown-container">
                              <button
                                className="btn-batch-more"
                                onClick={() => setBatchActionDropdown(!batchActionDropdown)}
                              >
                                More ▾
                              </button>
                              {batchActionDropdown && (
                                <div className="batch-dropdown">
                                  <button
                                    className="batch-dropdown-item danger"
                                    onClick={() => setShowBatchDeleteConfirm(true)}
                                  >
                                    Delete Selected
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="week-shifts-table">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th className="checkbox-col"></th>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Hours</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredShifts.map(s => (
                                <tr
                                  key={s.id}
                                  className={`clickable-row ${selectedShiftIds.has(s.id) ? 'selected-row' : ''}`}
                                  onClick={() => shiftsSelectMode ? toggleShiftSelection(s.id) : viewShiftDetails(s.id)}
                                >
                                  <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                                    {shiftsSelectMode && (
                                      <input
                                        type="checkbox"
                                        checked={selectedShiftIds.has(s.id)}
                                        onChange={() => toggleShiftSelection(s.id)}
                                      />
                                    )}
                                  </td>
                                  <td>{s.userName || s.user_name}</td>
                                  <td>{formatDate(s.date)}</td>
                                  <td>{formatTime(s.clock_in_time)}</td>
                                  <td>{formatTime(s.clock_out_time)}</td>
                                  <td>{s.total_hours}</td>
                                  <td className="status-cell" onClick={e => e.stopPropagation()}>
                                    {['approved', 'pending_approval', 'paid'].includes(s.status) ? (
                                      <div className="status-dropdown-container">
                                        <button
                                          className={`status-badge clickable ${s.status}`}
                                          onClick={() => setStatusDropdownShiftId(statusDropdownShiftId === s.id ? null : s.id)}
                                        >
                                          {s.status.replace('_', ' ')} <span className="status-arrow">▾</span>
                                        </button>
                                        {statusDropdownShiftId === s.id && (
                                          <div className="status-dropdown">
                                            {s.status === 'approved' && (
                                              <button
                                                className="status-dropdown-item paid"
                                                onClick={() => handleQuickStatusChange(s.id, 'paid', 'approved')}
                                              >
                                                Mark as Paid
                                              </button>
                                            )}
                                            {s.status === 'paid' && (
                                              <button
                                                className="status-dropdown-item approved"
                                                onClick={() => handleQuickStatusChange(s.id, 'approved', 'paid')}
                                              >
                                                Revert to Approved
                                              </button>
                                            )}
                                            {s.status === 'pending_approval' && (
                                              <>
                                                <button
                                                  className="status-dropdown-item approved"
                                                  onClick={() => handleQuickStatusChange(s.id, 'approved', 'pending_approval')}
                                                >
                                                  Approve
                                                </button>
                                                <button
                                                  className="status-dropdown-item danger"
                                                  onClick={() => handleQuickDelete(s.id)}
                                                >
                                                  Delete
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={`status-badge ${s.status}`}>{s.status.replace('_', ' ')}</span>
                                    )}
                                  </td>
                                  <td className="action-cell" onClick={e => e.stopPropagation()}>
                                    <button className="btn-icon" title="Edit" onClick={() => setEditingShift({...s})}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                      </svg>
                                    </button>
                                    <button className="btn-icon danger" title="Delete" onClick={() => setDeleteConfirm({ type: 'shift', id: s.id })}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      );
                    })}
                    {/* Infinite scroll sentinel - only show when more data available */}
                    {shiftsWeeksHasMore && (
                      <div
                        className="infinite-scroll-sentinel"
                        ref={shiftsScrollRef}
                      >
                        {shiftsWeeksLoading && <div className="loading-spinner"></div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
          )}

          {/* Pending Approval Sub-Tab */}
          {adminSubTab === 'pending' && (
            <div className="admin-content pending-approval-layout">
              <div className="pending-section">
              <div className="pending-header">
                <h3>Shifts Pending Approval</h3>
                {selectedPendingShifts.size > 0 && (
                  <button className="btn-batch-approve" onClick={handleBatchApprove}>
                    Approve Selected ({selectedPendingShifts.size})
                  </button>
                )}
              </div>

              {pendingShiftsLoading && pendingShifts.length === 0 ? (
                <p className="loading-text">Loading pending shifts...</p>
              ) : pendingShifts.length === 0 && !pendingShiftsLoading ? (
                <div className="empty-state">
                  <p>No shifts pending approval</p>
                </div>
              ) : (
                <div className="pending-shifts-list">
                  {pendingShifts.map(shift => (
                    <div key={shift.id} className="pending-shift-card" onClick={() => viewShiftDetails(shift.id)}>
                      <div className="pending-shift-header">
                        <div className="pending-shift-top-row">
                          <label className="checkbox-label" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedPendingShifts.has(shift.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedPendingShifts);
                                if (e.target.checked) {
                                  newSet.add(shift.id);
                                } else {
                                  newSet.delete(shift.id);
                                }
                                setSelectedPendingShifts(newSet);
                              }}
                            />
                          </label>
                          <span className="pending-shift-name">{shift.user_name}</span>
                          <span className="pending-shift-date">{new Date(shift.date + 'T00:00:00').toLocaleDateString()}</span>
                        </div>
                        <div className="pending-shift-times">
                          <span>{formatTime(shift.clockInTime || shift.clock_in_time)} - {formatTime(shift.clockOutTime || shift.clock_out_time)}</span>
                          <span className="hours">{shift.totalHours || shift.total_hours} hrs</span>
                        </div>
                        <div className="pending-shift-bottom-row" onClick={e => e.stopPropagation()}>
                          {shift.timeBlocks && shift.timeBlocks.length > 0 ? (
                            <button
                              className="btn-expand-blocks"
                              onClick={() => {
                                const newSet = new Set(expandedPendingShifts);
                                if (newSet.has(shift.id)) {
                                  newSet.delete(shift.id);
                                } else {
                                  newSet.add(shift.id);
                                }
                                setExpandedPendingShifts(newSet);
                              }}
                            >
                              {expandedPendingShifts.has(shift.id) ? '▼' : '▶'} {shift.timeBlocks.length} blocks
                            </button>
                          ) : <span></span>}
                          <div className="pending-shift-actions">
                            <button className="btn-approve" onClick={() => handleApproveShift(shift.id)}>✓</button>
                            <button className="btn-reject" onClick={() => { setRejectModalShift(shift); setRejectReason(''); }}>✕</button>
                          </div>
                        </div>
                      </div>
                      {expandedPendingShifts.has(shift.id) && shift.timeBlocks && shift.timeBlocks.length > 0 && (
                        <div className="pending-shift-blocks">
                          {shift.timeBlocks.map((block, idx) => (
                            <div key={idx} className={`mini-block ${block.isBreak || block.is_break ? 'break' : ''}`}>
                              <span className="block-time">{formatTime(block.startTime || block.start_time)} - {formatTime(block.endTime || block.end_time)}</span>
                              {block.isBreak || block.is_break ? <em>Break</em> : <span className="block-tasks">{block.tasks}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {rejectModalShift && (
            <div className="modal-overlay" onClick={() => setRejectModalShift(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Reject Shift</h3>
                <p>Rejecting shift for <strong>{rejectModalShift.user_name}</strong> on {new Date(rejectModalShift.date + 'T00:00:00').toLocaleDateString()}</p>
                <label>
                  Reason (will be sent to employee):
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please fix your break times..."
                    rows={3}
                  />
                </label>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setRejectModalShift(null)}>Cancel</button>
                  <button
                    className="btn-danger"
                    disabled={!rejectReason.trim()}
                    onClick={() => handleRejectShift(rejectModalShift.id, rejectReason)}
                  >
                    Reject Shift
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Weekly View Sub-Tab */}
          {adminSubTab === 'weekly' && (
            <div className="admin-content">
                  <div className="weekly-view-container">
                    {/* Weeks Sidebar Backdrop */}
                    <div
                      className={`weeks-sidebar-backdrop ${showWeeksSidebar ? 'open' : ''}`}
                      onClick={() => setShowWeeksSidebar(false)}
                    />
                    {/* Weeks Sidebar */}
                      <div className={`weeks-sidebar ${showWeeksSidebar ? 'open' : ''}`}>
                        <div className="weeks-sidebar-header">
                          <h4>Select Week</h4>
                          <button className="btn-close-sidebar" onClick={() => setShowWeeksSidebar(false)}>&times;</button>
                        </div>
                        <div className="weeks-list">
                          {/* Always show current week option */}
                          {(() => {
                            const thisWeek = getWeekBounds();
                            const isCurrentWeekInList = availableWeeks.some(w => w.weekStart === thisWeek.weekStart);
                            if (!isCurrentWeekInList) {
                              return (
                                <button
                                  className={`week-option current-week ${thisWeek.weekStart === currentWeekStart ? 'active' : ''}`}
                                  onClick={() => {
                                    loadWeeklyView(thisWeek.weekStart);
                                    setShowWeeksSidebar(false);
                                  }}
                                >
                                  <span className="week-dates">{thisWeek.display}</span>
                                  <span className="week-shift-count">Current Week</span>
                                </button>
                              );
                            }
                            return null;
                          })()}
                          {availableWeeks.map((week, idx) => {
                            const thisWeek = getWeekBounds();
                            const isCurrentWeek = week.weekStart === thisWeek.weekStart;
                            return (
                              <button
                                key={idx}
                                className={`week-option ${week.weekStart === currentWeekStart ? 'active' : ''} ${isCurrentWeek ? 'current-week' : ''}`}
                                onClick={() => {
                                  loadWeeklyView(week.weekStart);
                                  setShowWeeksSidebar(false);
                                }}
                              >
                                <span className="week-dates">{week.display}</span>
                                <span className="week-shift-count">
                                  {isCurrentWeek ? `${week.shiftCount} shifts (Current)` : `${week.shiftCount} shifts`}
                                </span>
                              </button>
                            );
                          })}
                          {availableWeeks.length === 0 && (
                            <p className="no-weeks-msg">Select current week above</p>
                          )}
                        </div>
                      </div>

                    <div className="weekly-main-content">
                      <div className="weekly-header">
                        <button className="btn-week-nav btn-weeks" onClick={async () => {
                          // Load available weeks if not loaded
                          if (availableWeeks.length === 0) {
                            try {
                              const data = await adminAPI.getAvailableWeeks();
                              setAvailableWeeks(data.weeks || []);
                            } catch (err) {
                              console.error('Failed to load weeks:', err);
                            }
                          }
                          setShowWeeksSidebar(!showWeeksSidebar);
                        }}>📅 Weeks</button>
                        <div className="week-nav-controls">
                          {/* Previous (older) week arrow */}
                          <button
                            className="btn-week-arrow"
                            onClick={() => {
                              if (!currentWeekStart) return;
                              setWeekSlideDirection('right'); // Content slides right (going back)
                              // Use noon to avoid timezone issues
                              const current = new Date(currentWeekStart + 'T12:00:00');
                              current.setDate(current.getDate() - 7);
                              const prevWeek = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                              loadWeeklyView(prevWeek);
                              // Reset animation after it completes
                              setTimeout(() => setWeekSlideDirection(null), 300);
                            }}
                            title="Previous week"
                          >
                            ◀
                          </button>
                          <h3>{weeklyViewData?.weekDisplay || 'Loading...'}</h3>
                          {/* Next (newer) week arrow - don't go past current week */}
                          {(() => {
                            // Calculate current week's Sunday using local time
                            const today = new Date();
                            const dayOfWeek = today.getDay();
                            const thisWeekSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek, 12, 0, 0);
                            const thisWeekStart = `${thisWeekSunday.getFullYear()}-${String(thisWeekSunday.getMonth() + 1).padStart(2, '0')}-${String(thisWeekSunday.getDate()).padStart(2, '0')}`;
                            const canGoNext = currentWeekStart && currentWeekStart < thisWeekStart;

                            return (
                              <button
                                className={`btn-week-arrow ${!canGoNext ? 'disabled' : ''}`}
                                onClick={() => {
                                  if (!canGoNext || !currentWeekStart) return;
                                  setWeekSlideDirection('left'); // Content slides left (going forward)
                                  // Use noon to avoid timezone issues
                                  const current = new Date(currentWeekStart + 'T12:00:00');
                                  current.setDate(current.getDate() + 7);
                                  const nextWeek = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                                  // Don't go past current week
                                  loadWeeklyView(nextWeek <= thisWeekStart ? nextWeek : thisWeekStart);
                                  // Reset animation after it completes
                                  setTimeout(() => setWeekSlideDirection(null), 300);
                                }}
                                disabled={!canGoNext}
                                title="Next week"
                              >
                                ▶
                              </button>
                            );
                          })()}
                        </div>
                        <button
                          className="btn-refresh-week"
                          onClick={() => loadWeeklyView(currentWeekStart, true)}
                          title="Refresh data"
                        >
                          ↻
                        </button>
                      </div>

                  {/* Mobile View Mode Toggle */}
                  <div className="view-mode-toggle mobile-only">
                    <button
                      className={`toggle-btn ${weeklyViewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setWeeklyViewMode('list')}
                    >
                      List
                    </button>
                    <button
                      className={`toggle-btn ${weeklyViewMode === 'calendar' ? 'active' : ''}`}
                      onClick={() => setWeeklyViewMode('calendar')}
                    >
                      Calendar
                    </button>
                  </div>

                  {weeklyViewLoading ? (
                    <p className="loading-text">Loading weekly view...</p>
                  ) : weeklyViewData ? (
                    <div className={`weekly-combined-view ${weekSlideDirection ? `slide-${weekSlideDirection}` : ''}`}>
                      {/* Thin Employee List Sidebar */}
                      <div className={`weekly-sidebar ${weeklyViewMode === 'calendar' ? 'mobile-hidden' : ''}`}>
                        <div className="sidebar-header">Employee</div>
                        {weeklyViewData.employees.map(emp => {
                          const hasShifts = emp.shifts.length > 0;
                          return (
                            <div
                              key={emp.userId}
                              className={`sidebar-employee ${!hasShifts ? 'no-shifts' : ''}`}
                              onClick={() => loadUserPayWeeks(emp.userId)}
                              style={hasShifts ? { borderLeftColor: `hsl(${(emp.userId * 137) % 360}, 70%, 50%)` } : {}}
                            >
                              <span className="emp-name">{emp.userName}</span>
                              {hasShifts && <span className="emp-hours">{emp.totalHours}h</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Calendar Grid - Row per Employee */}
                      <div className={`weekly-calendar-grid ${weeklyViewMode === 'list' ? 'mobile-hidden' : ''}`}>
                        {/* Day Headers */}
                        <div className="calendar-header-row">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                            const weekStartDate = new Date(weeklyViewData.weekStart + 'T00:00:00');
                            weekStartDate.setDate(weekStartDate.getDate() + idx);
                            return (
                              <div key={day} className="calendar-day-col-header">
                                <span className="day-name">{day}</span>
                                <span className="day-date">{weekStartDate.getDate()}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Employee Rows - Show ALL employees for consistent gridlines */}
                        {weeklyViewData.employees.map(emp => {
                          const empColor = `hsl(${(emp.userId * 137) % 360}, 70%, 50%)`;
                          const hasShifts = emp.shifts.length > 0;
                          return (
                            <div key={emp.userId} className={`calendar-employee-row ${!hasShifts ? 'no-shifts-row' : ''}`}>
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => {
                                const weekStartDate = new Date(weeklyViewData.weekStart + 'T00:00:00');
                                weekStartDate.setDate(weekStartDate.getDate() + dayIdx);
                                const dayStr = weekStartDate.toISOString().split('T')[0];

                                const dayShift = emp.shifts.find(s => s.date === dayStr);

                                return (
                                  <div key={dayIdx} className="calendar-day-cell">
                                    {dayShift && (
                                      <div
                                        className={`shift-bar ${dayShift.status}`}
                                        style={{ backgroundColor: empColor }}
                                        onClick={() => viewShiftDetails(dayShift.id)}
                                        title={`${emp.userName}: ${formatTime(dayShift.clockInTime)} - ${formatTime(dayShift.clockOutTime)} (${dayShift.totalHours}hrs)`}
                                      >
                                        <span className="shift-time">{formatTime(dayShift.clockInTime)}</span>
                                        <span className="shift-dash">-</span>
                                        <span className="shift-time">{formatTime(dayShift.clockOutTime)}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="empty-text">No data available</p>
                  )}
                    </div>{/* End weekly-main-content */}
                  </div>{/* End weekly-view-container */}
            </div>
          )}

          {/* Activity Full Page View */}
          {adminSubTab === 'activity' && (
            <div className="admin-content">
              <div className="activity-page-header">
                <button className="btn-back" onClick={() => setAdminSubTab('dashboard')}>← Back to Dashboard</button>
                <h2>Activity Log</h2>
              </div>
              {activityLoading ? (
                <p className="loading-text">Loading activity...</p>
              ) : (
                <>
                  <div className="activity-list full-page">
                    {activityData.activity?.map((activity, i) => {
                      const targetName = activity.target_name || 'Unknown';
                      const adminName = activity.admin_name || 'Admin';

                      // Format clock times with date included
                      const shiftDate = activity.details?.date;
                      const clockIn = activity.details?.clockIn ? formatTime(activity.details.clockIn) : null;
                      const clockOut = activity.details?.clockOut ? formatTime(activity.details.clockOut) : null;

                      // Build time range with date: "(1/29/26 8:20 PM - 8:50 PM)"
                      let timeRange = '';
                      if (clockIn && clockOut && shiftDate) {
                        const dateStr = String(shiftDate);
                        const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                        const d = new Date(dateOnly + 'T12:00:00');
                        const formattedDate = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
                        timeRange = ` (${formattedDate} ${clockIn} - ${clockOut})`;
                      } else if (clockIn && clockOut) {
                        timeRange = ` (${clockIn} - ${clockOut})`;
                      }

                      // Determine activity status class
                      const getActivityClass = () => {
                        if (activity.action === 'shift_submitted' || activity.action === 'shift_created') {
                          return 'activity-pending';
                        }
                        if (activity.action === 'shift_approved') {
                          return 'activity-approved';
                        }
                        if (activity.action === 'shift_rejected') {
                          return 'activity-rejected';
                        }
                        return '';
                      };

                      // Format timestamp without seconds
                      const formatActivityTime = (raw) => {
                        if (!raw) return '';
                        const match = String(raw).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
                        if (match) {
                          const utc = Date.UTC(
                            parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]),
                            parseInt(match[4]), parseInt(match[5]), parseInt(match[6])
                          );
                          const d = new Date(utc);
                          return d.toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: '2-digit',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          });
                        }
                        return new Date(raw).toLocaleString();
                      };

                      const formatAction = () => {
                        switch (activity.action) {
                          case 'user_created':
                            return <><strong>{adminName}</strong> added new employee <strong>{targetName}</strong></>;
                          case 'user_updated':
                            return <><strong>{adminName}</strong> updated <strong>{targetName}</strong></>;
                          case 'user_deactivated':
                            return <><strong>{adminName}</strong> deactivated <strong>{targetName}</strong></>;
                          case 'user_activated':
                            return <><strong>{adminName}</strong> reactivated <strong>{targetName}</strong></>;
                          case 'user_password_reset':
                            return <><strong>{adminName}</strong> reset password for <strong>{targetName}</strong></>;
                          case 'shift_submitted':
                          case 'shift_created':
                            return activity.details?.selfService
                              ? <><strong>{targetName}</strong> submitted shift{timeRange}</>
                              : <><strong>{adminName}</strong> created shift for <strong>{targetName}</strong>{timeRange}</>;
                          case 'shift_approved':
                            return (
                              <>
                                <strong>{adminName}</strong> approved <strong>{targetName}'s</strong> shift{timeRange}
                                <span className="approval-timestamp">Approved {formatActivityTime(activity.created_at)}</span>
                              </>
                            );
                          case 'shift_rejected':
                            return (
                              <>
                                <strong>{adminName}</strong> rejected <strong>{targetName}'s</strong> shift{timeRange}
                                <span className="rejection-timestamp">Rejected {formatActivityTime(activity.created_at)}</span>
                              </>
                            );
                          case 'shift_updated':
                            return <><strong>{adminName}</strong> edited <strong>{targetName}'s</strong> shift</>;
                          case 'shift_deleted':
                            return <><strong>{adminName}</strong> deleted <strong>{targetName}'s</strong> shift</>;
                          case 'shift_marked_paid':
                            return <><strong>{adminName}</strong> marked <strong>{targetName}'s</strong> shift as paid</>;
                          default:
                            return <><strong>{adminName}</strong> {activity.action.replace(/_/g, ' ')} <strong>{targetName}</strong></>;
                        }
                      };

                      // Check if this activity links to a shift
                      const isShiftActivity = activity.target_type === 'shift' && activity.target_id && activity.action !== 'shift_deleted';

                      const handleActivityClick = () => {
                        if (isShiftActivity) {
                          viewShiftDetails(activity.target_id);
                        }
                      };

                      return (
                        <div
                          key={i}
                          className={`activity-item ${getActivityClass()} ${isShiftActivity ? 'clickable' : ''}`}
                          onClick={handleActivityClick}
                          style={isShiftActivity ? { cursor: 'pointer' } : {}}
                        >
                          <span className="activity-description">{formatAction()}</span>
                          <span className="activity-time">{formatActivityTime(activity.created_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {activityData.pagination?.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        disabled={activityData.pagination.page <= 1}
                        onClick={() => loadActivity(activityData.pagination.page - 1)}
                      >Prev</button>
                      <span>Page {activityData.pagination.page} of {activityData.pagination.totalPages}</span>
                      <button
                        disabled={activityData.pagination.page >= activityData.pagination.totalPages}
                        onClick={() => loadActivity(activityData.pagination.page + 1)}
                      >Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reports Sub-Tab - REMOVED (keeping code commented for reference)
          {adminSubTab === 'reports' && (
            <div className="admin-content">
              <div className="reports-section">
                <h3>Export Data</h3>
                <div className="filters-bar">
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={adminShiftsFilters.startDate}
                    onChange={e => setAdminShiftsFilters({...adminShiftsFilters, startDate: e.target.value})}
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={adminShiftsFilters.endDate}
                    onChange={e => setAdminShiftsFilters({...adminShiftsFilters, endDate: e.target.value})}
                  />
                </div>
                <div className="export-buttons">
                  <button className="btn-export" onClick={() => handleExport('shifts')}>Export Shifts (CSV)</button>
                  <button className="btn-export" onClick={() => handleExport('users')}>Export Users (CSV)</button>
                  <button className="btn-export" onClick={() => handleExport('hours')}>Export Hours Summary (CSV)</button>
                  <button className="btn-export" onClick={() => handleExport('timeblocks')}>Export Time Blocks (CSV)</button>
                </div>
              </div>
            </div>
          )}

          {/* Database Browser Sub-Tab */}
          {adminSubTab === 'database' && (
            <div className="admin-content">
              <div className="db-browser">
                <div className="db-sidebar">
                  <h3>Tables</h3>
                  {tableLoading && !dbTables.length ? (
                    <p className="loading-text">Loading tables...</p>
                  ) : (
                    <ul className="table-list">
                      {dbTables.map(t => (
                        <li
                          key={t.name}
                          className={`table-item ${selectedTable === t.name ? 'selected' : ''} ${!t.writable ? 'readonly' : ''}`}
                          onClick={() => loadTableData(t.name)}
                        >
                          <span className="table-name">{t.name}</span>
                          <span className="table-count">{t.rowCount} rows</span>
                          {!t.writable && <span className="readonly-badge">Read-only</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="db-content">
                  {!selectedTable ? (
                    <p className="empty-text">Select a table to browse data</p>
                  ) : tableLoading ? (
                    <p className="loading-text">Loading data...</p>
                  ) : (
                    <>
                      <h3>{selectedTable} <span className="table-info">({tableData.pagination?.total || 0} rows)</span></h3>
                      <div className="admin-table-container">
                        <table className="admin-table db-table">
                          <thead>
                            <tr>
                              {tableData.schema?.map(col => (
                                <th key={col.column_name} className={col.isRedacted ? 'redacted' : ''}>
                                  {col.column_name}
                                  {col.isProtected && <span className="protected-icon" title="Protected">*</span>}
                                </th>
                              ))}
                              {tableData.config?.writable && <th>Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.rows?.map(row => (
                              <tr key={row.id}>
                                {tableData.schema?.map(col => (
                                  <td key={col.column_name} className={col.isRedacted ? 'redacted-cell' : ''}>
                                    {col.isRedacted ? '[REDACTED]' : (
                                      typeof row[col.column_name] === 'object'
                                        ? JSON.stringify(row[col.column_name])
                                        : String(row[col.column_name] ?? '')
                                    )}
                                  </td>
                                ))}
                                {tableData.config?.writable && (
                                  <td className="action-cell">
                                    <button className="btn-edit-small" onClick={() => setEditingRow({...row})}>Edit</button>
                                    {tableData.config?.deleteAllowed && (
                                      <button className="btn-delete-small" onClick={() => setDeleteConfirm({ type: 'row', table: selectedTable, id: row.id })}>Delete</button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {tableData.pagination?.totalPages > 1 && (
                        <div className="pagination">
                          <button disabled={tableData.pagination.page <= 1} onClick={() => loadTableData(selectedTable, tableData.pagination.page - 1)}>Prev</button>
                          <span>Page {tableData.pagination.page} of {tableData.pagination.totalPages}</span>
                          <button disabled={tableData.pagination.page >= tableData.pagination.totalPages} onClick={() => loadTableData(selectedTable, tableData.pagination.page + 1)}>Next</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          </>
          )}

            </div>{/* End admin-main */}

            {/* Right Sidebar - Recently Approved (only on pending tab) */}
            {adminSubTab === 'pending' && (
              <aside className="admin-right-sidebar">
                <h4>Recently Approved</h4>
                {approvedShifts.length === 0 ? (
                  <p className="no-approved">No recent approvals</p>
                ) : (
                  <div className="approved-sidebar-list">
                    {approvedShifts.map(shift => (
                      <div
                        key={shift.id}
                        className="approved-sidebar-item"
                        onClick={() => viewShiftDetails(shift.id)}
                      >
                        <div className="approved-item-header">
                          <span className="approved-item-name">{shift.user_name}</span>
                          <span className="approved-item-hours">{shift.totalHours || shift.total_hours}h</span>
                        </div>
                        <div className="approved-item-details">
                          <span className="approved-item-date">{new Date(shift.date + 'T00:00:00').toLocaleDateString()}</span>
                          <div className="approved-item-times">
                            <span>{formatTime(shift.clockInTime || shift.clock_in_time)}</span>
                            <span>{formatTime(shift.clockOutTime || shift.clock_out_time)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </aside>
            )}
          </div>{/* End admin-layout */}
        </main>
      )}

      {/* Employee Edit Shift Modal */}
      {employeeEditingShift && (
        <div className="modal-overlay" onClick={() => setEmployeeEditingShift(null)}>
          <div className="modal employee-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Shift</h2>
              <button className="modal-close" onClick={() => setEmployeeEditingShift(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {employeeEditingShift.status === 'rejected' && (
                <p className="info-text" style={{ color: '#dc2626', marginBottom: '16px' }}>
                  This shift was rejected. Make your corrections and save to resubmit for approval.
                </p>
              )}
              <div className="form-row">
                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={employeeEditingShift.date?.split('T')[0] || employeeEditingShift.date || ''}
                    onChange={e => setEmployeeEditingShift({...employeeEditingShift, date: e.target.value})}
                  />
                </div>
                <div className="form-field">
                  <label>Total Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    value={employeeEditingShift.totalHours || ''}
                    onChange={e => setEmployeeEditingShift({...employeeEditingShift, totalHours: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Clock In</label>
                  <input
                    type="time"
                    value={employeeEditingShift.clockInTime?.substring(0,5) || ''}
                    onChange={e => setEmployeeEditingShift({...employeeEditingShift, clockInTime: e.target.value})}
                  />
                </div>
                <div className="form-field">
                  <label>Clock Out</label>
                  <input
                    type="time"
                    value={employeeEditingShift.clockOutTime?.substring(0,5) || ''}
                    onChange={e => setEmployeeEditingShift({...employeeEditingShift, clockOutTime: e.target.value})}
                  />
                </div>
              </div>

              {/* Time Blocks Section */}
              <div className="time-blocks-section">
                <div className="time-blocks-header">
                  <h3>Time Blocks</h3>
                  <button
                    type="button"
                    className="btn-add-block"
                    onClick={() => {
                      const newBlock = {
                        id: Date.now(),
                        startTime: employeeEditingShift.clockInTime?.substring(0,5) || '08:00',
                        endTime: employeeEditingShift.clockOutTime?.substring(0,5) || '17:00',
                        tasks: '',
                        isBreak: false
                      };
                      setEmployeeEditingShift({
                        ...employeeEditingShift,
                        timeBlocks: [...(employeeEditingShift.timeBlocks || []), newBlock]
                      });
                    }}
                  >
                    + Add Block
                  </button>
                </div>
                <div className="time-blocks-list">
                  {(employeeEditingShift.timeBlocks || []).map((block, idx) => (
                    <div key={block.id || idx} className={`time-block-item ${block.isBreak ? 'break-block' : ''}`}>
                      <div className="block-row">
                        <input
                          type="time"
                          value={block.startTime?.substring(0,5) || ''}
                          onChange={e => {
                            const updated = [...employeeEditingShift.timeBlocks];
                            updated[idx] = { ...updated[idx], startTime: e.target.value };
                            setEmployeeEditingShift({ ...employeeEditingShift, timeBlocks: updated });
                          }}
                        />
                        <span className="block-separator">-</span>
                        <input
                          type="time"
                          value={block.endTime?.substring(0,5) || ''}
                          onChange={e => {
                            const updated = [...employeeEditingShift.timeBlocks];
                            updated[idx] = { ...updated[idx], endTime: e.target.value };
                            setEmployeeEditingShift({ ...employeeEditingShift, timeBlocks: updated });
                          }}
                        />
                        <label className="break-checkbox">
                          <input
                            type="checkbox"
                            checked={block.isBreak || false}
                            onChange={e => {
                              const updated = [...employeeEditingShift.timeBlocks];
                              updated[idx] = { ...updated[idx], isBreak: e.target.checked };
                              setEmployeeEditingShift({ ...employeeEditingShift, timeBlocks: updated });
                            }}
                          />
                          Break
                        </label>
                        <button
                          type="button"
                          className="btn-delete-block"
                          onClick={() => {
                            const updated = employeeEditingShift.timeBlocks.filter((_, i) => i !== idx);
                            setEmployeeEditingShift({ ...employeeEditingShift, timeBlocks: updated });
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <textarea
                        placeholder="Tasks / notes for this time block..."
                        value={block.tasks || ''}
                        onChange={e => {
                          const updated = [...employeeEditingShift.timeBlocks];
                          updated[idx] = { ...updated[idx], tasks: e.target.value };
                          setEmployeeEditingShift({ ...employeeEditingShift, timeBlocks: updated });
                        }}
                      />
                    </div>
                  ))}
                  {(!employeeEditingShift.timeBlocks || employeeEditingShift.timeBlocks.length === 0) && (
                    <p className="empty-text">No time blocks. Click "Add Block" to add tasks.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={() => setEmployeeEditingShift(null)}>Cancel</button>
              <button className="btn-confirm-modal" onClick={handleEmployeeUpdateShift}>
                Save & Resubmit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(() => {
    return window.location.pathname === '/register';
  });

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    window.history.pushState({}, '', '/');
  };

  const handleSwitchToRegister = () => {
    setShowRegister(true);
    window.history.pushState({}, '', '/register');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <Register onSwitchToLogin={handleSwitchToLogin} />
    ) : (
      <Login onSwitchToRegister={handleSwitchToRegister} />
    );
  }

  return <TimeClock />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

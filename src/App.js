import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { shiftsAPI, authAPI, adminAPI, notificationsAPI, localTimeToUTC } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

// Hardcoded admin email
const ADMIN_EMAIL = 'tyler@fullscopeestimating.com';

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
  const [editingBlock, setEditingBlock] = useState(null); // For "going back in time"
  const [editingTasks, setEditingTasks] = useState(['']); // Array of task inputs for editing block
  const [editingOriginalIndex, setEditingOriginalIndex] = useState(null); // Track original position
  const [swipingBlockId, setSwipingBlockId] = useState(null);
  const [testBlocks, setTestBlocks] = useState(5);
  const [testBreaks, setTestBreaks] = useState(2);
  const [nowOffsetHours, setNowOffsetHours] = useState(0);
  const [nowOffsetMins, setNowOffsetMins] = useState(0);
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'history', or 'admin'
  const [adminShifts, setAdminShifts] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === 'admin';

  // Admin Panel State
  const [adminSubTab, setAdminSubTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { shift, message }
  const [expandedShifts, setExpandedShifts] = useState(new Set()); // Track expanded shift IDs
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewShiftData, setPreviewShiftData] = useState(null);
  const [showGapModal, setShowGapModal] = useState(false);
  const [gapData, setGapData] = useState(null); // { startTime, endTime, pendingBlocks, gapIndex }
  const [gapTasks, setGapTasks] = useState(['']);
  const [blocksBeforeEdit, setBlocksBeforeEdit] = useState(null); // For restoring on gap cancel
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
  const [pendingShiftsLoading, setPendingShiftsLoading] = useState(false);
  const [selectedPendingShifts, setSelectedPendingShifts] = useState(new Set());
  const [rejectModalShift, setRejectModalShift] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Weekly View State
  const [weeklyViewData, setWeeklyViewData] = useState(null);
  const [weeklyViewLoading, setWeeklyViewLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [weeklyViewMode, setWeeklyViewMode] = useState('calendar'); // 'list' or 'calendar'
  const [showWeeksSidebar, setShowWeeksSidebar] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState([]);

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
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setAdminToast({ type: 'error', message: 'Failed to load dashboard' });
    } finally {
      setAdminLoading(false);
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

  // Load pending shifts for approval
  const loadPendingShifts = async () => {
    setPendingShiftsLoading(true);
    try {
      const data = await adminAPI.getPendingShifts();
      setPendingShifts(data.shifts || []);
    } catch (err) {
      console.error('Failed to load pending shifts:', err);
      setAdminToast({ type: 'error', message: 'Failed to load pending shifts' });
    } finally {
      setPendingShiftsLoading(false);
    }
  };

  // Load weekly view data
  const loadWeeklyView = async (weekStart = null) => {
    setWeeklyViewLoading(true);
    try {
      const data = await adminAPI.getWeeklyView(weekStart);
      setWeeklyViewData(data);
      setCurrentWeekStart(data.weekStart);
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
    } catch (err) {
      console.error('Failed to approve shift:', err);
      setAdminToast({ type: 'error', message: err.message || 'Failed to approve shift' });
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
      const totalHours = (totalMinutes / 60).toFixed(2);

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

  // Get end time = start time + offset (for "Now" on end time field)
  const getEndTimeWithOffset = (startTime) => {
    if (!startTime) return getActualTime();

    const [h, m] = startTime.split(':').map(Number);
    const baseTime = new Date(2000, 0, 1, h, m);

    // Add offset to get end time
    baseTime.setHours(baseTime.getHours() + nowOffsetHours);
    baseTime.setMinutes(baseTime.getMinutes() + nowOffsetMins);

    const hours = String(baseTime.getHours()).padStart(2, '0');
    const minutes = String(baseTime.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Increment end time - if no end time, use start time as base
  const incrementEndTime = (block, updateFn, minutes) => {
    const baseTime = block.endTime || block.startTime;
    if (!baseTime) return;
    const newTime = addMinutesToTime(baseTime, minutes);
    updateFn('endTime', newTime);
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
    return diffHours > 0 ? diffHours.toFixed(2) : '0.00';
  };

  const handleClockIn = async () => {
    try {
      const clockInTime = getStartTime();
      // Create pending shift on server - convert to UTC for storage
      const shift = await shiftsAPI.clockIn(currentDate, localTimeToUTC(clockInTime, currentDate));
      setPendingShiftId(shift.id);

      const newBlock = {
        id: Date.now(),
        startTime: clockInTime,
        endTime: '',
        tasks: ''
      };
      setCurrentBlock(newBlock);
      setCurrentTasks(['']);
    } catch (err) {
      console.error('Failed to clock in:', err);
      alert('Failed to start shift: ' + err.message);
    }
  };

  // Join tasks array into a string, filtering empty entries
  const joinTasks = (tasksArray) => {
    return tasksArray.filter(t => t.trim()).join(' • ');
  };

  const handleAdvanceBlock = async () => {
    if (!currentBlock || !currentBlock.endTime) return;

    // Join tasks before completing
    const completedBlock = {
      ...currentBlock,
      tasks: joinTasks(currentTasks)
    };

    // Trigger swipe animation
    setSwipingBlockId(currentBlock.id);

    setTimeout(async () => {
      // Save block to server if we have a pending shift
      if (pendingShiftId) {
        try {
          setAutoSaveStatus('saving');
          const savedBlock = await shiftsAPI.addBlock(pendingShiftId, {
            startTime: localTimeToUTC(completedBlock.startTime, currentDate),
            endTime: localTimeToUTC(completedBlock.endTime, currentDate),
            tasks: completedBlock.tasks,
            isBreak: completedBlock.isBreak || false
          });
          // Update local block with server ID
          completedBlock.serverId = savedBlock.id;
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (err) {
          console.error('Failed to save block:', err);
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      }

      // Move current block to completed
      setCompletedBlocks([...completedBlocks, completedBlock]);

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
    }, 400);
  };

  const handleBreak = async () => {
    if (!currentBlock) return;

    // Break starts where current block ends (or use current block's end time if set)
    // Do NOT use getActualTime() here - breaks should continue from last block
    let breakStartTime;
    if (currentBlock.endTime) {
      breakStartTime = currentBlock.endTime;
    } else if (completedBlocks.length > 0) {
      // Use end time of last completed block
      breakStartTime = completedBlocks[completedBlocks.length - 1].endTime;
    } else {
      // Fallback: use current block's start time
      breakStartTime = currentBlock.startTime;
    }

    const breakEndTime = addMinutesToTime(breakStartTime, 15);

    // Complete current block first if it has content
    const joinedTasks = joinTasks(currentTasks);
    let updatedBlocks = [...completedBlocks];
    if (currentBlock.startTime && joinedTasks) {
      const workBlock = { ...currentBlock, tasks: joinedTasks, endTime: breakStartTime };
      // Save work block to server if we have a pending shift
      if (pendingShiftId) {
        try {
          const savedBlock = await shiftsAPI.addBlock(pendingShiftId, {
            startTime: localTimeToUTC(workBlock.startTime, currentDate),
            endTime: localTimeToUTC(workBlock.endTime, currentDate),
            tasks: workBlock.tasks,
            isBreak: false
          });
          workBlock.serverId = savedBlock.id;
        } catch (err) {
          console.error('Failed to save work block:', err);
        }
      }
      updatedBlocks = [...completedBlocks, workBlock];
      setCompletedBlocks(updatedBlocks);
    }

    // Create break block and immediately complete it
    const breakBlock = {
      id: Date.now(),
      startTime: breakStartTime,
      endTime: breakEndTime,
      tasks: '15 min Break',
      isBreak: true
    };

    setSwipingBlockId(breakBlock.id);

    setTimeout(async () => {
      // Save break block to server
      if (pendingShiftId) {
        try {
          setAutoSaveStatus('saving');
          const savedBreak = await shiftsAPI.addBlock(pendingShiftId, {
            startTime: localTimeToUTC(breakBlock.startTime, currentDate),
            endTime: localTimeToUTC(breakBlock.endTime, currentDate),
            tasks: breakBlock.tasks,
            isBreak: true
          });
          breakBlock.serverId = savedBreak.id;
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (err) {
          console.error('Failed to save break:', err);
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      }

      setCompletedBlocks(prev => [...prev, breakBlock]);

      // Create new current block starting after break
      const newBlock = {
        id: Date.now() + 1,
        startTime: breakEndTime,
        endTime: '',
        tasks: ''
      };
      setCurrentBlock(newBlock);
      setCurrentTasks(['']);
      setSwipingBlockId(null);
    }, 400);
  };

  const updateCurrentBlock = (field, value) => {
    setCurrentBlock({ ...currentBlock, [field]: value });
  };

  const updateEditingBlock = (field, value) => {
    setEditingBlock({ ...editingBlock, [field]: value });
  };

  const handleEditBlock = (block) => {
    // Track original position before removing
    const originalIndex = completedBlocks.findIndex(b => b.id === block.id);
    setEditingOriginalIndex(originalIndex);

    // Save current block state and edit the selected block
    setEditingBlock(block);
    // Split existing tasks string into array for editing (skip for breaks)
    const tasksArray = block.isBreak ? [''] : (block.tasks ? block.tasks.split(' • ') : ['']);
    setEditingTasks(tasksArray.length > 0 ? tasksArray : ['']);
    // Remove from completed blocks
    setCompletedBlocks(completedBlocks.filter(b => b.id !== block.id));
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
            gapIndex: insertIndex + 1
          }
        };
      }
    }

    return { blocks: updatedBlocks, gap: null };
  };

  const handleSaveEdit = () => {
    if (!editingBlock) return;

    // Save original blocks in case we need to restore on gap cancel
    // Include the editing block at its original position
    const originalBlocks = [...completedBlocks];
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
      const insertIndex = Math.min(editingOriginalIndex, completedBlocks.length);
      const result = processBlocksAfterEdit(completedBlocks, savedBlock, insertIndex);

      if (result.gap) {
        // There's a gap - show modal to fill it
        setGapData({
          ...result.gap,
          pendingBlocks: result.blocks
        });
        setGapTasks(['']);
        setShowGapModal(true);
      } else {
        setCompletedBlocks(result.blocks);
        setBlocksBeforeEdit(null);

        // If the edited block is the last block and there's a current block,
        // update the current block's start time to match the edited block's end time
        const lastBlock = result.blocks[result.blocks.length - 1];
        if (currentBlock && lastBlock && lastBlock.id === savedBlock.id && savedBlock.endTime) {
          setCurrentBlock(prev => ({ ...prev, startTime: savedBlock.endTime }));
        }
      }

      setEditingBlock(null);
      setEditingTasks(['']);
      setEditingOriginalIndex(null);
      setSwipingBlockId(null);
    }, 400);
  };

  // Handle filling a gap
  const handleFillGap = () => {
    if (!gapData) return;

    const gapBlock = {
      id: Date.now(),
      startTime: gapData.startTime,
      endTime: gapData.endTime,
      tasks: joinTasks(gapTasks),
      isBreak: false
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
        setGapData({
          startTime: gapBlock.endTime,
          endTime: nextBlock.startTime,
          pendingBlocks: updatedBlocks,
          gapIndex: nextIndex
        });
        setGapTasks(['']);
        return; // Keep modal open
      }

      // Overlap? Adjust next block
      if (gapEndMinutes > nextStartMinutes) {
        updatedBlocks[nextIndex] = { ...nextBlock, startTime: gapBlock.endTime };
      }
    }

    setCompletedBlocks(updatedBlocks);
    setShowGapModal(false);
    setGapData(null);
    setGapTasks(['']);
    setBlocksBeforeEdit(null);
  };

  const handleCancelGap = () => {
    // Cancel gap fill - restore blocks to state before the edit
    if (blocksBeforeEdit) {
      setCompletedBlocks(blocksBeforeEdit);
    }
    setShowGapModal(false);
    setGapData(null);
    setGapTasks(['']);
    setBlocksBeforeEdit(null);
  };

  const handleCancelEdit = () => {
    // Restore the editing block to completed at original position
    if (editingBlock) {
      const updatedBlocks = [...completedBlocks];
      const insertIndex = Math.min(editingOriginalIndex ?? updatedBlocks.length, updatedBlocks.length);
      updatedBlocks.splice(insertIndex, 0, editingBlock);
      setCompletedBlocks(updatedBlocks);
    }
    setEditingBlock(null);
    setEditingTasks(['']);
    setEditingOriginalIndex(null);
  };

  const removeCompletedBlock = (id) => {
    setCompletedBlocks(completedBlocks.filter(b => b.id !== id));
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
    setEditingTasks(['']);
  };

  const clearAll = () => {
    setCompletedBlocks([]);
    setCurrentBlock(null);
    setCurrentTasks(['']);
    setEditingBlock(null);
    setEditingTasks(['']);
    setPendingShiftId(null);
    setAutoSaveStatus('idle');
  };

  const calculateTotalHours = () => {
    let total = 0;
    [...completedBlocks, currentBlock].filter(Boolean).forEach(block => {
      const hrs = calculateBlockHours(block.startTime, block.endTime);
      if (hrs) total += parseFloat(hrs);
    });
    return total.toFixed(2);
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

    const validBlocks = allBlocks.filter(block => block.startTime && block.endTime && block.tasks);

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
        startTime: recoveryShift.clockInTime || getActualTime(),
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
        totalHours.toFixed(2)
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
        <div className="toast">
          <div className="toast-header">
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)}>&times;</button>
          </div>
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
          <div className="preview-modal gap-modal">
            <div className="modal-header">
              <h2>Fill Time Gap</h2>
            </div>
            <div className="modal-body">
              <div className="gap-warning">
                Your edit created a gap in the timeline. Please fill in what you worked on during this time.
              </div>
              <div className="gap-times">
                <div className="time-field">
                  <label>Gap Start</label>
                  <div className="time-input-group">
                    <input
                      type="time"
                      value={gapData.startTime}
                      onChange={(e) => setGapData({ ...gapData, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="time-field">
                  <label>Gap End</label>
                  <div className="time-input-group">
                    <input
                      type="time"
                      value={gapData.endTime}
                      onChange={(e) => setGapData({ ...gapData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="gap-duration">
                Duration: <strong>{calculateBlockHours(gapData.startTime, gapData.endTime)} hrs</strong>
              </div>
              <div className="task-field">
                <label>What did you work on?</label>
                {gapTasks.map((task, index) => (
                  <div key={index} className="task-input-row">
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...gapTasks];
                        newTasks[index] = e.target.value;
                        setGapTasks(newTasks);
                      }}
                      placeholder={index === 0 ? "Enter task..." : "Another task..."}
                    />
                    {gapTasks.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-task"
                        onClick={() => setGapTasks(gapTasks.filter((_, i) => i !== index))}
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-task"
                  onClick={() => setGapTasks([...gapTasks, ''])}
                >
                  + Add Task
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={handleCancelGap}>
                Cancel Edit
              </button>
              <button
                className="btn-confirm-modal"
                onClick={handleFillGap}
                disabled={!gapTasks.some(t => t.trim())}
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
                <span className="now-offset-label">Block +</span>
                <select value={nowOffsetHours} onChange={(e) => setNowOffsetHours(Number(e.target.value))}>
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}h</option>
                  ))}
                </select>
                <select value={nowOffsetMins} onChange={(e) => setNowOffsetMins(Number(e.target.value))}>
                  {[0, 15, 30, 45].map(n => (
                    <option key={n} value={n}>{n}m</option>
                  ))}
                </select>
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
                      <div className="time-input-group">
                        <input
                          type="time"
                          value={editingBlock.startTime}
                          onChange={(e) => updateEditingBlock('startTime', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="time-field">
                      <label>End</label>
                      <div className="time-input-group">
                        <input
                          type="time"
                          value={editingBlock.endTime}
                          onChange={(e) => updateEditingBlock('endTime', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-now"
                          onClick={() => updateEditingBlock('endTime', getEndTimeWithOffset(editingBlock.startTime))}
                        >
                          Now{(nowOffsetHours > 0 || nowOffsetMins > 0) ? '+' : ''}
                        </button>
                      </div>
                      <div className="time-increment-btns">
                        <button
                          type="button"
                          className="btn-increment"
                          onClick={() => incrementEndTime(editingBlock, updateEditingBlock, 15)}
                        >
                          +15m
                        </button>
                        <button
                          type="button"
                          className="btn-increment"
                          onClick={() => incrementEndTime(editingBlock, updateEditingBlock, 60)}
                        >
                          +1hr
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Hide task input for breaks */}
                  {!editingBlock.isBreak && (
                    <div className="task-field">
                      <label>Tasks</label>
                      {editingTasks.map((task, index) => (
                        <div key={index} className="task-input-row">
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
                          {editingTasks.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-task"
                              onClick={() => {
                                const newTasks = editingTasks.filter((_, i) => i !== index);
                                setEditingTasks(newTasks);
                              }}
                            >
                              −
                            </button>
                          )}
                        </div>
                      ))}
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
                    <span className="block-number">Block {blockCount}</span>
                    {calculateBlockHours(currentBlock.startTime, currentBlock.endTime) && (
                      <span className="block-hours">
                        {calculateBlockHours(currentBlock.startTime, currentBlock.endTime)} hrs
                      </span>
                    )}
                  </div>
                  <div className="block-times">
                    <div className="time-field">
                      <label>Start{completedBlocks.length > 0 }</label>
                      <div className="time-input-group">
                        <input
                          type="time"
                          value={currentBlock.startTime}
                          onChange={(e) => !completedBlocks.length && updateCurrentBlock('startTime', e.target.value)}
                          readOnly={completedBlocks.length > 0}
                          className={completedBlocks.length > 0 ? 'locked-input' : ''}
                        />
                      </div>
                    </div>
                    <div className="time-field">
                      <label>End</label>
                      <div className="time-input-group">
                        <input
                          type="time"
                          value={currentBlock.endTime}
                          onChange={(e) => updateCurrentBlock('endTime', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-now"
                          onClick={() => updateCurrentBlock('endTime', getEndTimeWithOffset(currentBlock.startTime))}
                        >
                          Now{(nowOffsetHours > 0 || nowOffsetMins > 0) ? '+' : ''}
                        </button>
                      </div>
                      <div className="time-increment-btns">
                        <button
                          type="button"
                          className="btn-increment"
                          onClick={() => incrementEndTime(currentBlock, updateCurrentBlock, 15)}
                        >
                          +15m
                        </button>
                        <button
                          type="button"
                          className="btn-increment"
                          onClick={() => incrementEndTime(currentBlock, updateCurrentBlock, 60)}
                        >
                          +1hr
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="task-field">
                    <label>Tasks</label>
                    {currentTasks.map((task, index) => (
                      <div key={index} className="task-input-row">
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
                        {currentTasks.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-task"
                            onClick={() => {
                              const newTasks = currentTasks.filter((_, i) => i !== index);
                              setCurrentTasks(newTasks);
                            }}
                          >
                            −
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-add-task"
                      onClick={() => setCurrentTasks([...currentTasks, ''])}
                    >
                      + Add Task
                    </button>
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
                      disabled={!currentBlock.endTime || !currentTasks.some(t => t.trim())}
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
              <button
                type="button"
                className="btn-save"
                onClick={previewShift}
                disabled={(completedBlocks.length === 0 && !currentBlock) || saving}
              >
                {saving ? 'Saving...' : 'Clock Out'}
              </button>
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
              <div className="completed-list">
                {completedBlocks.map((block, index) => {
                  // Count only work blocks for numbering
                  const workBlockNumber = completedBlocks
                    .slice(0, index + 1)
                    .filter(b => !b.isBreak).length;
                  return (
                  <div
                    key={block.id}
                    className={`completed-block ${block.isBreak ? 'break-block' : ''}`}
                  >
                    <div className="completed-block-header">
                      <span className="completed-number">
                        {block.isBreak ? 'Break' : `Block #${workBlockNumber}`}
                      </span>
                      <span className="completed-hours">
                        {calculateBlockHours(block.startTime, block.endTime)} hrs
                      </span>
                    </div>
                    <div className="completed-task">
                      {block.tasks.split(' • ').map((task, i) => (
                        <div key={i} className="task-line">{task}</div>
                      ))}
                    </div>
                    <div className="completed-meta">
                      <span>{formatTime(block.startTime)} - {formatTime(block.endTime)}</span>
                      <div className="completed-actions">
                        <button
                          type="button"
                          className={`btn-edit ${block.isBreak ? 'btn-extend-break' : ''}`}
                          onClick={() => handleEditBlock(block)}
                          disabled={editingBlock !== null}
                        >
                          {block.isBreak ? 'Extend Break' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => removeCompletedBlock(block.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      ) : activeTab === 'history' ? (
        /* Shift History Tab */
        <main className="history-tab">
          <section className="shift-history-full">
            <h2>Shift History</h2>
            {loading ? (
              <p className="loading-text">Loading shifts...</p>
            ) : shifts.length === 0 ? (
              <p className="empty-text">No shifts recorded yet</p>
            ) : (
              <div className="history-list">
                {shifts.map((shift) => {
                  const shiftId = shift._id || shift.id;
                  const isExpanded = expandedShifts.has(shiftId);
                  const isInProgress = shift.status === 'in_progress' || shift.status === 'pending';
                  const statusDisplay = {
                    'in_progress': { label: 'In Progress', class: 'in-progress' },
                    'pending': { label: 'In Progress', class: 'in-progress' },
                    'pending_approval': { label: 'Pending Approval', class: 'pending-approval' },
                    'rejected': { label: 'Rejected', class: 'rejected' },
                    'approved': { label: 'Approved', class: 'approved' },
                    'paid': { label: 'Paid', class: 'paid' },
                    'completed': { label: 'Completed', class: 'approved' }
                  }[shift.status] || { label: shift.status, class: shift.status };
                  return (
                    <div key={shiftId} className={`history-item ${isExpanded ? 'expanded' : ''} ${isInProgress ? 'pending-shift' : ''}`}>
                      <div className="history-header">
                        <div
                          className="history-header-left"
                          onClick={() => toggleShiftExpanded(shiftId)}
                        >
                          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                          <span className={`status-badge ${statusDisplay.class}`}>{statusDisplay.label}</span>
                          <span className="history-date">{formatDate(shift.date)}</span>
                          <span className="history-times-inline">
                            {formatTime(shift.clockInTime)} - {isInProgress ? 'Active' : formatTime(shift.clockOutTime)}
                          </span>
                        </div>
                        <div className="history-header-right">
                          <span className="history-hours">{isInProgress ? '--' : shift.totalHours} hrs</span>
                          <button
                            type="button"
                            className="btn-delete-shift"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this shift?')) {
                                shiftsAPI.delete(shiftId).then(() => {
                                  setShifts(shifts.filter(s => (s._id || s.id) !== shiftId));
                                }).catch(err => alert('Failed to delete: ' + err.message));
                              }
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {isExpanded && shift.timeBlocks && shift.timeBlocks.length > 0 && (
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
                  {dashboardData?.pendingApprovalCount > 0 && (
                    <span className="nav-badge">{dashboardData.pendingApprovalCount}</span>
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
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${viewingShift.status}`}>{viewingShift.status?.replace('_', ' ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Shift ID</span>
                    <span className="detail-value">#{viewingShift.id}</span>
                  </div>
                </div>
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
                              {userPayWeeksData.payWeeks.reduce((sum, w) => sum + w.approvedHours, 0).toFixed(1)}
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
                      <div className="stat-value">{dashboardData.hoursToday?.toFixed(1) || 0}</div>
                      <div className="stat-label">Hours Today</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{dashboardData.hoursThisWeek?.toFixed(1) || 0}</div>
                      <div className="stat-label">Hours This Week</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{dashboardData.hoursThisMonth?.toFixed(1) || 0}</div>
                      <div className="stat-label">Hours This Month</div>
                    </div>
                  </div>

                  <div className="dashboard-sections">
                    <div className="dashboard-section">
                      <h3 className="week-range">{(() => {
                        // Calculate week bounds (Sunday to Saturday)
                        const today = new Date();
                        const day = today.getDay();
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - day);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        const formatD = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return `${formatD(weekStart)} - ${formatD(weekEnd)}`;
                      })()}</h3>
                      <div className="top-employees-list">
                        {dashboardData.topEmployees?.slice(0, 5).map((emp, i) => (
                          <div key={emp.id} className="top-employee" onClick={() => loadUserPayWeeks(emp.id)} style={{ cursor: 'pointer' }}>
                            <span className="rank">#{i + 1}</span>
                            <span className="name">{emp.name}</span>
                            <span className="hours">{emp.hours?.toFixed(1) || 0} hrs</span>
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
                            // Skip approval entries - we use shift_status instead
                            if (activity.action === 'shift_approved') continue;

                            // For shift submissions, check shift's current status
                            if ((activity.action === 'shift_submitted' || activity.action === 'shift_created') && activity.target_id) {
                              const shiftIdKey = String(activity.target_id);
                              if (seenShiftIds.has(shiftIdKey)) continue;
                              seenShiftIds.add(shiftIdKey);

                              // Use the actual shift status from the database
                              const isApproved = activity.shift_status === 'approved' || activity.shift_status === 'paid';
                              consolidated.push({
                                ...activity,
                                isApproved,
                                approvalTime: activity.approval_timestamp
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
                              if (activity.action === 'shift_submitted' || activity.action === 'shift_created') {
                                return 'activity-pending';
                              }
                              return '';
                            };

                            const formatAction = () => {
                              // Format clock times if available
                              const clockIn = activity.details?.clockIn ? formatTime(activity.details.clockIn) : null;
                              const clockOut = activity.details?.clockOut ? formatTime(activity.details.clockOut) : null;
                              const timeRange = clockIn && clockOut ? ` (${clockIn} - ${clockOut})` : '';

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
                                        : <><strong>{adminName}</strong> created shift for <strong>{targetName}</strong></>
                                      }
                                      {activity.isApproved && (
                                        <span className="approval-timestamp">
                                          Approved {activity.approvalTime ? formatActivityTime(activity.approvalTime) : ''}
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
                                default:
                                  return <><strong>{adminName}</strong> {activity.action.replace(/_/g, ' ')} <strong>{targetName}</strong></>;
                              }
                            };

                            return (
                              <div key={i} className={`activity-item ${getActivityClass()}`}>
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
                              <button className="btn-edit-small" onClick={() => setEditingUser({...u})}>Edit</button>
                              {u.id !== user.id && (
                                <button className="btn-delete-small" onClick={() => setDeleteConfirm({ type: 'user', id: u.id })}>Deactivate</button>
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
            <div className="admin-content">
              <div className="pending-header">
                <h3>Shifts Pending Approval</h3>
                {selectedPendingShifts.size > 0 && (
                  <button className="btn-batch-approve" onClick={handleBatchApprove}>
                    Approve Selected ({selectedPendingShifts.size})
                  </button>
                )}
              </div>

              {pendingShiftsLoading ? (
                <p className="loading-text">Loading pending shifts...</p>
              ) : pendingShifts.length === 0 ? (
                <div className="empty-state">
                  <p>No shifts pending approval</p>
                </div>
              ) : (
                <div className="pending-shifts-list">
                  {pendingShifts.map(shift => (
                    <div key={shift.id} className="pending-shift-card">
                      <div className="pending-shift-header">
                        <label className="checkbox-label">
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
                        <div className="pending-shift-info">
                          <strong>{shift.user_name}</strong>
                          <span className="shift-date">{new Date(shift.date + 'T00:00:00').toLocaleDateString()}</span>
                        </div>
                        <div className="pending-shift-times">
                          <span>{formatTime(shift.clockInTime || shift.clock_in_time)} - {formatTime(shift.clockOutTime || shift.clock_out_time)}</span>
                          <span className="hours">{shift.totalHours || shift.total_hours} hrs</span>
                        </div>
                        <div className="pending-shift-actions">
                          <button className="btn-approve" onClick={() => handleApproveShift(shift.id)}>Approve</button>
                          <button className="btn-reject" onClick={() => { setRejectModalShift(shift); setRejectReason(''); }}>Reject</button>
                        </div>
                      </div>
                      {shift.timeBlocks && shift.timeBlocks.length > 0 && (
                        <div className="pending-shift-blocks">
                          <small>Time Blocks:</small>
                          {shift.timeBlocks.map((block, idx) => (
                            <div key={idx} className={`mini-block ${block.isBreak || block.is_break ? 'break' : ''}`}>
                              <span>{formatTime(block.startTime || block.start_time)} - {formatTime(block.endTime || block.end_time)}</span>
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
                    {/* Weeks Sidebar */}
                    {showWeeksSidebar && (
                      <div className="weeks-sidebar">
                        <div className="weeks-sidebar-header">
                          <h4>Select Week</h4>
                          <button className="btn-close-sidebar" onClick={() => setShowWeeksSidebar(false)}>&times;</button>
                        </div>
                        <div className="weeks-list">
                          {availableWeeks.map((week, idx) => (
                            <button
                              key={idx}
                              className={`week-option ${week.weekStart === currentWeekStart ? 'active' : ''}`}
                              onClick={() => {
                                loadWeeklyView(week.weekStart);
                                setShowWeeksSidebar(false);
                              }}
                            >
                              <span className="week-dates">{week.display}</span>
                              <span className="week-shift-count">{week.shiftCount} shifts</span>
                            </button>
                          ))}
                          {availableWeeks.length === 0 && (
                            <p className="no-weeks-msg">No weeks with shifts found</p>
                          )}
                        </div>
                      </div>
                    )}

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
                        <h3>{weeklyViewData?.weekDisplay || 'Loading...'}</h3>
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
                    <div className="weekly-combined-view">
                      {/* Thin Employee List Sidebar */}
                      <div className={`weekly-sidebar ${weeklyViewMode === 'calendar' ? 'mobile-hidden' : ''}`}>
                        <div className="sidebar-header">Employee</div>
                        {weeklyViewData.employees.filter(emp => emp.shifts.length > 0).map(emp => (
                          <div
                            key={emp.userId}
                            className="sidebar-employee"
                            onClick={() => loadUserPayWeeks(emp.userId)}
                            style={{ borderLeftColor: `hsl(${(emp.userId * 137) % 360}, 70%, 50%)` }}
                          >
                            <span className="emp-name">{emp.userName}</span>
                            <span className="emp-hours">{emp.totalHours}h</span>
                          </div>
                        ))}
                        {weeklyViewData.employees.filter(emp => emp.shifts.length === 0).length > 0 && (
                          <div className="sidebar-section-label">No Shifts</div>
                        )}
                        {weeklyViewData.employees.filter(emp => emp.shifts.length === 0).map(emp => (
                          <div
                            key={emp.userId}
                            className="sidebar-employee no-shifts"
                            onClick={() => loadUserPayWeeks(emp.userId)}
                          >
                            <span className="emp-name">{emp.userName}</span>
                          </div>
                        ))}
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

                        {/* Employee Rows */}
                        {weeklyViewData.employees.filter(emp => emp.shifts.length > 0).map(emp => {
                          const empColor = `hsl(${(emp.userId * 137) % 360}, 70%, 50%)`;
                          return (
                            <div key={emp.userId} className="calendar-employee-row">
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
                      const clockIn = activity.details?.clockIn ? formatTime(activity.details.clockIn) : null;
                      const clockOut = activity.details?.clockOut ? formatTime(activity.details.clockOut) : null;
                      const timeRange = clockIn && clockOut ? ` (${clockIn} - ${clockOut})` : '';

                      // Determine activity status class
                      const getActivityClass = () => {
                        if (activity.action === 'shift_submitted' || activity.action === 'shift_created') {
                          return 'activity-pending';
                        }
                        if (activity.action === 'shift_approved') {
                          return 'activity-approved';
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
                              : <><strong>{adminName}</strong> created shift for <strong>{targetName}</strong></>;
                          case 'shift_approved':
                            return (
                              <>
                                <strong>{adminName}</strong> approved <strong>{targetName}'s</strong> shift
                                <span className="approval-timestamp">Approved {formatActivityTime(activity.created_at)}</span>
                              </>
                            );
                          case 'shift_rejected':
                            return <><strong>{adminName}</strong> rejected <strong>{targetName}'s</strong> shift</>;
                          case 'shift_updated':
                            return <><strong>{adminName}</strong> edited <strong>{targetName}'s</strong> shift</>;
                          case 'shift_deleted':
                            return <><strong>{adminName}</strong> deleted <strong>{targetName}'s</strong> shift</>;
                          default:
                            return <><strong>{adminName}</strong> {activity.action.replace(/_/g, ' ')} <strong>{targetName}</strong></>;
                        }
                      };

                      return (
                        <div key={i} className={`activity-item ${getActivityClass()}`}>
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
          </div>{/* End admin-layout */}
        </main>
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

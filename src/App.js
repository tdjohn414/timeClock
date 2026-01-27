import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { shiftsAPI, authAPI } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

// Hardcoded admin email
const ADMIN_EMAIL = 'tyler@fullscopeestimating.com';

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
  const isAdmin = user?.email === ADMIN_EMAIL;
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

  // Load admin shifts when admin tab is selected
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin && adminShifts.length === 0) {
      const loadAdminShifts = async () => {
        setAdminLoading(true);
        try {
          const data = await shiftsAPI.getAllAdmin();
          setAdminShifts(data);
        } catch (err) {
          console.error('Failed to load admin shifts:', err);
        } finally {
          setAdminLoading(false);
        }
      };
      loadAdminShifts();
    }
  }, [activeTab, isAdmin, adminShifts.length]);

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

  const handleClockIn = () => {
    const newBlock = {
      id: Date.now(),
      startTime: getStartTime(),
      endTime: '',
      tasks: ''
    };
    setCurrentBlock(newBlock);
    setCurrentTasks(['']);
  };

  // Join tasks array into a string, filtering empty entries
  const joinTasks = (tasksArray) => {
    return tasksArray.filter(t => t.trim()).join(' • ');
  };

  const handleAdvanceBlock = () => {
    if (!currentBlock || !currentBlock.endTime) return;

    // Join tasks before completing
    const completedBlock = {
      ...currentBlock,
      tasks: joinTasks(currentTasks)
    };

    // Trigger swipe animation
    setSwipingBlockId(currentBlock.id);

    setTimeout(() => {
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

  const handleBreak = () => {
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
    if (currentBlock.startTime && joinedTasks) {
      setCompletedBlocks([...completedBlocks, { ...currentBlock, tasks: joinedTasks, endTime: breakStartTime }]);
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

    setTimeout(() => {
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

  // Actually save the shift after confirmation
  const confirmSave = async () => {
    if (!previewShiftData) return;

    setSaving(true);
    try {
      const newShift = await shiftsAPI.create(previewShiftData);
      setShifts([newShift, ...shifts]);

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

  const formatTime = (time) => {
    if (!time) return '--:--';

    let timeStr = time;

    // Handle Date objects
    if (time instanceof Date) {
      const h = time.getHours();
      const m = time.getMinutes();
      timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Handle object with hours/minutes (some DB drivers return this)
    if (typeof time === 'object' && time !== null && !Array.isArray(time)) {
      if ('hours' in time || 'minutes' in time) {
        const h = time.hours || 0;
        const m = time.minutes || 0;
        timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }

    // Ensure it's a string
    if (typeof timeStr !== 'string') {
      console.log('Unexpected time format:', time, typeof time);
      return '--:--';
    }

    // Handle both "HH:MM" and "HH:MM:SS" formats
    const parts = timeStr.split(':');
    if (parts.length < 2) return '--:--';
    const hours = parts[0];
    const minutes = parts[1];
    const hour = parseInt(hours);
    if (isNaN(hour)) return '--:--';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
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

      <header className="header">
        <div className="header-top">
          <h1>Time Clock</h1>
          <div className="header-right">
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
                      // Add to first empty slot or append
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
            <div className="user-info">
              <div className="user-dropdown-container" ref={dropdownRef}>
                <button
                  className="user-name-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
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
                      Reset Password
                    </button>
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

      {/* Tab Navigation */}
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
        {isAdmin && (
          <button
            className={`tab-btn admin-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin View
          </button>
        )}
      </div>

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
                {saving ? 'Saving...' : 'Save Shift'}
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
                  return (
                    <div key={shiftId} className={`history-item ${isExpanded ? 'expanded' : ''}`}>
                      <div className="history-header">
                        <div
                          className="history-header-left"
                          onClick={() => toggleShiftExpanded(shiftId)}
                        >
                          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                          <span className="history-date">{formatDate(shift.date)}</span>
                          <span className="history-times-inline">
                            {formatTime(shift.clockInTime)} - {formatTime(shift.clockOutTime)}
                          </span>
                        </div>
                        <div className="history-header-right">
                          <span className="history-hours">{shift.totalHours} hrs</span>
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
        /* Admin View Tab */
        <main className="history-tab admin-view">
          <section className="shift-history-full">
            <h2>All Users' Shifts</h2>
            {adminLoading ? (
              <p className="loading-text">Loading all shifts...</p>
            ) : adminShifts.length === 0 ? (
              <p className="empty-text">No shifts from any users yet</p>
            ) : (
              <div className="history-list">
                {adminShifts.map((shift) => {
                  const shiftId = shift._id || shift.id;
                  const isExpanded = expandedShifts.has(shiftId);
                  return (
                    <div key={shiftId} className={`history-item ${isExpanded ? 'expanded' : ''}`}>
                      <div className="history-header">
                        <div
                          className="history-header-left"
                          onClick={() => toggleShiftExpanded(shiftId)}
                        >
                          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                          <span className="admin-user-name">{shift.userName || 'Unknown'}</span>
                          <span className="history-date">{formatDate(shift.date)}</span>
                          <span className="history-times-inline">
                            {formatTime(shift.clockInTime)} - {formatTime(shift.clockOutTime)}
                          </span>
                        </div>
                        <div className="history-header-right">
                          <span className="history-hours">{shift.totalHours} hrs</span>
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
        <h1>Time Clock</h1>
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

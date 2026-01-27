import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { shiftsAPI } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function TimeClock() {
  const { user, logout } = useAuth();
  const [completedBlocks, setCompletedBlocks] = useState([]);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null); // For "going back in time"
  const [swipingBlockId, setSwipingBlockId] = useState(null);
  const [testBlocks, setTestBlocks] = useState(5);
  const [testBreaks, setTestBreaks] = useState(2);
  const [nowOffsetHours, setNowOffsetHours] = useState(0);
  const [nowOffsetMins, setNowOffsetMins] = useState(0);
  const [lastNowTime, setLastNowTime] = useState(null); // Track virtual "now" for testing
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'history'
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

  const getCurrentTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + nowOffsetHours);
    now.setMinutes(now.getMinutes() + nowOffsetMins);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const addMinutesToTime = (time, minutesToAdd) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const calculateBlockHours = (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    const startDate = new Date(`2000-01-01T${startTime}`);
    const endDate = new Date(`2000-01-01T${endTime}`);
    const diffMs = endDate - startDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 ? diffHours.toFixed(2) : '0.00';
  };

  const handleClockIn = () => {
    const newBlock = {
      id: Date.now(),
      startTime: getCurrentTime(),
      endTime: '',
      tasks: ''
    };
    setCurrentBlock(newBlock);
  };

  const handleAdvanceBlock = () => {
    if (!currentBlock || !currentBlock.endTime) return;

    // Trigger swipe animation
    setSwipingBlockId(currentBlock.id);

    setTimeout(() => {
      // Move current block to completed
      setCompletedBlocks([...completedBlocks, currentBlock]);

      // Create new current block with previous end time as start
      const newBlock = {
        id: Date.now(),
        startTime: currentBlock.endTime,
        endTime: '',
        tasks: ''
      };
      setCurrentBlock(newBlock);
      setSwipingBlockId(null);
      setEditingBlock(null);
    }, 400);
  };

  const handleBreak = () => {
    if (!currentBlock) return;

    const startTime = getCurrentTime();
    const endTime = addMinutesToTime(startTime, 15);

    // Complete current block first if it has content
    if (currentBlock.startTime && currentBlock.tasks) {
      setCompletedBlocks([...completedBlocks, { ...currentBlock, endTime: startTime }]);
    }

    // Create break block and immediately complete it
    const breakBlock = {
      id: Date.now(),
      startTime,
      endTime,
      tasks: '15 min Break',
      isBreak: true
    };

    setSwipingBlockId(breakBlock.id);

    setTimeout(() => {
      setCompletedBlocks(prev => [...prev, breakBlock]);

      // Create new current block starting after break
      const newBlock = {
        id: Date.now() + 1,
        startTime: endTime,
        endTime: '',
        tasks: ''
      };
      setCurrentBlock(newBlock);
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
    // Save current block state and edit the selected block
    setEditingBlock(block);
    // Remove from completed blocks
    setCompletedBlocks(completedBlocks.filter(b => b.id !== block.id));
  };

  const handleSaveEdit = () => {
    if (!editingBlock) return;

    // Swipe the edited block back to completed
    setSwipingBlockId(editingBlock.id);

    setTimeout(() => {
      // Add back to completed blocks in correct position (sorted by start time)
      const updatedBlocks = [...completedBlocks, editingBlock].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
      setCompletedBlocks(updatedBlocks);
      setEditingBlock(null);
      setSwipingBlockId(null);
    }, 400);
  };

  const handleCancelEdit = () => {
    // Restore the editing block to completed without changes
    if (editingBlock) {
      const updatedBlocks = [...completedBlocks, editingBlock].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
      setCompletedBlocks(updatedBlocks);
    }
    setEditingBlock(null);
  };

  const removeCompletedBlock = (id) => {
    setCompletedBlocks(completedBlocks.filter(b => b.id !== id));
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
    }
    setEditingBlock(null);
  };

  const clearAll = () => {
    setCompletedBlocks([]);
    setCurrentBlock(null);
    setEditingBlock(null);
  };

  const calculateTotalHours = () => {
    let total = 0;
    [...completedBlocks, currentBlock].filter(Boolean).forEach(block => {
      const hrs = calculateBlockHours(block.startTime, block.endTime);
      if (hrs) total += parseFloat(hrs);
    });
    return total.toFixed(2);
  };

  const saveShift = async () => {
    const allBlocks = [...completedBlocks];
    if (currentBlock && currentBlock.startTime && currentBlock.tasks) {
      allBlocks.push(currentBlock);
    }

    const validBlocks = allBlocks.filter(block => block.startTime && block.tasks);

    if (validBlocks.length === 0) {
      alert('Please add at least one time block with a start time and tasks');
      return;
    }

    const sortedBlocks = validBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const clockInTime = sortedBlocks[0].startTime;
    const clockOutTime = sortedBlocks[sortedBlocks.length - 1].endTime || sortedBlocks[sortedBlocks.length - 1].startTime;
    const totalHours = calculateTotalHours();

    const shiftData = {
      date: currentDate,
      clockInTime,
      clockOutTime,
      totalHours,
      timeBlocks: sortedBlocks
    };

    setSaving(true);
    try {
      const newShift = await shiftsAPI.create(shiftData);
      setShifts([newShift, ...shifts]);
      clearAll();
    } catch (err) {
      alert('Failed to save shift: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const blockCount = completedBlocks.length + (currentBlock ? 1 : 0);

  return (
    <div className="app">
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
                <span className="now-offset-label">Now +</span>
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
                      updateCurrentBlock('tasks', randomTask);
                    }
                  }}
                  disabled={!currentBlock}
                >
                  Random Task
                </button>
              </div>
            </div>
            <div className="user-info">
              <span>{user.name}</span>
              <button className="btn-logout" onClick={logout}>Logout</button>
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
                        <button
                          type="button"
                          className="btn-now"
                          onClick={() => updateEditingBlock('startTime', getCurrentTime())}
                        >
                          Now
                        </button>
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
                          onClick={() => updateEditingBlock('endTime', getCurrentTime())}
                        >
                          Now
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="task-field">
                    <label>Tasks</label>
                    <input
                      type="text"
                      value={editingBlock.tasks}
                      onChange={(e) => updateEditingBlock('tasks', e.target.value)}
                      placeholder="What did you work on?"
                    />
                  </div>
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
                      <label>Start</label>
                      <div className="time-input-group">
                        <input
                          type="time"
                          value={currentBlock.startTime}
                          onChange={(e) => updateCurrentBlock('startTime', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-now"
                          onClick={() => updateCurrentBlock('startTime', getCurrentTime())}
                        >
                          Now
                        </button>
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
                          onClick={() => updateCurrentBlock('endTime', getCurrentTime())}
                        >
                          Now
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="task-field">
                    <label>Tasks</label>
                    <input
                      type="text"
                      value={currentBlock.tasks}
                      onChange={(e) => updateCurrentBlock('tasks', e.target.value)}
                      placeholder="What did you work on?"
                    />
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
                      disabled={!currentBlock.endTime || !currentBlock.tasks}
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
                onClick={saveShift}
                disabled={completedBlocks.length === 0 && !currentBlock || saving}
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
                {completedBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`completed-block ${block.isBreak ? 'break-block' : ''}`}
                  >
                    <div className="completed-header">
                      <span className="completed-number">
                        {block.isBreak ? 'Break' : `Block ${index + 1}`}
                      </span>
                      <span className="completed-hours">
                        {calculateBlockHours(block.startTime, block.endTime)} hrs
                      </span>
                    </div>
                    <div className="completed-times">
                      {formatTime(block.startTime)} - {formatTime(block.endTime)}
                    </div>
                    <div className="completed-task">{block.tasks}</div>
                    <div className="completed-actions">
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleEditBlock(block)}
                        disabled={editingBlock !== null}
                      >
                        Edit
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
                ))}
              </div>
            )}
          </section>
        </main>
      ) : (
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
                {shifts.map((shift) => (
                  <div key={shift._id || shift.id} className="history-item">
                    <div className="history-header">
                      <span className="history-date">{formatDate(shift.date)}</span>
                      <span className="history-hours">{shift.totalHours} hrs</span>
                    </div>
                    <div className="history-times">
                      {formatTime(shift.clockInTime)} - {formatTime(shift.clockOutTime)}
                    </div>
                    {shift.timeBlocks && shift.timeBlocks.length > 0 && (
                      <div className="history-tasks">
                        {shift.timeBlocks.filter(b => !b.isBreak).map((block, i) => (
                          <div key={i} className="history-task">
                            <span className="task-time">{formatTime(block.startTime)}</span>
                            <span className="task-text">{block.tasks}</span>
                            {calculateBlockHours(block.startTime, block.endTime) && (
                              <span className="task-hours">{calculateBlockHours(block.startTime, block.endTime)}h</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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

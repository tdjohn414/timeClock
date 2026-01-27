import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { shiftsAPI } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function TimeClock() {
  const { user, logout } = useAuth();
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [testBlocks, setTestBlocks] = useState(5);
  const [testBreaks, setTestBreaks] = useState(2);
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

  // Load shifts from API on mount
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
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const handleBreak = () => {
    const startTime = getCurrentTime();
    const endTime = addMinutesToTime(startTime, 15);
    const newBlock = {
      id: Date.now(),
      startTime,
      endTime,
      tasks: '15 min Break',
      isBreak: true
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const addTimeBlock = () => {
    const lastEndTime = timeBlocks.length > 0 ? timeBlocks[timeBlocks.length - 1].endTime : '';
    const newBlock = {
      id: Date.now(),
      startTime: lastEndTime,
      endTime: '',
      tasks: ''
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const updateTimeBlock = (id, field, value) => {
    setTimeBlocks(
      timeBlocks.map(block =>
        block.id === id ? { ...block, [field]: value } : block
      )
    );
  };

  const removeTimeBlock = (id) => {
    setTimeBlocks(timeBlocks.filter(block => block.id !== id));
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

    setTimeBlocks(blocks);
  };

  const calculateTotalHours = () => {
    let total = 0;
    timeBlocks.forEach(block => {
      const hrs = calculateBlockHours(block.startTime, block.endTime);
      if (hrs) total += parseFloat(hrs);
    });
    return total.toFixed(2);
  };

  const saveShift = async () => {
    const validBlocks = timeBlocks.filter(block => block.startTime && block.tasks);

    if (validBlocks.length === 0) {
      alert('Please add at least one time block with a start time and tasks');
      return;
    }

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

    setSaving(true);
    try {
      const newShift = await shiftsAPI.create(shiftData);
      setShifts([newShift, ...shifts]);
      setTimeBlocks([]);
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

  const lastBlockIndex = timeBlocks.length - 1;
  const lastBlock = timeBlocks[lastBlockIndex];
  const showBreakButton = lastBlock && !lastBlock.isBreak;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Time Clock</h1>
          <div className="header-right">
            <div className="test-controls">
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
              {timeBlocks.length > 0 && (
                <button type="button" className="btn-clear" onClick={() => setTimeBlocks([])}>
                  Clear
                </button>
              )}
            </div>
            <div className="user-info">
              <span>{user.name}</span>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-grid">
        {/* Left Column - Time Entry */}
        <section className="time-entry">
          <div className="section-header">
            <h2>Today's Shift</h2>
            <div className="date-picker">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="blocks-container">
            {timeBlocks.length === 0 ? (
              <div className="empty-state">
                <p>No time blocks yet</p>
                <button type="button" className="btn-clock-in" onClick={handleClockIn}>
                  Clock In
                </button>
              </div>
            ) : (
              <>
                {timeBlocks.map((block, index) => {
                  const blockHours = calculateBlockHours(block.startTime, block.endTime);
                  const isLast = index === lastBlockIndex;
                  return (
                    <div key={block.id} className={`time-block ${block.isBreak ? 'break-block' : ''}`}>
                      <div className="block-header">
                        <span className="block-number">
                          {block.isBreak ? 'Break' : `Block ${index + 1}`}
                        </span>
                        {blockHours && (
                          <span className="block-hours">{blockHours} hrs</span>
                        )}
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeTimeBlock(block.id)}
                        >
                          &times;
                        </button>
                      </div>
                      <div className="block-times">
                        <div className="time-field">
                          <label>Start</label>
                          <div className="time-input-group">
                            <input
                              type="time"
                              value={block.startTime}
                              onChange={(e) => updateTimeBlock(block.id, 'startTime', e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-now"
                              onClick={() => updateTimeBlock(block.id, 'startTime', getCurrentTime())}
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
                              value={block.endTime}
                              onChange={(e) => updateTimeBlock(block.id, 'endTime', e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-now"
                              onClick={() => updateTimeBlock(block.id, 'endTime', getCurrentTime())}
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
                          value={block.tasks}
                          onChange={(e) => updateTimeBlock(block.id, 'tasks', e.target.value)}
                          placeholder="What did you work on?"
                        />
                      </div>
                      {isLast && (
                        <div className="block-actions">
                          {showBreakButton && (
                            <button type="button" className="btn-break" onClick={handleBreak}>
                              + Break
                            </button>
                          )}
                          <button type="button" className="btn-add-block" onClick={addTimeBlock}>
                            + Add Block
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
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
              disabled={timeBlocks.length === 0 || saving}
            >
              {saving ? 'Saving...' : 'Save Shift'}
            </button>
          </div>
        </section>

        {/* Right Column - Shift History */}
        <section className="shift-history">
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

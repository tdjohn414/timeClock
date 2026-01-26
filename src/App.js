import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [shifts, setShifts] = useState([]);

  // Load saved shifts from localStorage on mount
  useEffect(() => {
    const savedShifts = localStorage.getItem('timeClockShifts');
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    }
  }, []);

  // Save shifts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timeClockShifts', JSON.stringify(shifts));
  }, [shifts]);

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

  const handleClockIn = () => {
    // Create a new block with start time set to now
    setTimeBlocks([
      ...timeBlocks,
      {
        id: Date.now(),
        startTime: getCurrentTime(),
        endTime: '',
        tasks: ''
      }
    ]);
  };

  const setBlockStartNow = (blockId) => {
    setTimeBlocks(
      timeBlocks.map(block =>
        block.id === blockId ? { ...block, startTime: getCurrentTime() } : block
      )
    );
  };

  const setBlockEndNow = (blockId) => {
    setTimeBlocks(
      timeBlocks.map(block =>
        block.id === blockId ? { ...block, endTime: getCurrentTime() } : block
      )
    );
  };

  const handleBreak = () => {
    const startTime = getCurrentTime();
    const endTime = addMinutesToTime(startTime, 15);

    setTimeBlocks([
      ...timeBlocks,
      {
        id: Date.now(),
        startTime,
        endTime,
        tasks: '15 min Break',
        isBreak: true
      }
    ]);
  };

  const handleExtendBreak = (blockId) => {
    const reason = prompt('Why do you need to extend your break?');
    if (reason === null) return; // User cancelled

    setTimeBlocks(
      timeBlocks.map(block => {
        if (block.id === blockId && block.isBreak) {
          const newEndTime = getCurrentTime();
          const extensionNote = reason.trim() ? ` (Extended: ${reason})` : ' (Extended)';
          return {
            ...block,
            endTime: newEndTime,
            tasks: block.tasks.replace(/15 min Break|Break/, 'Break') + extensionNote
          };
        }
        return block;
      })
    );
  };

  const addTimeBlock = () => {
    // Get the end time of the last block as the start time for the new block
    const lastEndTime = timeBlocks.length > 0 ? timeBlocks[timeBlocks.length - 1].endTime : '';

    setTimeBlocks([
      ...timeBlocks,
      {
        id: Date.now(),
        startTime: lastEndTime,
        endTime: '',
        tasks: ''
      }
    ]);
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

  // Infer clock in/out from blocks
  const getClockInTime = () => {
    if (timeBlocks.length === 0) return null;
    return timeBlocks[0].startTime;
  };

  const getClockOutTime = () => {
    if (timeBlocks.length === 0) return null;
    return timeBlocks[timeBlocks.length - 1].endTime;
  };

  const calculateTotalHours = () => {
    const clockIn = getClockInTime();
    const clockOut = getClockOutTime();

    if (!clockIn || !clockOut) return 0;

    const clockInDate = new Date(`2000-01-01T${clockIn}`);
    const clockOutDate = new Date(`2000-01-01T${clockOut}`);
    const diffMs = clockOutDate - clockInDate;
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours > 0 ? diffHours.toFixed(2) : 0;
  };

  const saveShift = () => {
    const validBlocks = timeBlocks.filter(block => block.startTime && block.tasks);

    if (validBlocks.length === 0) {
      alert('Please add at least one time block with a start time and tasks');
      return;
    }

    const clockInTime = validBlocks[0].startTime;
    const clockOutTime = validBlocks[validBlocks.length - 1].endTime || validBlocks[validBlocks.length - 1].startTime;

    const clockInDate = new Date(`2000-01-01T${clockInTime}`);
    const clockOutDate = new Date(`2000-01-01T${clockOutTime}`);
    const diffMs = clockOutDate - clockInDate;
    const totalHours = diffMs > 0 ? (diffMs / (1000 * 60 * 60)).toFixed(2) : 0;

    const newShift = {
      id: Date.now(),
      date: currentDate,
      clockInTime,
      clockOutTime,
      totalHours,
      timeBlocks: validBlocks
    };

    setShifts([newShift, ...shifts]);
    setTimeBlocks([]);
  };

  const deleteShift = (id) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      setShifts(shifts.filter(shift => shift.id !== id));
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const clockInTime = getClockInTime();
  const clockOutTime = getClockOutTime();

  return (
    <div className="app">
      <header className="header">
        <h1>Time Clock</h1>
        <p>Track your work hours and tasks</p>
      </header>

      <main className="main">
        <section className="clock-section">
          <h2>New Shift Entry</h2>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
            />
          </div>

          {clockInTime && (
            <div className="shift-summary">
              <div className="summary-row">
                <span>Clock In:</span>
                <strong>{formatTime(clockInTime)}</strong>
              </div>
              {clockOutTime && (
                <>
                  <div className="summary-row">
                    <span>Clock Out:</span>
                    <strong>{formatTime(clockOutTime)}</strong>
                  </div>
                  <div className="summary-row total">
                    <span>Total Hours:</span>
                    <strong>{calculateTotalHours()}</strong>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="time-blocks-section">
            <div className="section-header">
              <h3>Time Blocks</h3>
              <div className="section-header-buttons">
                <button type="button" className="btn-clock-in" onClick={handleClockIn}>
                  Clock In
                </button>
                <button
                  type="button"
                  className="btn-break"
                  onClick={handleBreak}
                  disabled={timeBlocks.length === 0}
                >
                  Break
                </button>
                <button type="button" className="btn-add" onClick={addTimeBlock}>
                  + Add Block
                </button>
              </div>
            </div>

            {timeBlocks.length === 0 && (
              <p className="hint">Click "Clock In" to start tracking your shift, or add blocks manually</p>
            )}

            {timeBlocks.map((block, index) => (
              <div key={block.id} className={`time-block ${block.isBreak ? 'break-block' : ''}`}>
                <div className="block-header">
                  <div className="block-number">{block.isBreak ? 'Break' : `Block ${index + 1}`}</div>
                  {block.isBreak && (
                    <button
                      type="button"
                      className="btn-extend-break"
                      onClick={() => handleExtendBreak(block.id)}
                    >
                      Extend Break
                    </button>
                  )}
                </div>
                <div className="time-block-times">
                  <div className="time-input-group">
                    <input
                      type="time"
                      placeholder="Start"
                      value={block.startTime}
                      onChange={(e) => updateTimeBlock(block.id, 'startTime', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-now-small btn-start"
                      onClick={() => setBlockStartNow(block.id)}
                      title="Set to current time"
                    >
                      Now
                    </button>
                  </div>
                  <span>to</span>
                  <div className="time-input-group">
                    <input
                      type="time"
                      placeholder="End"
                      value={block.endTime}
                      onChange={(e) => updateTimeBlock(block.id, 'endTime', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-now-small btn-end"
                      onClick={() => setBlockEndNow(block.id)}
                      title="Set to current time"
                    >
                      Now
                    </button>
                  </div>
                </div>
                <textarea
                  placeholder="What did you work on? (e.g., Task A, Task B)"
                  value={block.tasks}
                  onChange={(e) => updateTimeBlock(block.id, 'tasks', e.target.value)}
                  rows={2}
                />
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeTimeBlock(block.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-save"
            onClick={saveShift}
            disabled={timeBlocks.length === 0}
          >
            Save Shift
          </button>
        </section>

        <section className="history-section">
          <h2>Shift History</h2>

          {shifts.length === 0 ? (
            <p className="no-shifts">No shifts recorded yet</p>
          ) : (
            <div className="shifts-list">
              {shifts.map((shift) => (
                <div key={shift.id} className="shift-card">
                  <div className="shift-header">
                    <div className="shift-date">{formatDate(shift.date)}</div>
                    <button
                      className="btn-delete"
                      onClick={() => deleteShift(shift.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="shift-times">
                    <span>{formatTime(shift.clockInTime)}</span>
                    <span className="separator">→</span>
                    <span>{formatTime(shift.clockOutTime)}</span>
                    <span className="total">{shift.totalHours} hrs</span>
                  </div>
                  {shift.timeBlocks.length > 0 && (
                    <div className="shift-tasks">
                      <h4>Tasks:</h4>
                      {shift.timeBlocks.map((block, index) => (
                        <div key={index} className="task-item">
                          <span className="task-time">
                            {formatTime(block.startTime)}{block.endTime ? ` - ${formatTime(block.endTime)}` : ''}
                          </span>
                          <span className="task-desc">{block.tasks}</span>
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

export default App;

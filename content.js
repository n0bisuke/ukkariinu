let isRecording = false;
let recordingCheckInterval = null;
let meetingStartTime = null;
let hasShownWarning = false;
let lastWarningTime = null;
let warningInterval = 60000; // 60秒間隔で再警告

function checkRecordingStatus() {
  const recordButton = document.querySelector('[data-tooltip="録画を開始"]') ||
                      document.querySelector('[aria-label*="録画"]') ||
                      document.querySelector('[aria-label*="Record"]') ||
                      document.querySelector('button[jsname="BOHaEe"]');
  
  const stopRecordButton = document.querySelector('[data-tooltip="録画を停止"]') ||
                          document.querySelector('[aria-label*="録画を停止"]') ||
                          document.querySelector('[aria-label*="Stop recording"]');

  const newIsRecording = !!stopRecordButton;
  
  console.log('Meet Recorder Checker: Checking recording status', {
    recordButton: !!recordButton,
    stopRecordButton: !!stopRecordButton,
    isRecording: newIsRecording,
    meetingStartTime: meetingStartTime,
    hasShownWarning: hasShownWarning
  });
  
  if (newIsRecording !== isRecording) {
    isRecording = newIsRecording;
    updateRecordingStatus();
  }

  if (!isRecording && meetingStartTime) {
    const currentTime = Date.now();
    const meetingDuration = (currentTime - meetingStartTime) / 1000;
    
    console.log('Meet Recorder Checker: Meeting duration check', {
      meetingDuration: meetingDuration,
      threshold: 30,
      lastWarningTime: lastWarningTime,
      timeSinceLastWarning: lastWarningTime ? (currentTime - lastWarningTime) / 1000 : null
    });
    
    // 初回警告（30秒後）または再警告（60秒間隔）
    const shouldShowWarning = (meetingDuration > 30 && !hasShownWarning) || 
                             (hasShownWarning && lastWarningTime && (currentTime - lastWarningTime) > warningInterval);
    
    if (shouldShowWarning) {
      console.log('Meet Recorder Checker: Showing warning!');
      showRecordingWarning();
      hasShownWarning = true;
      lastWarningTime = currentTime;
    }
  }
}

function updateRecordingStatus() {
  const indicator = document.getElementById('meet-recording-indicator');
  if (indicator) {
    indicator.textContent = isRecording ? '🔴 録画中' : '⚠️ 録画していません';
    indicator.className = isRecording ? 'recording-active' : 'recording-inactive';
  }
}

function playWarningSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  } catch (error) {
    console.log('Meet Recorder Checker: Could not play warning sound:', error);
  }
}

function showRecordingWarning() {
  if (document.getElementById('recording-warning-popup')) return;

  alert('⚠️ 録画忘れの可能性\n\nミーティングが30秒以上続いていますが、録画されていません。\n\n録画を開始することをお勧めします。');
  
  playWarningSound();

  const popup = document.createElement('div');
  popup.id = 'recording-warning-popup';
  popup.innerHTML = `
    <div class="warning-content">
      <h3>⚠️ 録画忘れの可能性</h3>
      <p>ミーティングが30秒以上続いていますが、録画されていません。</p>
      <div class="warning-buttons">
        <button id="start-recording-btn">録画開始</button>
        <button id="dismiss-warning-btn">無視</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);

  document.getElementById('start-recording-btn').addEventListener('click', () => {
    const recordButton = document.querySelector('[data-tooltip="録画を開始"]') ||
                        document.querySelector('[aria-label*="録画"]') ||
                        document.querySelector('[aria-label*="Record"]');
    if (recordButton) {
      recordButton.click();
    }
    popup.remove();
  });

  document.getElementById('dismiss-warning-btn').addEventListener('click', () => {
    console.log('Meet Recorder Checker: Warning dismissed, will show again in 60 seconds');
    popup.remove();
  });

  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 10000);
}

function createRecordingIndicator() {
  if (document.getElementById('meet-recording-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'meet-recording-indicator';
  indicator.textContent = '⚠️ 録画していません';
  indicator.className = 'recording-inactive';
  
  const targetContainer = document.querySelector('[data-meeting-title]')?.parentElement ||
                         document.querySelector('.google-material-icons')?.closest('div') ||
                         document.body;
  
  targetContainer.appendChild(indicator);
}

function initializeMeetingDetection() {
  console.log('Meet Recorder Checker: Initializing...', window.location.href);
  
  const url = window.location.href;
  const isMeetPage = url.includes('meet.google.com');
  const isMeetingRoom = url.match(/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
  
  console.log('Meet Recorder Checker: URL check', {
    url: url,
    isMeetPage: isMeetPage,
    isMeetingRoom: !!isMeetingRoom
  });
  
  if (isMeetPage && (isMeetingRoom || url.includes('lookup'))) {
    console.log('Meet Recorder Checker: Meeting detected, starting monitoring');
    meetingStartTime = Date.now();
    hasShownWarning = false;
    lastWarningTime = null;
    
    createRecordingIndicator();
    
    if (recordingCheckInterval) {
      clearInterval(recordingCheckInterval);
    }
    recordingCheckInterval = setInterval(checkRecordingStatus, 2000);
    
    setTimeout(() => {
      checkRecordingStatus();
    }, 3000);
  } else {
    console.log('Meet Recorder Checker: Not a meeting page, skipping initialization');
  }
}

function cleanup() {
  if (recordingCheckInterval) {
    clearInterval(recordingCheckInterval);
    recordingCheckInterval = null;
  }
  
  const indicator = document.getElementById('meet-recording-indicator');
  if (indicator) {
    indicator.remove();
  }
  
  const popup = document.getElementById('recording-warning-popup');
  if (popup) {
    popup.remove();
  }
}

let currentUrl = window.location.href;
function checkUrlChange() {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    cleanup();
    setTimeout(initializeMeetingDetection, 1000);
  }
}

console.log('Meet Recorder Checker: Content script loaded!');

function forceInitialize() {
  console.log('Meet Recorder Checker: Force initializing...');
  initializeMeetingDetection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', forceInitialize);
} else {
  forceInitialize();
}

setTimeout(forceInitialize, 2000);
setTimeout(forceInitialize, 5000);

setInterval(checkUrlChange, 1000);

window.addEventListener('beforeunload', cleanup);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getRecordingStatus') {
    sendResponse({
      isRecording: isRecording,
      meetingStartTime: meetingStartTime,
      hasShownWarning: hasShownWarning
    });
  } else if (request.action === 'checkMeeting') {
    initializeMeetingDetection();
  }
  return true;
});
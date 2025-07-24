document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('recording-status');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    if (currentTab.url && currentTab.url.includes('meet.google.com')) {
      chrome.tabs.sendMessage(currentTab.id, {action: 'getRecordingStatus'}, function(response) {
        if (chrome.runtime.lastError) {
          statusElement.innerHTML = '<div>⚠️ Meet拡張が読み込まれていません</div>';
          statusElement.className = 'status status-inactive';
          return;
        }
        
        if (response && response.isRecording !== undefined) {
          if (response.isRecording) {
            statusElement.innerHTML = '<div>🔴 録画中です</div>';
            statusElement.className = 'status status-active';
          } else {
            statusElement.innerHTML = '<div>⚠️ 録画されていません</div>';
            statusElement.className = 'status status-inactive';
          }
        } else {
          statusElement.innerHTML = '<div>📍 ミーティング検出中...</div>';
          statusElement.className = 'status';
        }
      });
    } else {
      statusElement.innerHTML = '<div>📍 Google Meetページではありません</div>';
      statusElement.className = 'status';
    }
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('meet.google.com')) {
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {action: 'checkMeeting'});
    }, 2000);
  }
});
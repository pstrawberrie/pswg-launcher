<script>
  // import Versions from './components/Versions.svelte'
  import Logo from './assets/images/logo.png'
  import bgVideo from './assets/images/bg.mp4'

  const taskMessages = {
    starting: 'Starting Checks...',
    fileVerificationError: 'Error verifying files',
    fileDownloadError: 'Error downloading files',
    selectInstallDir: 'Select client folder to continue',
    confirmEmptyInstallDir: (dir) =>
      `The selected directory ${dir} is empty - all client files will be downloaded. Proceed?`,
    confirmExistingDir: (dir) =>
      `There are already files in ${dir} - do you want to install pSWG here? Existing SWG files will be overwritten - this could possibly break a different server's client. You can decline and install the pSWG client in a new empty folder if you're unsure.`,
    confirmFileRepair: (dir, numFiles) =>
      `${numFiles} invalid files found in ${dir} - do you want to download new copies? This may break client mods if you have them. You can decline and install the pSWG client in a new empty folder if you're unsure.`,
    readyToPlay: 'Ready'
  }

  // Elements
  let settingsButtonEl
  let videoEl = $state()

  // Settings state
  let installDir = $state('')
  let minimizeToTray = $state(true)
  let minimizeOnPlay = $state(true)
  let disableVideo = $state(false)

  let isSettingsOpen = $state(false)

  // Task state
  let taskMessage = $state(taskMessages.starting)
  let taskProgress = $state(0)
  let taskError = $state(false)

  // Play state
  let readyToPlay = $state(false)
  let fileVerificationError = $state(false)
  let fileDownloadError = $state(false)
  let noInstallDir = $derived(installDir === '')

  function setReadyToPlay() {
    taskMessage = taskMessages.readyToPlay
    taskProgress = 100
    taskError = false
    readyToPlay = true
  }

  // Renderer IPC
  const ipcGetSettings = async () => await window.api.getSettings()
  const ipcSelectInstallDir = async () => (installDir = await window.api.selectInstallDir())
  const ipcSetMinimizeToTray = async (isChecked) => await window.api.setMinimizeToTray(isChecked)
  const ipcSetMinimizeOnPlay = async (isChecked) => await window.api.setMinimizeOnPlay(isChecked)
  const ipcSetDisableVideo = async (isChecked) => await window.api.setDisableVideo(isChecked)

  const ipcPlay = () => window.electron.ipcRenderer.send('playGame')

  // IPC Functions
  function onMinimizeToTrayChange(e) {
    ipcSetMinimizeToTray(e.target.checked)
  }

  function onMinimizeOnPlayChange(e) {
    ipcSetMinimizeOnPlay(e.target.checked)
  }

  function onDisableVideoChange(e) {
    ipcSetDisableVideo(e.target.checked)
    disableVideo = e.target.checked // client-side also needs to immediately update
  }

  function handleGetSettings(settings) {
    console.log(settings)

    installDir = settings.installDir
    minimizeToTray = settings.minimizeToTray
    minimizeOnPlay = settings.minimizeOnPlay
    disableVideo = settings.disableVideo
  }

  function handleTaskEvent(taskData) {
    console.log(taskData)

    if (taskData.ready) {
      setReadyToPlay()
    } else if (taskData.fileDownloadError) {
      fileDownloadError = true
      taskError = true
      taskMessage = taskMessages.fileDownloadError
      taskProgress = 100
    } else if (taskData.fileVerificationError) {
      fileVerificationError = true
      taskError = true
      taskMessage = taskMessages.fileVerificationError
      taskProgress = 100
    } else {
      if (taskData.message) taskMessage = taskData.message
      if (taskData.progress) taskProgress = taskData.progress
    }
  }

  function handleEmptyDirDialog() {}

  // function handleNonEmptyDirDialog() {

  // }

  // On Mount
  $effect(async () => {
    const settings = await ipcGetSettings()
    handleGetSettings(settings)

    window.api.onSettingsEvent((value) => handleGetSettings(value))
    window.api.onTaskEvent((value) => handleTaskEvent(value))

    // check for empty installDir
    if (installDir === '') {
      readyToPlay = false
      taskMessage = taskMessages.selectInstallDir
    }
  })
</script>

<svelte:document
  onkeydown={(e) => {
    if (e.key === 'Escape' && isSettingsOpen) {
      isSettingsOpen = false
    }
  }}
  onclick={(e) => {
    if (isSettingsOpen && e.target !== settingsButtonEl && !e.target.closest('.settings')) {
      isSettingsOpen = false
    }
  }}
  onvisibilitychange={() => {
    if (document.hidden) {
      if (videoEl) videoEl.pause()
    } else {
      if (videoEl) videoEl.play()
    }
  }}
/>

<div class="status">
  <div><span class="i i-power-outline success"></span> Server Status: Online</div>
  <div><span class="i i-group blue"></span> 69 Characters Logged In</div>
  <div><span class="i i-chart-line yellow"></span> Server Uptime: 28d 15h</div>
</div>

<button
  class="open-settings"
  aria-label="settings"
  bind:this={settingsButtonEl}
  onclick={() => {
    isSettingsOpen = !isSettingsOpen
  }}><span class="i i-cog"></span></button
>
<div class={['settings', isSettingsOpen ? 'open' : '']}>
  <div class="title">Settings</div>
  <div>
    <input
      type="checkbox"
      name="minimizeToTray"
      id="minimizeToTray"
      checked={minimizeToTray}
      onchange={onMinimizeToTrayChange}
    />
    <label for="minimizeToTray">Minimize To Tray</label>
  </div>
  <div>
    <input
      type="checkbox"
      name="minimizeOnPlay"
      id="minimizeOnPlay"
      checked={minimizeOnPlay}
      onchange={onMinimizeOnPlayChange}
    />
    <label for="minimizeOnPlay">Minimize On Play</label>
  </div>
  <div>
    <input
      type="checkbox"
      name="disableVideo"
      id="disableVideo"
      checked={disableVideo}
      onchange={onDisableVideoChange}
    />
    <label for="disableVideo">Disable Background</label>
  </div>
</div>

<div class="container">
  <img alt="logo" class="logo" src={Logo} width="517" />
  {#if installDir === ''}
    <button class="action select-install-dir" onclick={ipcSelectInstallDir}>
      <i class="i-folder"></i> Select Client Folder
      <span>If an empty folder is selected, all client files will be downloaded</span>
      <span>The Recommended install location is in a new folder inside of your "Documents"</span>
    </button>
  {/if}
  {#if installDir !== ''}
    <button
      class="action play"
      disabled={!readyToPlay}
      onclick={() => {
        ipcPlay()
      }}>play</button
    >
  {/if}
</div>

<div class={['bottom-menu', installDir === '' ? 'hide-button' : '']}>
  <button class="install-dir" onclick={ipcSelectInstallDir}
    ><span class="i i-folder"></span>{installDir === ''
      ? 'Select Client Folder'
      : installDir}</button
  >
  <div class={['task', taskError ? 'error' : '', readyToPlay ? 'ready' : '']}>
    <div class="message">{taskMessage}</div>
    <div class="progress"><div class="bar" style={`width:${taskProgress}%;`}></div></div>
  </div>
</div>

{#if disableVideo === false}
  <video bind:this={videoEl} width="100%" height="100%" autoplay loop muted>
    <source src={bgVideo} type="video/mp4" />
  </video>
{/if}

{#if disableVideo === true}
  <div class="bg"></div>
{/if}

<!-- <Versions /> -->

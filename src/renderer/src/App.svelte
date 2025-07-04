<script>
  // import Versions from './components/Versions.svelte'
  import { taskMessages } from '../../strings.js'
  import Logo from './assets/images/logo.png'
  import bgVideo from './assets/images/bg.mp4'

  // Elements
  let settingsButtonEl
  let videoEl = $state()

  // Settings state
  let isSettingsOpen = $state(false)

  let installDir = $state('')
  let minimizeToTray = $state(true)
  let minimizeOnPlay = $state(true)
  let disableVideo = $state(false)
  let serverChoice = $state('live')

  // Task state
  let taskMessage = $state(taskMessages.starting)
  let taskProgress = $state(0)
  let taskError = $state(false)

  // Play state
  let readyToPlay = $state(false)
  let makeDirectoriesError = $state(false)
  let fileVerificationError = $state(false)
  let fileDownloadError = $state(false)
  let noInstallDir = $derived(installDir === '')

  function clearErrors() {
    makeDirectoriesError = false
    fileVerificationError = false
    fileDownloadError = false
    taskError = false
  }

  function setReadyToPlay() {
    clearErrors()
    taskMessage = taskMessages.readyToPlay
    taskProgress = 100
    readyToPlay = true
  }

  function removeReadyToPlay() {
    clearErrors()
    taskMessage = ''
    taskProgress = 0
    readyToPlay = false
  }

  // Renderer IPC
  const ipcGetSettings = async () => await window.api.getSettings()
  const ipcSelectInstallDir = async () => {
    installDir = await window.api.selectInstallDir()
    console.log('got install dir, now we can kickoff the verification!')
    ipcVerifyClient()
  }
  const ipcSetMinimizeToTray = async (isChecked) => await window.api.setMinimizeToTray(isChecked)
  const ipcSetMinimizeOnPlay = async (isChecked) => await window.api.setMinimizeOnPlay(isChecked)
  const ipcSetDisableVideo = async (isChecked) => await window.api.setDisableVideo(isChecked)
  const ipcSetServer = async (serverChoice) => await window.api.setServer(serverChoice)

  const ipcVerifyClient = () => window.electron.ipcRenderer.send('verifyClient')
  const ipcSWGSettings = () => window.electron.ipcRenderer.send('SWGSettings')
  const ipcClientFolder = () => window.electron.ipcRenderer.send('clientFolder')
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

  function onServerChange(e) {
    ipcSetServer(e.target.value)
  }

  function handleGetSettings(settings) {
    console.log(settings)

    installDir = settings.installDir
    minimizeToTray = settings.minimizeToTray
    minimizeOnPlay = settings.minimizeOnPlay
    disableVideo = settings.disableVideo
    serverChoice = settings.server
  }

  function handleTaskEvent(taskData) {
    // console.log(taskData)
    if (taskData.ready) {
      setReadyToPlay()
    } else {
      removeReadyToPlay()
    }

    if (taskData.makeDirectoriesError) {
      makeDirectoriesError = true
      taskError = true
      taskMessage = taskMessages.makeDirectoriesError
      taskProgress = 100
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

  // On Mount
  $effect(async () => {
    const settings = await ipcGetSettings()
    handleGetSettings(settings)

    window.api.onSettingsEvent((value) => handleGetSettings(value))
    window.api.onTaskEvent((value) => handleTaskEvent(value))

    // check for empty installDir
    if (noInstallDir) {
      readyToPlay = false
      taskMessage = taskMessages.selectInstallDir
    } else {
      ipcVerifyClient()
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
  {#if !noInstallDir && readyToPlay}
    <div class="title">Settings</div>
    <div class="top">
      <button onclick={ipcSWGSettings}>Launch SWG Settings</button>
      <button class="client-folder" onclick={ipcClientFolder}>Open Client Folder</button>

      <div>
        <label for="serverChoice">Server</label>
        <select onchange={onServerChange} value={serverChoice}>
          <option value="live">pSWG Live</option>
          <option value="local">Local Development</option>
        </select>
      </div>
    </div>
  {/if}
  <div class="bottom">
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
</div>

<div class="container">
  <img alt="logo" class="logo" src={Logo} width="517" />
  {#if noInstallDir}
    <button class="action select-install-dir" onclick={ipcSelectInstallDir}>
      <i class="i-folder"></i> Select Client Folder
      <span>If an empty folder is selected, all client files will be downloaded</span>
      <span>The Recommended install location is in a new folder inside of your "Documents"</span>
    </button>
  {/if}
  {#if !noInstallDir}
    <button class="action play" disabled={!readyToPlay} onclick={ipcPlay}>play</button>
  {/if}
</div>

<div class={['bottom-menu', noInstallDir ? 'hide-button' : '']}>
  <button class="install-dir" onclick={ipcSelectInstallDir}
    ><span class="i i-folder"></span>{noInstallDir ? 'Select Client Folder' : installDir}</button
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

<script>
  // import Versions from './components/Versions.svelte'
  import { taskMessages } from '../../strings.js'
  import Logo from './assets/images/logo.png'
  import bgVideo from './assets/images/bg.mp4'

  // Elements
  let settingsButtonEl
  let infoButtonEl
  let videoEl = $state()

  // Status state
  let statusOnline = $state(false)
  let statusPlayers = $state(0)
  let statusUptime = $state(0)

  // Settings state
  let isSettingsOpen = $state(false)
  let isInfoOpen = $state(false)

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
  let downloading = $state(false)
  let readyToPlay = $state(false)
  let noInstallDir = $derived(installDir === '')

  function clearErrors() {
    taskError = false
  }

  function setReadyToPlay() {
    clearErrors()
    taskMessage = taskMessages.readyToPlay
    taskProgress = 100
    readyToPlay = true
    downloading = false
  }

  function removeReadyToPlay() {
    clearErrors()
    taskMessage = ''
    taskProgress = 0
    readyToPlay = false
  }

  // Renderer IPC
  const ipcGetStatus = async () => await window.api.getStatus()
  const ipcGetSettings = async () => await window.api.getSettings()
  const ipcSelectInstallDir = async () => {
    installDir = await window.api.selectInstallDir()
    // console.log('ipcSelectInstallDir got install dir, now we can kickoff the verification!')
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

  function handleGetStatus(status) {
    // console.log('handleGetStatus: ', status)

    statusOnline = status.online
    statusPlayers = status.players
    statusUptime = status.uptime
  }

  function handleGetSettings(settings) {
    // console.log('handleGetSettings: ', settings)

    installDir = settings.installDir
    minimizeToTray = settings.minimizeToTray
    minimizeOnPlay = settings.minimizeOnPlay
    disableVideo = settings.disableVideo
    serverChoice = settings.server
  }

  function handleTaskEvent(taskData) {
    // console.log('handleTaskEvent: ', taskData)
    if (taskData?.ready) {
      setReadyToPlay()
    } else {
      removeReadyToPlay()
    }

    if (taskData?.message) taskMessage = taskData.message
    if (taskData?.progress) taskProgress = taskData.progress
    if (taskData?.success || (taskData?.progress && taskData?.progress > 0)) taskError = false
    if (taskData?.downloading) downloading = taskData?.downloading
    if (taskData?.error) taskError = true
  }

  // On Mount
  $effect(async () => {
    const status = await ipcGetStatus()
    handleGetStatus(status)

    const settings = await ipcGetSettings()
    handleGetSettings(settings)

    window.api.onStatusEvent((value) => handleGetStatus(value))
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
    if (e.key === 'Escape') {
      if (isSettingsOpen) isSettingsOpen = false
      if (isInfoOpen) isInfoOpen = false
    }
  }}
  onclick={(e) => {
    if (isSettingsOpen && e.target !== settingsButtonEl && !e.target.closest('.settings')) {
      isSettingsOpen = false
    }
    if (isInfoOpen && e.target !== infoButtonEl && !e.target.closest('.info')) {
      isInfoOpen = false
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

<div class={['status', statusOnline ? '' : 'error']}>
  <div>
    <span class="i i-power-outline success"></span> Server Status: {statusOnline
      ? 'online'
      : 'offline'}
  </div>
  <div><span class="i i-group blue"></span> {statusPlayers} Characters Logged In</div>
  <div><span class="i i-chart-line yellow"></span> Server Uptime: {statusUptime}</div>
</div>

<button
  class="open-info"
  aria-label="open info"
  onclick={() => (isInfoOpen = !isInfoOpen)}
  bind:this={infoButtonEl}><span class="i i-info-large"></span></button
>
<button
  class="open-settings"
  aria-label="open settings"
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
      <span>The Recommended fresh install location is in a new folder inside of "Documents"</span>
      <span>You can copy *.tre files to a fresh install directory to speed things up</span>
    </button>
  {/if}
  {#if !noInstallDir}
    <button class="action play" disabled={!readyToPlay || downloading} onclick={ipcPlay}
      >play</button
    >
  {/if}
</div>

<div class={['bottom-menu', noInstallDir ? 'hide-button' : '']}>
  <button class="install-dir" onclick={ipcSelectInstallDir} disabled={downloading}
    ><span class="i i-folder"></span>{noInstallDir ? 'Select Client Folder' : installDir}</button
  >
  <div class={['task', taskError ? 'error' : '', readyToPlay ? 'ready' : '']}>
    <div class="message">{taskMessage}</div>
    <div class="progress">
      <div class="bar" style={`width:${taskProgress}%;`} data-progress={taskProgress}></div>
    </div>
  </div>
</div>

<div class={['info', isInfoOpen ? 'open' : '']}>
  <div class="title">Launcher Info</div>
  <div class="list">
    <ul class="issues">
      <span>Notes</span>
      <li>Change your current install directory by clicking the button on the bottom left</li>
      <li>Provided SWGEmu.exe is set to 144fps max</li>
    </ul>
    <div class="about">
      Built with electron<br /><i class="i i-heart-outline"></i> Have a good day!
    </div>
    <div>
      <a href="https://github.com/pstrawberrie/pswg-launcher" target="_blank"
        >Launcher Github Repo</a
      >
    </div>
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

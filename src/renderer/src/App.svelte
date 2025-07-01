<script>
  // import Versions from './components/Versions.svelte'
  import Logo from './assets/images/logo.png'

  const taskMessages = {
    starting: 'Starting...',
    verifyingFile: 'Verifying file ',
    errorVerifying: 'Error verifying files',
    downloadingFile: 'Downloading file ',
    ready: 'Ready to play'
  }

  let installDir = $state('')
  let minimizeToTray = $state(true)
  let minimizeOnPlay = $state(true)
  let isSettingsOpen = $state(false)
  let taskMessage = $state(taskMessages.starting)

  let settingsButtonEl
  let settingsEl

  const ipcGetSettings = () => window.api.getSettings()
  const ipcPlay = () => window.electron.ipcRenderer.send('playGame')
  const ipcSelectInstallDir = async () => (installDir = await window.api.selectInstallDir())
  const ipcSetMinimizeToTray = async (isChecked) => await window.api.setMinimizeToTray(isChecked)
  const ipcSetMinimizeOnPlay = async (isChecked) => await window.api.setMinimizeOnPlay(isChecked)

  function onMinimizeToTrayChange(e) {
    ipcSetMinimizeToTray(e.target.checked)
  }

  function onMinimizeOnPlayChange(e) {
    ipcSetMinimizeOnPlay(e.target.checked)
  }

  $effect(async () => {
    const settings = await ipcGetSettings()
    installDir = settings.installDir
    minimizeToTray = settings.minimizeToTray
  })
</script>

<svelte:document
  onkeydown={(e) => {
    if (e.key === 'Escape' && isSettingsOpen) {
      isSettingsOpen = false
    }
  }}
  onclick={(e) => {
    if (isSettingsOpen && e.target !== settingsButtonEl) {
      // isSettingsOpen = false
    }
  }}
/>

<div class="status">
  <div><span class="i i-power success"></span> Server Online</div>
  <div><span class="i i-group blue"></span> 0 Players Online</div>
  <div><span class="i i-chart-line yellow"></span> Uptime: 28d 15h</div>
</div>

<button
  class="open-settings"
  aria-label="settings"
  bind:this={settingsButtonEl}
  onclick={() => {
    isSettingsOpen = !isSettingsOpen
  }}><span class="i i-cog"></span></button
>
<div class={['settings', isSettingsOpen ? 'open' : '']} bind:this={settingsEl}>
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
</div>

<div class="container">
  <img alt="logo" class="logo" src={Logo} width="517" />
  <button
    class="play t"
    onclick={() => {
      ipcPlay()
    }}>play</button
  >
</div>

<div class="bottom-menu">
  <button class="install-dir" onclick={ipcSelectInstallDir}
    ><span class="i i-folder"></span> Client folder {installDir}</button
  >
  <div class="task">
    <div class="title">Reading Files...</div>
    <div class="progress"><div class="bar"></div></div>
  </div>
</div>

<div class="bg"></div>
<div class="stars-bg"></div>

<!-- <Versions /> -->

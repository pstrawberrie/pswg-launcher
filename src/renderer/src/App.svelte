<script>
  // import Versions from './components/Versions.svelte'
  import Logo from './assets/images/logo.png'

  const ipcPlay = () => window.electron.ipcRenderer.send('playGame')

  // Select Install Dir
  // @TODO: send dir back to main process: https://www.electronjs.org/docs/latest/tutorial/ipc
  const ipcSelectInstallDir = () => window.electron.ipcRenderer.send('selectInstallDir')
</script>

<div class="status">
  <div><span class="i i-power success"></span> Server Online</div>
  <div><span class="i i-group blue"></span> 0 Players Online</div>
  <div><span class="i i-chart-line yellow"></span> Uptime: 28d 15h</div>
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
  <button class="install-dir" onclick={() => ipcSelectInstallDir()}
    ><span class="i i-folder"></span> Client folder E:/pSWG</button
  >
</div>

<div class="bg"></div>
<div class="stars-bg"></div>

<!-- <Versions /> -->

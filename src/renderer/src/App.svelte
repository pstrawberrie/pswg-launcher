<script>
  import Versions from './components/Versions.svelte'
  import Logo from './assets/images/logo.png'

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<div class="status">status here</div>

<div class="container">
  <img alt="logo" class="logo" src={Logo} width="517" />
  <button class="play t" onclick={ipcHandle}>play</button>
</div>

<div class="bottom-menu">bot menu</div>

<div class="bg"></div>
<div class="stars-bg"></div>

<Versions />

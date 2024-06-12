class App {
  constructor({ button, drawer, content }) {
    this._button = button;
    this._drawer = drawer;
    this._content = content;

    this._initialAppShell();
  }

  _initialAppShell() {
    // Menginisialisasi komponen inti
    // Misalnya, menambahkan event listener ke button hamburger
    this._button.addEventListener('click', (event) => {
      this._toggleDrawer(event);
    });
  }

  _toggleDrawer(event) {
    event.stopPropagation();
    this._drawer.classList.toggle('open');
  }

  async renderPage() {
    const url = window.location.hash.slice(1).toLowerCase();
    this._content.innerHTML = `<h1>${url || 'Home'}</h1>`;
    // Tambahkan logika untuk merender halaman sesuai dengan URL
  }
}

export default App;

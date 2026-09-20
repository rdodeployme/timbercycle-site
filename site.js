(function () {
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? '✕' : '☰';
    });
  }

  var form = document.querySelector('form[data-preview]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form-msg');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (msg) {
        msg.classList.add('show');
        msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
})();

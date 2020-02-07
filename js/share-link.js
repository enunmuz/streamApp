function copyFunction() {
  var inputDump = document.createElement("input"),
    hrefText = window.location.href;
  document.body.appendChild(inputDump);
  inputDump.value = hrefText;
  inputDump.select();
  document.execCommand("copy");
  document.body.removeChild(inputDump);
}

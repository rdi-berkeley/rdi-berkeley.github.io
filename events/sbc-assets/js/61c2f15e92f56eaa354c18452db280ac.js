class UploadWidget {
  width;
  height;
  text;
  widgetId;
  key;
  _location;
  iframe;

  constructor(location, widgetId, bucketId) {
    this.location = location;
    this.width = location.dataset.width || '160' ;
    this.height = location.dataset.height||'160' ;
    this.text = location.dataset.text;
    this.widgetId = widgetId;
    this.key = bucketId;
    this.createWidget()
  }

  set location(value) {
    if (!value) {
      alert("No file input")
      return;
    }
    this._location = value;
  }

  get location(){
    return this._location
  }

  createWidget(){
    let small = "false"
    let iframe = window.document.createElement('iframe');

    if (parseInt(this.width) < 120) {
      small = "true"
    }
    iframe.src = "https://app.simplefileupload.com" + `/buckets/${this.key}?widgetId=${this.widgetId}&elementValue=${this.location.value}&preview=${this.location.dataset.preview}&text=${this.text}&small=${small}`
    iframe.className = 'widgetFrame'
    iframe.width = this.width;
    iframe.height = this.height;
    iframe.style.cssText = 'border:none; opacity:0;'

    this.iframe = iframe;

    //Attach iframe to DOM after the existing file input
    if (!this.location.form) {
      alert("The input you created is not in a form. In order to send the string url to your server the input needs to be in a form. Please reach out at support@simplefileupload.com for assistance.")
      return
    }
    insertAfter(iframe, this.location);
  }

  open() {
    this.iframe.style = 'border:none; opacity:1;'
  }
}

function insertAfter(el, referenceNode) {
  return referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

function uniqueWidget(location) {
  const widgetId = location.dataset.id
  new UploadWidget(location, widgetId, "61c2f15e92f56eaa354c18452db280ac").open();
}

function setInputEl(e) {
  const data = e.data;
  let hiddenInput = document.querySelector(`input.simple-file-upload[data-id="${data.widgetId}"]`)
  //Backwards compatibility - no simple-file-upload class.
  if (hiddenInput == null) {
    hiddenInput = document.querySelector(`input[data-id="${data.widgetId}"]`)
  }
  return hiddenInput;
}

const getUrlData = (e) => {
  if (e.origin !== "https://app.simplefileupload.com")
    return;
  const hiddenInput = setInputEl(e)
  // Handle the event sent to the parent window

  // Multiple upload success
  if(e.data["uploadResult"] == 'queuecomplete') {
    // Do not populate value parameter if multiple uploads (hence responding to queue complete)
    const event = new CustomEvent('multipleUploadComplete', {detail: e.data.widgetId})
    hiddenInput.dispatchEvent(event)
  }
  // Successful single upload
  if (e.data["uploadResult"] == 'success') {
    hiddenInput.value = e.data["url"];

    const event = new Event('fileUploadSuccess')
    hiddenInput.dispatchEvent(event)

    console.log("The URL will automatically be populated as a value in the tag")
    console.log("CDN URL for new file "+ e.data["url"])
  }

  // Drop started
  if (e.data["event"] == 'fileUploadStarted') {
    const event = new Event('fileUploadStarted')
    hiddenInput.dispatchEvent(event)
  }
}

window.addEventListener('message', getUrlData, false);

function setId(location, index) {
  location.type = "hidden"; //Make hidden for legacy implementation
  location.dataset.id = `widget${index}`
  location.dataset.preview ||= "true"
}

document.addEventListener('DOMContentLoaded', function() {
  let locations = document.querySelectorAll("input.simple-file-upload");
  if (locations.length == 0) {
    locations = document.querySelectorAll("input[type=file]");
  }
  locations.forEach(setId);
  locations.forEach(uniqueWidget);
});

document.addEventListener('turbolinks:render', function() {
  let locations = document.querySelectorAll("input.simple-file-upload");
  if (locations.length == 0) {
    locations = document.querySelectorAll("input[type=file]");
  }
  locations.forEach(setId);
  locations.forEach(uniqueWidget);
});

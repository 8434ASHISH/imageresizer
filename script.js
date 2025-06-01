
document.getElementById("kbBtn").onclick = () => {
  document.getElementById("resizeKB").style.display = "block";
  document.getElementById("resizePX").style.display = "none";
};

document.getElementById("pxBtn").onclick = () => {
  document.getElementById("resizeKB").style.display = "none";
  document.getElementById("resizePX").style.display = "block";
};

function showLoader(loaderId, callback) {
  const loader = document.getElementById(loaderId);
  loader.style.display = "inline-block";
  setTimeout(() => {
    loader.style.display = "none";
    callback();
  }, 2000);
}

function resizeImageKB() {
  const file = document.getElementById("imageInputKB").files[0];
  const targetKB = parseInt(document.getElementById("targetSizeKB").value);
  if (!file || !targetKB) return alert("Please upload an image and enter size.");
  showLoader("loaderKB", () => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        let quality = 0.9;
        const targetBytes = targetKB * 1024;
        let output = canvas.toDataURL("image/jpeg", quality);
        while (output.length > targetBytes && quality > 0.1) {
          quality -= 0.05;
          output = canvas.toDataURL("image/jpeg", quality);
        }
        document.getElementById("downloadKB").href = output;
      };
    };
    reader.readAsDataURL(file);
  });
}

function resizeImagePX() {
  const file = document.getElementById("imageInputPX").files[0];
  const width = parseInt(document.getElementById("widthPX").value);
  const height = parseInt(document.getElementById("heightPX").value);
  if (!file || !width || !height) return alert("Please provide image and dimensions.");
  showLoader("loaderPX", () => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const output = canvas.toDataURL("image/jpeg", 0.9);
        document.getElementById("downloadPX").href = output;
      };
    };
    reader.readAsDataURL(file);
  });
}
